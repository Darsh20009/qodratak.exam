import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, Check } from 'lucide-react';

interface PDFGenerationModalProps {
  isOpen: boolean;
  currentPage: number;
  totalPages: number;
  fileName: string;
}

export default function PDFGenerationModal({
  isOpen,
  currentPage,
  totalPages,
  fileName
}: PDFGenerationModalProps) {
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  const isComplete = currentPage >= totalPages && totalPages > 0;

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {isComplete ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="relative">
              <Loader2 className="h-20 w-20 animate-spin text-primary" />
              <FileText className="absolute inset-0 m-auto h-8 w-8 text-primary" />
            </div>
          )}

          <div className="space-y-2 text-center w-full">
            <h3 className="text-xl font-bold">
              {isComplete ? 'تم الإنشاء بنجاح!' : 'جاري إنشاء ملف PDF...'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isComplete
                ? `تم إنشاء ${fileName} بنجاح`
                : `معالجة صفحة ${currentPage} من ${totalPages}`}
            </p>
          </div>

          <div className="w-full space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-center text-sm font-medium text-primary">
              {progress.toFixed(0)}%
            </p>
          </div>

          {!isComplete && (
            <p className="text-xs text-center text-muted-foreground max-w-xs">
              الرجاء عدم إغلاق المتصفح أو التنقل بعيداً عن هذه الصفحة
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
