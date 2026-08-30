import { useLocation } from 'wouter';
import { LoadingState, AccessDeniedState } from '@/components/ui/states';
import type { UserRole, Permission } from '@shared/permissions';
import { hasPermission, hasAnyPermission, hasAllPermissions, canAccessPage } from '@shared/permissions';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user?: {
    id: number;
    role: UserRole;
    email?: string;
    name?: string;
  };
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  authState: AuthState;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  authState,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  if (authState.isLoading) {
    return <LoadingState message="جاري التحقق من الهوية..." />;
  }

  if (!authState.isAuthenticated) {
    setLocation(redirectTo);
    return null;
  }

  return <>{children}</>;
}

interface RequirePermissionProps {
  children: React.ReactNode;
  authState: AuthState;
  permission: Permission;
  fallback?: React.ReactNode;
}

export function RequirePermission({
  children,
  authState,
  permission,
  fallback
}: RequirePermissionProps) {
  const [, setLocation] = useLocation();
  
  const goHome = () => setLocation('/');

  if (authState.isLoading) {
    return <LoadingState message="جاري التحقق من الصلاحيات..." />;
  }

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <AccessDeniedState 
        title="يجب تسجيل الدخول"
        description="يرجى تسجيل الدخول للوصول إلى هذه الصفحة"
        onGoHome={goHome}
      />
    );
  }

  const userHasPermission = hasPermission(authState.user.role, permission);

  if (!userHasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDeniedState 
        requiredRole={permission}
        onGoHome={goHome}
      />
    );
  }

  return <>{children}</>;
}

interface RequireAnyPermissionProps {
  children: React.ReactNode;
  authState: AuthState;
  permissions: Permission[];
  fallback?: React.ReactNode;
}

export function RequireAnyPermission({
  children,
  authState,
  permissions,
  fallback
}: RequireAnyPermissionProps) {
  const [, setLocation] = useLocation();
  
  const goHome = () => setLocation('/');

  if (authState.isLoading) {
    return <LoadingState message="جاري التحقق من الصلاحيات..." />;
  }

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <AccessDeniedState 
        title="يجب تسجيل الدخول"
        description="يرجى تسجيل الدخول للوصول إلى هذه الصفحة"
        onGoHome={goHome}
      />
    );
  }

  const userHasPermission = hasAnyPermission(authState.user.role, permissions);

  if (!userHasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDeniedState 
        requiredRole={permissions.join(' أو ')}
        onGoHome={goHome}
      />
    );
  }

  return <>{children}</>;
}

interface RequireAllPermissionsProps {
  children: React.ReactNode;
  authState: AuthState;
  permissions: Permission[];
  fallback?: React.ReactNode;
}

export function RequireAllPermissions({
  children,
  authState,
  permissions,
  fallback
}: RequireAllPermissionsProps) {
  const [, setLocation] = useLocation();
  
  const goHome = () => setLocation('/');

  if (authState.isLoading) {
    return <LoadingState message="جاري التحقق من الصلاحيات..." />;
  }

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <AccessDeniedState 
        title="يجب تسجيل الدخول"
        description="يرجى تسجيل الدخول للوصول إلى هذه الصفحة"
        onGoHome={goHome}
      />
    );
  }

  const userHasPermission = hasAllPermissions(authState.user.role, permissions);

  if (!userHasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDeniedState 
        requiredRole={permissions.join(' و ')}
        onGoHome={goHome}
      />
    );
  }

  return <>{children}</>;
}

interface RequireRoleProps {
  children: React.ReactNode;
  authState: AuthState;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

export function RequireRole({
  children,
  authState,
  roles,
  fallback
}: RequireRoleProps) {
  const [, setLocation] = useLocation();
  
  const goHome = () => setLocation('/');

  if (authState.isLoading) {
    return <LoadingState message="جاري التحقق من الدور..." />;
  }

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <AccessDeniedState 
        title="يجب تسجيل الدخول"
        description="يرجى تسجيل الدخول للوصول إلى هذه الصفحة"
        onGoHome={goHome}
      />
    );
  }

  if (!roles.includes(authState.user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDeniedState 
        requiredRole={roles.join(' أو ')}
        onGoHome={goHome}
      />
    );
  }

  return <>{children}</>;
}

interface PageGuardProps {
  children: React.ReactNode;
  authState: AuthState;
  page: string;
  fallback?: React.ReactNode;
}

export function PageGuard({
  children,
  authState,
  page,
  fallback
}: PageGuardProps) {
  const [, setLocation] = useLocation();
  
  const goHome = () => setLocation('/');

  if (authState.isLoading) {
    return <LoadingState message="جاري التحقق..." />;
  }

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <AccessDeniedState 
        title="يجب تسجيل الدخول"
        description="يرجى تسجيل الدخول للوصول إلى هذه الصفحة"
        onGoHome={goHome}
      />
    );
  }

  const hasAccess = canAccessPage(authState.user.role, page);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDeniedState 
        description={`ليس لديك صلاحية الوصول إلى صفحة "${page}"`}
        onGoHome={goHome}
      />
    );
  }

  return <>{children}</>;
}

export function useRoleCheck(authState: AuthState) {
  const checkPermission = (permission: Permission): boolean => {
    if (!authState.user) return false;
    return hasPermission(authState.user.role, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!authState.user) return false;
    return hasAnyPermission(authState.user.role, permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!authState.user) return false;
    return hasAllPermissions(authState.user.role, permissions);
  };

  const checkRole = (roles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  };

  const checkPageAccess = (page: string): boolean => {
    if (!authState.user) return false;
    return canAccessPage(authState.user.role, page);
  };

  return {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkRole,
    checkPageAccess,
    isAdmin: authState.user ? ['system_admin', 'support_admin', 'institution_admin'].includes(authState.user.role) : false,
    isSystemAdmin: authState.user?.role === 'system_admin',
    isSupportAdmin: authState.user?.role === 'support_admin',
    isInstitutionAdmin: authState.user?.role === 'institution_admin',
    isTeacher: authState.user?.role === 'teacher',
    isStudent: authState.user?.role === 'student',
  };
}
