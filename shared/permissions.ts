// نظام الصلاحيات والأدوار - RBAC System
// Sprint 0 - Foundation

export const userRoles = ["student", "teacher", "institution_admin", "system_admin", "support_admin"] as const;
export type UserRole = typeof userRoles[number];

// ترجمة الأدوار للعربية
export const roleLabels: Record<UserRole, string> = {
  student: "طالب",
  teacher: "مدرس",
  institution_admin: "مدير مؤسسة",
  system_admin: "أدمن المنصة",
  support_admin: "الدعم الفني"
};

// تعريف جميع الصلاحيات المتاحة في النظام
export const permissions = {
  // صلاحيات الاختبارات
  TESTS_VIEW: "tests:view",
  TESTS_CREATE: "tests:create",
  TESTS_EDIT: "tests:edit",
  TESTS_DELETE: "tests:delete",
  TESTS_TAKE: "tests:take",
  TESTS_REVIEW: "tests:review",
  
  // صلاحيات الأسئلة
  QUESTIONS_VIEW: "questions:view",
  QUESTIONS_CREATE: "questions:create",
  QUESTIONS_EDIT: "questions:edit",
  QUESTIONS_DELETE: "questions:delete",
  QUESTIONS_IMPORT: "questions:import",
  QUESTIONS_EXPORT: "questions:export",
  
  // صلاحيات المستخدمين
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",
  USERS_SUSPEND: "users:suspend",
  USERS_ROLES: "users:roles",
  
  // صلاحيات الاشتراكات
  SUBSCRIPTIONS_VIEW: "subscriptions:view",
  SUBSCRIPTIONS_CREATE: "subscriptions:create",
  SUBSCRIPTIONS_APPROVE: "subscriptions:approve",
  SUBSCRIPTIONS_REJECT: "subscriptions:reject",
  SUBSCRIPTIONS_CANCEL: "subscriptions:cancel",
  
  // صلاحيات المؤسسات
  INSTITUTIONS_VIEW: "institutions:view",
  INSTITUTIONS_CREATE: "institutions:create",
  INSTITUTIONS_EDIT: "institutions:edit",
  INSTITUTIONS_DELETE: "institutions:delete",
  INSTITUTIONS_MANAGE_USERS: "institutions:manage_users",
  
  // صلاحيات الدورات
  COURSES_VIEW: "courses:view",
  COURSES_CREATE: "courses:create",
  COURSES_EDIT: "courses:edit",
  COURSES_DELETE: "courses:delete",
  
  // صلاحيات النماذج الورقية
  PAPERS_VIEW: "papers:view",
  PAPERS_PRINT: "papers:print",
  PAPERS_CREATE: "papers:create",
  PAPERS_DELETE: "papers:delete",
  
  // صلاحيات المجلدات
  FOLDERS_VIEW: "folders:view",
  FOLDERS_CREATE: "folders:create",
  FOLDERS_EDIT: "folders:edit",
  FOLDERS_DELETE: "folders:delete",
  
  // صلاحيات التقارير
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",
  REPORTS_ANALYTICS: "reports:analytics",
  
  // صلاحيات المتصدرين
  LEADERBOARD_VIEW: "leaderboard:view",
  LEADERBOARD_MANAGE: "leaderboard:manage",
  
  // صلاحيات الإعدادات
  SETTINGS_VIEW: "settings:view",
  SETTINGS_EDIT: "settings:edit",
  SETTINGS_SYSTEM: "settings:system",
  
  // صلاحيات الدعم
  SUPPORT_VIEW: "support:view",
  SUPPORT_RESPOND: "support:respond",
  SUPPORT_MANAGE: "support:manage",
  
  // صلاحيات السجلات
  AUDIT_VIEW: "audit:view",
  AUDIT_EXPORT: "audit:export",
  
  // صلاحيات خاصة
  ADMIN_PANEL: "admin:panel",
  ADMIN_DASHBOARD: "admin:dashboard",
  ADMIN_FULL: "admin:full",
} as const;

export type Permission = typeof permissions[keyof typeof permissions];

