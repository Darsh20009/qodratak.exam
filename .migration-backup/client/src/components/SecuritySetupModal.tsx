import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Fingerprint, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function SecuritySetupModal() {
  const { toast } = useToast();
  const [step, setStep] = useState<'intro' | 'pin' | 'done'>('intro');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const { data: currentUser } = useQuery<any>({ queryKey: ['/api/user'], retry: false });

  const { data: securityStatus, isLoading } = useQuery<{
    needsSetup: boolean;
    hasPIN: boolean;
    hasBiometric: boolean;
    securitySetupDone: boolean;
  }>({
    queryKey: ['/api/auth/security-status'],
    retry: false,
    enabled: !!currentUser?.id,
  });

  const setPinMutation = useMutation({
    mutationFn: (p: string) => apiRequest('POST', '/api/auth/security-setup/set-pin', { pin: p }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/security-status'] });
      setStep('done');
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e.message, variant: 'destructive' }),
  });

  const skipMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/auth/security-setup/skip', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/security-status'] });
    },
    onError: () => {},
  });

  if (isLoading || !securityStatus?.needsSetup) return null;
  if (step === 'done') return null;

  const handleSetPin = () => {
    if (pin.length < 4) {
      toast({ title: 'خطأ', description: 'الرمز يجب أن يكون 4 أرقام على الأقل', variant: 'destructive' });
      return;
    }
    if (pin !== confirmPin) {
      toast({ title: 'خطأ', description: 'الرمزان غير متطابقان', variant: 'destructive' });
      return;
    }
    setPinMutation.mutate(pin);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4" dir="rtl">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-white font-black text-2xl mb-2">أمّن حسابك الآن</h2>
              <p className="text-blue-100 text-sm">حسابك يحتوي على بياناتك الأكاديمية ونتائجك — يجب تأمينه قبل المتابعة</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">رمز PIN</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">رمز سري مكوّن من 4-6 أرقام لحماية حسابك</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-100 dark:bg-green-100/20 rounded-xl">
                  <Fingerprint className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">البصمة البيومترية</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">يمكنك إضافة بصمة الإصبع أو وجهك لاحقاً من الإعدادات</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setStep('pin')}
                className="w-full bg-gradient-to-l from-blue-600 to-emerald-600 text-white font-bold py-3 rounded-2xl"
              >
                إعداد رمز PIN الآن
              </Button>
              <button
                onClick={() => skipMutation.mutate()}
                disabled={skipMutation.isPending}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2"
              >
                تخطّ لهذه المرة
              </button>
            </div>
          </motion.div>
        )}

        {step === 'pin' && (
          <motion.div
            key="pin"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-6 text-center">
              <Lock className="w-10 h-10 text-white mx-auto mb-2" />
              <h2 className="text-white font-black text-xl">إنشاء رمز PIN</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">رمز PIN (4-6 أرقام)</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="أدخل الرمز"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-pin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">تأكيد الرمز</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="أعد إدخال الرمز"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="input-pin-confirm"
                />
              </div>
              {pin.length >= 4 && confirmPin.length >= 4 && pin === confirmPin && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>الرمزان متطابقان</span>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('intro')} className="flex-1 rounded-xl">
                  رجوع
                </Button>
                <Button
                  onClick={handleSetPin}
                  disabled={setPinMutation.isPending || pin.length < 4}
                  className="flex-1 bg-gradient-to-l from-blue-600 to-emerald-600 text-white rounded-xl"
                  data-testid="button-set-pin"
                >
                  {setPinMutation.isPending ? 'جاري الحفظ…' : 'حفظ الرمز'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
