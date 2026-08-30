export const userRoles = [
  "student",
  "teacher",
  "institution_admin",
  "system_admin",
  "support_admin",
] as const;
export type UserRole = (typeof userRoles)[number];

export const roleLabels: Record<UserRole, string> = {
  student: "طالب",
  teacher: "مدرس",
  institution_admin: "مدير مؤسسة",
  system_admin: "أدمن المنصة",
  support_admin: "الدعم الفني",
};

export const permissions = {
  TESTS_VIEW: "tests:view",
  TESTS_CREATE: "tests:create",
  TESTS_EDIT: "tests:edit",
  TESTS_DELETE: "tests:delete",
  TESTS_TAKE: "tests:take",
  TESTS_REVIEW: "tests:review",
  QUESTIONS_VIEW: "questions:view",
  QUESTIONS_CREATE: "questions:create",
  QUESTIONS_EDIT: "questions:edit",
  QUESTIONS_DELETE: "questions:delete",
  QUESTIONS_IMPORT: "questions:import",
  QUESTIONS_EXPORT: "questions:export",
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",
  USERS_SUSPEND: "users:suspend",
  USERS_ROLES: "users:roles",
  SUBSCRIPTIONS_VIEW: "subscriptions:view",
  SUBSCRIPTIONS_CREATE: "subscriptions:create",
  SUBSCRIPTIONS_APPROVE: "subscriptions:approve",
  SUBSCRIPTIONS_REJECT: "subscriptions:reject",
  SUBSCRIPTIONS_CANCEL: "subscriptions:cancel",
  INSTITUTIONS_VIEW: "institutions:view",
  INSTITUTIONS_CREATE: "institutions:create",
  INSTITUTIONS_EDIT: "institutions:edit",
  INSTITUTIONS_DELETE: "institutions:delete",
  INSTITUTIONS_MANAGE_USERS: "institutions:manage_users",
  COURSES_VIEW: "courses:view",
  COURSES_CREATE: "courses:create",
  COURSES_EDIT: "courses:edit",
  COURSES_DELETE: "courses:delete",
  PAPERS_VIEW: "papers:view",
  PAPERS_PRINT: "papers:print",
  PAPERS_CREATE: "papers:create",
  PAPERS_DELETE: "papers:delete",
  FOLDERS_VIEW: "folders:view",
  FOLDERS_CREATE: "folders:create",
  FOLDERS_EDIT: "folders:edit",
  FOLDERS_DELETE: "folders:delete",
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",
  REPORTS_ANALYTICS: "reports:analytics",
  LEADERBOARD_VIEW: "leaderboard:view",
  LEADERBOARD_MANAGE: "leaderboard:manage",
  SETTINGS_VIEW: "settings:view",
  SETTINGS_EDIT: "settings:edit",
  SETTINGS_SYSTEM: "settings:system",
  SUPPORT_VIEW: "support:view",
  SUPPORT_RESPOND: "support:respond",
  SUPPORT_MANAGE: "support:manage",
  AUDIT_VIEW: "audit:view",
  AUDIT_EXPORT: "audit:export",
  ADMIN_PANEL: "admin:panel",
  ADMIN_DASHBOARD: "admin:dashboard",
  ADMIN_FULL: "admin:full",
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

const studentPermissions: Permission[] = [
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
];

const teacherPermissions: Permission[] = [
  ...studentPermissions,
  permissions.TESTS_CREATE,
  permissions.TESTS_EDIT,
  permissions.TESTS_DELETE,
  permissions.TESTS_REVIEW,
  permissions.QUESTIONS_CREATE,
  permissions.QUESTIONS_EDIT,
  permissions.QUESTIONS_DELETE,
  permissions.COURSES_CREATE,
  permissions.COURSES_EDIT,
  permissions.PAPERS_CREATE,
  permissions.REPORTS_EXPORT,
  permissions.SETTINGS_EDIT,
];

const institutionAdminPermissions: Permission[] = [
  ...teacherPermissions,
  permissions.USERS_VIEW,
  permissions.USERS_CREATE,
  permissions.USERS_EDIT,
  permissions.USERS_SUSPEND,
  permissions.SUBSCRIPTIONS_VIEW,
  permissions.INSTITUTIONS_VIEW,
  permissions.INSTITUTIONS_EDIT,
  permissions.INSTITUTIONS_MANAGE_USERS,
  permissions.REPORTS_ANALYTICS,
  permissions.ADMIN_DASHBOARD,
];

export const rolePermissions: Record<UserRole, Permission[]> = {
  student: studentPermissions,
  teacher: teacherPermissions,
  institution_admin: institutionAdminPermissions,
  system_admin: Object.values(permissions),
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

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

export function hasAnyPermission(
  role: UserRole,
  permissionsToCheck: Permission[],
): boolean {
  return permissionsToCheck.some((permission) =>
    hasPermission(role, permission),
  );
}

export function hasAllPermissions(
  role: UserRole,
  permissionsToCheck: Permission[],
): boolean {
  return permissionsToCheck.every((permission) =>
    hasPermission(role, permission),
  );
}

export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

export function isAdminRole(role: UserRole): boolean {
  return ["system_admin", "support_admin", "institution_admin"].includes(role);
}

export function canAccessAdminPanel(role: UserRole): boolean {
  return (
    hasPermission(role, permissions.ADMIN_PANEL) ||
    hasPermission(role, permissions.ADMIN_DASHBOARD)
  );
}

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
  system_admin: ["/*"],
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

export function canAccessPage(role: UserRole, path: string): boolean {
  if (role === "system_admin") return true;
  return rolePages[role].some((page) => {
    if (page === "/*") return true;
    if (page.endsWith("/*")) {
      const basePath = page.slice(0, -2);
      return path === basePath || path.startsWith(`${basePath}/`);
    }
    return page === path;
  });
}