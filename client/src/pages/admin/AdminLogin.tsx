import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, User, Shield } from 'lucide-react';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: `مرحباً ${data.admin.fullName}`,
        });
        setLocation('/admin/dashboard');
      } else {
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: data.error || 'فشل تسجيل الدخول',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في الاتصال بالخادم',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#071a0e] p-4" dir="rtl">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 relative">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-600/40" style={{ boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}>
              <img src="/logo-512x512.png" alt="قدراتك" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg border-2 border-[#071a0e]">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-emerald-100">لوحة تحكم المدير</h1>
          <p className="text-emerald-500/70 text-sm mt-1">منصة قدراتك — وصول مخصص للمدراء</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a2418] rounded-3xl border border-emerald-900/40 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-emerald-300 text-sm font-medium" htmlFor="username">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 w-4 h-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  className="pr-10 bg-emerald-900/20 border-emerald-800/40 text-emerald-100 placeholder:text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  data-testid="input-admin-username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-emerald-300 text-sm font-medium" htmlFor="password">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  className="pr-10 bg-emerald-900/20 border-emerald-800/40 text-emerald-100 placeholder:text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500/20"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="input-admin-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  دخول لوحة التحكم
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
