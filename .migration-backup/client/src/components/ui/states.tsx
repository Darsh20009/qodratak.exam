import { Loader2, AlertCircle, FileQuestion, Inbox, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingState({ 
  message = 'جاري التحميل...', 
  size = 'md',
  fullScreen = false 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3" data-testid="loading-state">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <p className={`${textClasses[size]} text-muted-foreground`}>{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'inbox' | 'file' | 'search';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي عناصر',
  icon = 'inbox',
  action
}: EmptyStateProps) {
  const icons = {
    inbox: Inbox,
    file: FileQuestion,
    search: FileQuestion
  };

  const Icon = icons[icon];

  return (
    <Card className="border-dashed" data-testid="empty-state">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
        {action && (
          <Button onClick={action.onClick} data-testid="button-empty-action">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
}

export function ErrorState({
  title = 'حدث خطأ',
  description = 'عذراً، حدث خطأ أثناء تحميل البيانات',
  error,
  onRetry,
  onGoHome,
  showDetails = false
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className="border-destructive/50" data-testid="error-state">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-2">{description}</p>
        {showDetails && errorMessage && (
          <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md mb-4 max-w-md break-all">
            {errorMessage}
          </p>
        )}
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" data-testid="button-retry">
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="ghost" data-testid="button-go-home">
              <Home className="h-4 w-4 ml-2" />
              الرئيسية
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface NotFoundStateProps {
  title?: string;
  description?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export function NotFoundState({
  title = 'الصفحة غير موجودة',
  description = 'عذراً، الصفحة التي تبحث عنها غير موجودة',
  onGoBack,
  onGoHome
}: NotFoundStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" data-testid="not-found-state">
      <div className="text-8xl font-bold text-muted-foreground/20 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      <div className="flex gap-3">
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline" data-testid="button-go-back">
            الرجوع
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome} data-testid="button-go-home-404">
            <Home className="h-4 w-4 ml-2" />
            الرئيسية
          </Button>
        )}
      </div>
    </div>
  );
}

interface AccessDeniedStateProps {
  title?: string;
  description?: string;
  requiredRole?: string;
  onGoHome?: () => void;
}

export function AccessDeniedState({
  title = 'غير مصرح بالوصول',
  description = 'ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة',
  requiredRole,
  onGoHome
}: AccessDeniedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" data-testid="access-denied-state">
      <div className="rounded-full bg-destructive/10 p-6 mb-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-2">{description}</p>
      {requiredRole && (
        <p className="text-sm text-muted-foreground mb-6">
          الصلاحية المطلوبة: <span className="font-medium">{requiredRole}</span>
        </p>
      )}
      {onGoHome && (
        <Button onClick={onGoHome} data-testid="button-go-home-denied">
          <Home className="h-4 w-4 ml-2" />
          العودة للرئيسية
        </Button>
      )}
    </div>
  );
}
