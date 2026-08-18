import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  Zap,
  Shield,
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface EndTestButtonProps {
  onEndTest: () => void;
  className?: string;
  variant?: 'default' | 'floating' | 'subtle';
  testName?: string;
  showProgress?: boolean;
  questionsAnswered?: number;
  totalQuestions?: number;
}

export function EndTestButton({ 
  onEndTest, 
  className,
  variant = 'default',
  testName = 'الاختبار',
  showProgress = false,
  questionsAnswered = 0,
  totalQuestions = 0
}: EndTestButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // لا يظهر زر الإنهاء على الجوال
  if (isMobile) return null;

  const handleEndTest = () => {
    setShowConfirmDialog(false);
    onEndTest();
  };

  const progressPercentage = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0;

  const renderButton = () => {
    switch (variant) {
      case 'floating':
        return (
          <motion.div
            className={cn(
              "fixed top-4 right-4 z-50",
              className
            )}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowConfirmDialog(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-full shadow-2xl border-2 border-red-300/50 overflow-hidden group"
            >
              {/* تأثير البريق المتحرك */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              
              {/* الخلفية المتحركة */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20"
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
              
              <div className="relative flex items-center gap-2">
                <motion.div
                  animate={{ rotate: isHovered ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LogOut className="h-5 w-5" />
                </motion.div>
                <span className="text-sm font-bold">إنهاء الاختبار</span>
                <motion.div
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
              </div>
            </Button>
          </motion.div>
        );

      case 'subtle':
        return (
          <motion.div
            className={cn("", className)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setShowConfirmDialog(true)}
              variant="outline"
              className="relative bg-white/5 border-red-300/30 hover:bg-red-50 hover:border-red-400/50 text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg transition-all duration-300 group"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ x: isHovered ? -2 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </motion.div>
                <span>إنهاء الاختبار</span>
              </div>
            </Button>
          </motion.div>
        );

      default:
        return (
          <motion.div
            className={cn("", className)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => setShowConfirmDialog(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-400/50 overflow-hidden group"
            >
              {/* تأثيرات الخلفية */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20"
                animate={{ 
                  scale: isHovered ? 1.1 : 1,
                  opacity: isHovered ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              />
              
              <div className="relative flex items-center gap-2">
                <motion.div
                  animate={{ rotate: isHovered ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Shield className="h-5 w-5" />
                </motion.div>
                <span>إنهاء الاختبار</span>
                <motion.div
                  animate={{ scale: isHovered ? 1.2 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Zap className="h-4 w-4" />
                </motion.div>
              </div>
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <>
      {renderButton()}

      {/* نافذة التأكيد الإبداعية */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200 dark:border-red-800/50 shadow-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="text-center pb-4">
              <motion.div
                className="mx-auto mb-4 p-3 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full w-fit"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </motion.div>
              
              <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
                هل تريد إنهاء {testName}؟
              </DialogTitle>
              
              <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
                <div className="space-y-2">
                  <p>سيتم فقدان جميع إجاباتك الحالية!</p>
                  
                  {showProgress && totalQuestions > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mt-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span>التقدم المحرز:</span>
                        <span>{questionsAnswered} من {totalQuestions}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {progressPercentage.toFixed(0)}% مكتمل
                      </p>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                variant="outline"
                className="flex-1 bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700"
              >
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  <span>البقاء في الاختبار</span>
                </div>
              </Button>
              
              <motion.div 
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleEndTest}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>نعم، إنهاء الاختبار</span>
                  </div>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EndTestButton;