// مصفوفة الصلاحيات لكل دور
export const rolePermissions: Record<UserRole, Permission[]> = {
  // الطالب - صلاحيات محدودة للتعلم والاختبار
  student: [
    permissions.TESTS_VIEW,
    permissions.TESTS_TAKE,
    permissions.QUESTIONS_VIEW,
    permissions.COURSES_VIEW,
    permissions.PAPERS_VIEW,
    permissions.PAPERS_PRINT,
    permissions.FOLDERS_VIEW,
    permissions.FOLDERS_CREATE,
    permissions.FOLDERS_EDIT,
    permissions.FOLDERS_DELETE,
    permissions.LEADERBOARD_VIEW,
    permissions.REPORTS_VIEW,
    permissions.SETTINGS_VIEW,
  ],
  
  // المدرس - صلاحيات إنشاء وإدارة المحتوى
  teacher: [
    permissions.TESTS_VIEW,
    permissions.TESTS_CREATE,
    permissions.TESTS_EDIT,
    permissions.TESTS_DELETE,
    permissions.TESTS_TAKE,
    permissions.TESTS_REVIEW,
    permissions.QUESTIONS_VIEW,
    permissions.QUESTIONS_CREATE,
    permissions.QUESTIONS_EDIT,
    permissions.QUESTIONS_DELETE,
    permissions.COURSES_VIEW,
    permissions.COURSES_CREATE,
    permissions.COURSES_EDIT,
    permissions.PAPERS_VIEW,
    permissions.PAPERS_PRINT,
    permissions.PAPERS_CREATE,
    permissions.FOLDERS_VIEW,
    permissions.FOLDERS_CREATE,
    permissions.FOLDERS_EDIT,
    permissions.FOLDERS_DELETE,
    permissions.LEADERBOARD_VIEW,
    permissions.REPORTS_VIEW,
    permissions.REPORTS_EXPORT,
    permissions.SETTINGS_VIEW,
    permissions.SETTINGS_EDIT,
  ],
  
  // مدير مؤسسة - إدارة مستخدمي المؤسسة
  institution_admin: [
    permissions.TESTS_VIEW,
    permissions.TESTS_CREATE,
    permissions.TESTS_EDIT,
    permissions.TESTS_DELETE,
    permissions.TESTS_TAKE,
    permissions.TESTS_REVIEW,
    permissions.QUESTIONS_VIEW,
    permissions.QUESTIONS_CREATE,
    permissions.QUESTIONS_EDIT,
    permissions.USERS_VIEW,
    permissions.USERS_CREATE,
    permissions.USERS_EDIT,
    permissions.USERS_SUSPEND,
    permissions.SUBSCRIPTIONS_VIEW,
    permissions.INSTITUTIONS_VIEW,
    permissions.INSTITUTIONS_EDIT,
    permissions.INSTITUTIONS_MANAGE_USERS,
    permissions.COURSES_VIEW,
    permissions.COURSES_CREATE,
    permissions.COURSES_EDIT,
    permissions.PAPERS_VIEW,
    permissions.PAPERS_PRINT,
    permissions.PAPERS_CREATE,
    permissions.FOLDERS_VIEW,
    permissions.FOLDERS_CREATE,
    permissions.FOLDERS_EDIT,
    permissions.FOLDERS_DELETE,
    permissions.LEADERBOARD_VIEW,
    permissions.REPORTS_VIEW,
    permissions.REPORTS_EXPORT,
    permissions.REPORTS_ANALYTICS,
    permissions.SETTINGS_VIEW,
    permissions.SETTINGS_EDIT,
    permissions.ADMIN_DASHBOARD,
  ],
  
  // أدمن المنصة - كل الصلاحيات
  system_admin: [
    permissions.TESTS_VIEW,
    permissions.TESTS_CREATE,
    permissions.TESTS_EDIT,
    permissions.TESTS_DELETE,
    permissions.TESTS_TAKE,
    permissions.TESTS_REVIEW,
    permissions.QUESTIONS_VIEW,
    permissions.QUESTIONS_CREATE,
    permissions.QUESTIONS_EDIT,
    permissions.QUESTIONS_DELETE,
    permissions.QUESTIONS_IMPORT,
    permissions.QUESTIONS_EXPORT,
    permissions.USERS_VIEW,
    permissions.USERS_CREATE,
    permissions.USERS_EDIT,
    permissions.USERS_DELETE,
    permissions.USERS_SUSPEND,
    permissions.USERS_ROLES,
    permissions.SUBSCRIPTIONS_VIEW,
    permissions.SUBSCRIPTIONS_CREATE,
    permissions.SUBSCRIPTIONS_APPROVE,
    permissions.SUBSCRIPTIONS_REJECT,
    permissions.SUBSCRIPTIONS_CANCEL,
    permissions.INSTITUTIONS_VIEW,
    permissions.INSTITUTIONS_CREATE,
    permissions.INSTITUTIONS_EDIT,
    permissions.INSTITUTIONS_DELETE,
    permissions.INSTITUTIONS_MANAGE_USERS,
    permissions.COURSES_VIEW,
    permissions.COURSES_CREATE,
    permissions.COURSES_EDIT,
    permissions.COURSES_DELETE,
    permissions.PAPERS_VIEW,
    permissions.PAPERS_PRINT,
    permissions.PAPERS_CREATE,
    permissions.PAPERS_DELETE,
    permissions.FOLDERS_VIEW,
    permissions.FOLDERS_CREATE,
    permissions.FOLDERS_EDIT,
    permissions.FOLDERS_DELETE,
    permissions.LEADERBOARD_VIEW,
    permissions.LEADERBOARD_MANAGE,
    permissions.REPORTS_VIEW,
    permissions.REPORTS_EXPORT,
    permissions.REPORTS_ANALYTICS,
    permissions.SETTINGS_VIEW,
    permissions.SETTINGS_EDIT,
    permissions.SETTINGS_SYSTEM,
    permissions.SUPPORT_VIEW,
    permissions.SUPPORT_RESPOND,
    permissions.SUPPORT_MANAGE,
    permissions.AUDIT_VIEW,
    permissions.AUDIT_EXPORT,
    permissions.ADMIN_PANEL,
    permissions.ADMIN_DASHBOARD,
    permissions.ADMIN_FULL,
  ],
  
  // الدعم الفني - صلاحيات عرض ودعم
  support_admin: [
    permissions.TESTS_VIEW,
    permissions.QUESTIONS_VIEW,
    permissions.USERS_VIEW,
    permissions.USERS_EDIT,
    permissions.USERS_SUSPEND,
    permissions.SUBSCRIPTIONS_VIEW,
    permissions.SUBSCRIPTIONS_APPROVE,
    permissions.SUBSCRIPTIONS_REJECT,
    permissions.INSTITUTIONS_VIEW,
    permissions.COURSES_VIEW,
    permissions.PAPERS_VIEW,
    permissions.FOLDERS_VIEW,
    permissions.LEADERBOARD_VIEW,
    permissions.REPORTS_VIEW,
    permissions.SETTINGS_VIEW,
    permissions.SUPPORT_VIEW,
    permissions.SUPPORT_RESPOND,
    permissions.AUDIT_VIEW,
    permissions.ADMIN_PANEL,
    permissions.ADMIN_DASHBOARD,
  ],
};

