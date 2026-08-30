import { useLocation, Link } from 'wouter';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Home, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Settings, 
  Users, 
  CreditCard,
  Shield,
  Activity,
  HelpCircle,
  LogOut,
  GraduationCap,
  Building2,
  ClipboardList
} from 'lucide-react';
import type { UserRole } from '@shared/permissions';

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
}

const studentNavItems: NavItem[] = [
  { title: 'الرئيسية', url: '/', icon: Home },
  { title: 'الاختبارات', url: '/tests', icon: ClipboardList },
  { title: 'بنك الأسئلة', url: '/questions', icon: BookOpen },
  { title: 'تقدمي', url: '/progress', icon: BarChart3 },
  { title: 'الاشتراك', url: '/subscription', icon: CreditCard },
];

const teacherNavItems: NavItem[] = [
  { title: 'الرئيسية', url: '/', icon: Home },
  { title: 'طلابي', url: '/my-students', icon: Users },
  { title: 'الاختبارات', url: '/tests', icon: ClipboardList },
  { title: 'بنك الأسئلة', url: '/questions', icon: BookOpen },
  { title: 'التقارير', url: '/reports', icon: BarChart3 },
];

const institutionAdminNavItems: NavItem[] = [
  { title: 'لوحة التحكم', url: '/admin/dashboard', icon: Home },
  { title: 'المعلمون', url: '/admin/teachers', icon: GraduationCap },
  { title: 'الطلاب', url: '/admin/students', icon: Users },
  { title: 'الاشتراكات', url: '/admin/subscriptions', icon: CreditCard },
  { title: 'التقارير', url: '/admin/reports', icon: BarChart3 },
  { title: 'إعدادات المؤسسة', url: '/admin/settings', icon: Building2 },
];

const systemAdminNavItems: NavItem[] = [
  { title: 'لوحة التحكم', url: '/admin/dashboard', icon: Home },
  { title: 'المستخدمون', url: '/admin/users', icon: Users },
  { title: 'المؤسسات', url: '/admin/institutions', icon: Building2 },
  { title: 'الاشتراكات', url: '/admin/subscriptions', icon: CreditCard },
  { title: 'الأسئلة', url: '/admin/questions', icon: BookOpen },
  { title: 'سجل النشاط', url: '/admin/audit-log', icon: Activity },
  { title: 'الأمان', url: '/admin/security', icon: Shield },
  { title: 'الإعدادات', url: '/admin/settings', icon: Settings },
];

const supportAdminNavItems: NavItem[] = [
  { title: 'لوحة التحكم', url: '/admin/dashboard', icon: Home },
  { title: 'المستخدمون', url: '/admin/users', icon: Users },
  { title: 'الاشتراكات', url: '/admin/subscriptions', icon: CreditCard },
  { title: 'طلبات الدعم', url: '/admin/support', icon: HelpCircle },
  { title: 'سجل النشاط', url: '/admin/audit-log', icon: Activity },
];

function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'system_admin':
      return systemAdminNavItems;
    case 'support_admin':
      return supportAdminNavItems;
    case 'institution_admin':
      return institutionAdminNavItems;
    case 'teacher':
      return teacherNavItems;
    case 'student':
    default:
      return studentNavItems;
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'system_admin':
      return 'مدير النظام';
    case 'support_admin':
      return 'مدير الدعم';
    case 'institution_admin':
      return 'مدير المؤسسة';
    case 'teacher':
      return 'معلم';
    case 'student':
    default:
      return 'طالب';
  }
}

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  user?: {
    name?: string;
    email?: string;
  };
  onLogout?: () => void;
}

export function RoleBasedLayout({ children, role, user, onLogout }: RoleBasedLayoutProps) {
  const [location] = useLocation();
  const navItems = getNavItemsForRole(role);
  const roleLabel = getRoleLabel(role);
  
  const isAdmin = ['system_admin', 'support_admin', 'institution_admin'].includes(role);
  
  const sidebarStyle = {
    '--sidebar-width': isAdmin ? '16rem' : '14rem',
    '--sidebar-width-icon': '3.5rem',
  } as React.CSSProperties;

  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2)
    : 'م';

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                ق
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg">قدراتك</span>
                <span className="text-xs text-muted-foreground">{roleLabel}</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.url}
                        data-testid={`nav-${item.url.replace(/\//g, '-').slice(1) || 'home'}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'مستخدم'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              {onLogout && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={onLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b h-14">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

interface SimpleLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function SimpleLayout({ children, showHeader = true }: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
                ق
              </div>
              <span className="font-bold">قدراتك</span>
            </div>
          </div>
        </header>
      )}
      <main>
        {children}
      </main>
    </div>
  );
}
