// RBAC Middleware - نظام التحكم بالوصول بناءً على الأدوار
// Sprint 0 - Foundation

import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, hasPermission, hasAnyPermission, isAdminRole, permissions } from '../../shared/permissions';

// واجهة بيانات المستخدم للـ RBAC
export interface RBACUser {
  id: string | number;
  username: string;
  email?: string;
  role: UserRole;
  institutionId?: string | number;
  permissions?: Permission[];
}

// واجهة بيانات جلسة المدير
export interface AdminSessionData {
  adminId: string | number;
  username: string;
  role: string;
  permissions: string[];
}

// Middleware للتحقق من تسجيل الدخول
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = req.session as any;
    
    // التحقق من وجود معرف المستخدم في الجلسة
    if (!session?.userId) {
      return res.status(401).json({ 
        error: 'غير مصرح - يجب تسجيل الدخول',
        code: 'UNAUTHORIZED'
      });
    }
    
    // التحقق من وجود الدور - فشل آمن إذا لم يوجد
    const role = session.userRole;
    if (!role) {
      console.warn(`[RBAC] User ${session.userId} has no role defined, denying access`);
      return res.status(401).json({ 
        error: 'غير مصرح - لم يتم تحديد دور المستخدم',
        code: 'UNAUTHORIZED'
      });
    }
    
    // تحميل بيانات المستخدم من الجلسة (تطابق هيكل الجلسة الفعلي)
    (req as any).rbacUser = {
      id: session.userId,
      username: session.userEmail, // البريد كاسم مستخدم
      email: session.userEmail,
      role: role as UserRole,
      institutionId: session.institutionId,
    } as RBACUser;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'خطأ في التحقق من الهوية' });
  }
};

// دالة مساعدة للحصول على بيانات المستخدم
function getRBACUser(req: Request): RBACUser | undefined {
  return (req as any).rbacUser;
}

// Middleware للتحقق من صلاحية معينة
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getRBACUser(req);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'غير مصرح - يجب تسجيل الدخول',
          code: 'UNAUTHORIZED'
        });
      }
      
      if (!hasPermission(user.role, permission)) {
        console.log(`[RBAC] Access denied: ${user.username} tried ${permission}`);
        
        return res.status(403).json({ 
          error: 'غير مصرح - لا تملك الصلاحية للقيام بهذا الإجراء',
          code: 'FORBIDDEN',
          requiredPermission: permission,
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
    }
  };
};

// Middleware للتحقق من أي صلاحية من قائمة
export const requireAnyPermission = (permissionsToCheck: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getRBACUser(req);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'غير مصرح - يجب تسجيل الدخول',
          code: 'UNAUTHORIZED'
        });
      }
      
      if (!hasAnyPermission(user.role, permissionsToCheck)) {
        console.log(`[RBAC] Access denied: ${user.username} tried any of ${permissionsToCheck.join(', ')}`);
        
        return res.status(403).json({ 
          error: 'غير مصرح - لا تملك الصلاحية للقيام بهذا الإجراء',
          code: 'FORBIDDEN',
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
    }
  };
};

// Middleware للتحقق من دور معين
export const requireRole = (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getRBACUser(req);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'غير مصرح - يجب تسجيل الدخول',
          code: 'UNAUTHORIZED'
        });
      }
      
      if (!allowedRoles.includes(user.role)) {
        console.log(`[RBAC] Role denied: ${user.username} (${user.role}) tried to access ${allowedRoles.join(', ')}`);
        
        return res.status(403).json({ 
          error: 'غير مصرح - الدور الحالي لا يسمح بهذا الإجراء',
          code: 'FORBIDDEN',
          requiredRoles: allowedRoles,
        });
      }
      
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({ error: 'خطأ في التحقق من الدور' });
    }
  };
};

// Middleware للتحقق من أن المستخدم مدير
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = req.session as any;
    
    // التحقق من جلسة المدير (باستخدام الهيكل الفعلي: isAdmin + adminId)
    if (session?.isAdmin && session?.adminId) {
      (req as any).adminSession = {
        adminId: session.adminId,
        username: session.adminUsername || 'admin',
        role: session.adminRole || 'admin',
        permissions: session.adminPermissions || ['all'],
      } as AdminSessionData;
      return next();
    }
    
    // التحقق من المستخدم العادي بدور إداري
    const user = getRBACUser(req);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'غير مصرح - يجب تسجيل الدخول',
        code: 'UNAUTHORIZED'
      });
    }
    
    if (!isAdminRole(user.role)) {
      console.log(`[RBAC] Admin access denied: ${user.username} (${user.role})`);
      
      return res.status(403).json({ 
        error: 'غير مصرح - يجب أن تكون مديراً',
        code: 'FORBIDDEN'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'خطأ في التحقق من صلاحيات المدير' });
  }
};

// Middleware للتحقق من صلاحية الوصول للمؤسسة
export const requireInstitutionAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getRBACUser(req);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'غير مصرح - يجب تسجيل الدخول',
        code: 'UNAUTHORIZED'
      });
    }
    
    const institutionId = req.params.institutionId || req.body.institutionId;
    
    // system_admin يمكنه الوصول لكل المؤسسات
    if (user.role === 'system_admin') {
      return next();
    }
    
    // التحقق من أن المستخدم ينتمي للمؤسسة
    if (user.institutionId && String(user.institutionId) === String(institutionId)) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'غير مصرح - لا تملك صلاحية الوصول لهذه المؤسسة',
      code: 'FORBIDDEN'
    });
  } catch (error) {
    console.error('Institution access middleware error:', error);
    res.status(500).json({ error: 'خطأ في التحقق من صلاحية الوصول للمؤسسة' });
  }
};

// Middleware للتحقق من ملكية المورد
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getRBACUser(req);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'غير مصرح - يجب تسجيل الدخول',
          code: 'UNAUTHORIZED'
        });
      }
      
      // المدراء يمكنهم الوصول لكل الموارد
      if (isAdminRole(user.role)) {
        return next();
      }
      
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (String(user.id) !== String(resourceUserId)) {
        return res.status(403).json({ 
          error: 'غير مصرح - لا تملك صلاحية الوصول لهذا المورد',
          code: 'FORBIDDEN'
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership middleware error:', error);
      res.status(500).json({ error: 'خطأ في التحقق من الملكية' });
    }
  };
};

// تصدير الـ permissions للاستخدام في الـ routes
export { permissions };
