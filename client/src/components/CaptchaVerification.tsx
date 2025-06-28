import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircleIcon, XCircleIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";

interface CaptchaVerificationProps {
  onVerify: (success: boolean) => void;
  onClose: () => void;
}

type CaptchaType = 'math' | 'pattern' | 'color' | 'arabic';

interface CaptchaChallenge {
  type: CaptchaType;
  question: string;
  options: string[];
  correctAnswer: string;
  icon?: string;
}

export function CaptchaVerification({ onVerify, onClose }: CaptchaVerificationProps) {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Generate random captcha challenges
  const generateChallenge = (): CaptchaChallenge => {
    const challenges: CaptchaChallenge[] = [
      // Math challenges
      {
        type: 'math',
        question: 'كم يساوي 7 + 5؟',
        options: ['11', '12', '13', '14'],
        correctAnswer: '12'
      },
      {
        type: 'math',
        question: 'كم يساوي 9 × 3؟',
        options: ['25', '27', '29', '31'],
        correctAnswer: '27'
      },
      {
        type: 'math',
        question: 'كم يساوي 15 - 8؟',
        options: ['6', '7', '8', '9'],
        correctAnswer: '7'
      },
      
      // Arabic language challenges
      {
        type: 'arabic',
        question: 'أكمل الجملة: "العلم نور والجهل ..."',
        options: ['ظلام', 'ضوء', 'نهار', 'قمر'],
        correctAnswer: 'ظلام'
      },
      {
        type: 'arabic',
        question: 'ما هو جمع كلمة "كتاب"؟',
        options: ['كتابات', 'كتب', 'كتابين', 'كتاتيب'],
        correctAnswer: 'كتب'
      },
      {
        type: 'arabic',
        question: 'أي من هذه الكلمات صحيحة الإملاء؟',
        options: ['إستطاع', 'استطاع', 'أستطاع', 'إسطاع'],
        correctAnswer: 'استطاع'
      },
      
      // Color and pattern challenges
      {
        type: 'color',
        question: 'اختر اللون الأزرق',
        options: ['🔴', '🟢', '🔵', '🟡'],
        correctAnswer: '🔵'
      },
      {
        type: 'pattern',
        question: 'أكمل النمط: ⭐🌙⭐🌙⭐?',
        options: ['⭐', '🌙', '☀️', '🌟'],
        correctAnswer: '🌙'
      },
      {
        type: 'pattern',
        question: 'اختر الرمز المختلف',
        options: ['📚', '📖', '📝', '🍎'],
        correctAnswer: '🍎'
      }
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  useEffect(() => {
    setChallenge(generateChallenge());
  }, []);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!challenge || !selectedAnswer) return;

    const isCorrect = selectedAnswer === challenge.correctAnswer;
    setIsVerified(isCorrect);
    setShowResult(true);

    setTimeout(() => {
      if (isCorrect) {
        onVerify(true);
      } else {
        setAttempts(prev => prev + 1);
        if (attempts >= 2) {
          onVerify(false);
        } else {
          // Generate new challenge
          setChallenge(generateChallenge());
          setSelectedAnswer('');
          setShowResult(false);
        }
      }
    }, 1500);
  };

  const handleRefresh = () => {
    setChallenge(generateChallenge());
    setSelectedAnswer('');
    setShowResult(false);
  };

  if (!challenge) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
            تحقق من الأمان
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            للتأكد من أنك لست روبوت، يرجى الإجابة على السؤال التالي
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showResult ? (
            <>
              {/* Challenge Question */}
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  {challenge.question}
                </h3>

                {/* Answer Options */}
                <div className="grid grid-cols-2 gap-3">
                  {challenge.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                        selectedAnswer === option
                          ? 'border-primary bg-primary/10 text-primary shadow-lg'
                          : 'border-slate-200 dark:border-slate-600 hover:border-primary/50 bg-white dark:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg font-medium">
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="flex-1 border-slate-300 dark:border-slate-600"
                >
                  <RefreshCwIcon className="w-4 h-4 ml-2" />
                  سؤال جديد
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  تأكيد
                </Button>
              </div>

              {attempts > 0 && (
                <div className="text-center text-sm text-amber-600 dark:text-amber-400">
                  المحاولة {attempts + 1} من 3
                </div>
              )}
            </>
          ) : (
            /* Result Display */
            <div className="text-center py-8">
              {isVerified ? (
                <div className="space-y-4">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                    ممتاز! تم التحقق بنجاح
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    جارٍ تسجيل الدخول...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <XCircleIcon className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                  <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                    إجابة خاطئة
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {attempts >= 2 ? 'تم تجاوز عدد المحاولات المسموحة' : 'جارٍ تحديث السؤال...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-slate-800 dark:hover:text-slate-200"
            >
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}