// التحقق من صلاحية معينة لدور
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  return permissions?.includes(permission) || false;
}

// التحقق من أي صلاحية من قائمة
export function hasAnyPermission(role: UserRole, permissionsToCheck: Permission[]): boolean {
  return permissionsToCheck.some(p => hasPermission(role, p));
}

// التحقق من جميع الصلاحيات
export function hasAllPermissions(role: UserRole, permissionsToCheck: Permission[]): boolean {
  return permissionsToCheck.every(p => hasPermission(role, p));
}

// الحصول على جميع صلاحيات الدور
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

// هل الدور مدير؟
export function isAdminRole(role: UserRole): boolean {
  return ["system_admin", "support_admin", "institution_admin"].includes(role);
}

// هل الدور له صلاحية الوصول للوحة التحكم؟
export function canAccessAdminPanel(role: UserRole): boolean {
  return hasPermission(role, permissions.ADMIN_PANEL) || hasPermission(role, permissions.ADMIN_DASHBOARD);
}

// تعريف الصفحات المسموحة لكل دور
export const rolePages: Record<UserRole, string[]> = {
  student: [
    "/",
    "/home",
    "/question-bank",
    "/question-bank/*",
    "/courses",
    "/courses/*",
    "/paper-models",
    "/paper-models/*",
    "/leaderboard",
    "/profile",
    "/settings",
    "/folders",
    "/folders/*",
    "/subscription",
    "/reports",
  ],
  teacher: [
    "/",
    "/home",
    "/question-bank",
    "/question-bank/*",
    "/courses",
    "/courses/*",
    "/paper-models",
    "/paper-models/*",
    "/leaderboard",
    "/profile",
    "/settings",
    "/folders",
    "/folders/*",
    "/reports",
    "/my-tests",
    "/create-test",
    "/analytics",
  ],
  institution_admin: [
    "/",
    "/home",
    "/question-bank",
    "/question-bank/*",
    "/courses",
    "/courses/*",
    "/paper-models",
    "/paper-models/*",
    "/leaderboard",
    "/profile",
    "/settings",
    "/folders",
    "/folders/*",
    "/reports",
    "/admin",
    "/admin/*",
    "/institution",
    "/institution/*",
    "/analytics",
    "/users",
    "/users/*",
  ],
  system_admin: [
    "/*", // كل الصفحات
  ],
  support_admin: [
    "/",
    "/home",
    "/admin",
    "/admin/*",
    "/users",
    "/users/*",
    "/subscriptions",
    "/subscriptions/*",
    "/support",
    "/support/*",
    "/reports",
    "/reports/*",
    "/settings",
    "/audit",
    "/audit/*",
  ],
};

// التحقق من إمكانية الوصول لصفحة معينة
export function canAccessPage(role: UserRole, path: string): boolean {
  const pages = rolePages[role];
  
  // system_admin يمكنه الوصول لكل شيء
  if (role === "system_admin") return true;
  
  return pages.some(page => {
    if (page === "/*") return true;
    if (page.endsWith("/*")) {
      const basePath = page.slice(0, -2);
      return path === basePath || path.startsWith(basePath + "/");
    }
    return page === path;
  });
}
