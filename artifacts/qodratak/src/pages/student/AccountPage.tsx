import React, { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useUpdateGuardian, useChangePassword } from "@/hooks/use-student";
import { useStudentDashboard } from "@/hooks/use-student";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Shield, KeyRound, Phone, Crown, CheckCircle2, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function AccountPage() {
  const { user, logout } = useUser();
  const updateGuardian = useUpdateGuardian();
  const changePassword = useChangePassword();
  const { data: dashboard } = useStudentDashboard();
  const { toast } = useToast();

  const [guardianPhone, setGuardianPhone] = useState(user?.guardianPhone || "");
  const [notifyOnTest, setNotifyOnTest] = useState(user?.notifyOnTestCompletion || false);
  const [isGuardianDialogOpen, setIsGuardianDialogOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const handleGuardianSubmit = () => {
    updateGuardian.mutate(
      { guardianPhone, notifyOnTestCompletion: notifyOnTest },
      { onSuccess: () => setIsGuardianDialogOpen(false) }
    );
  };

  const handlePasswordSubmit = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive"
      });
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      { onSuccess: () => {
          setIsPasswordDialogOpen(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
    );
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl p-5 md:p-8 animate-fade-in space-y-8">
      <header>
        <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white mb-2">حسابي</h1>
        <p className="text-sm text-muted-foreground">إدارة بياناتك الشخصية واشتراكك وإعدادات الأمان.</p>
      </header>

      {/* Profile Info */}
      <section className="rounded-2xl border border-border bg-white dark:bg-card p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-muted border-4 border-white dark:border-card shadow-md flex items-center justify-center font-black text-3xl text-[#0D1B2A] dark:text-white">
          {(user as any).profilePicture || (user as any).avatarUrl
            ? <img src={(user as any).profilePicture || (user as any).avatarUrl} alt="الصورة الشخصية" className="h-full w-full object-cover" />
            : user.name?.charAt(0) || "ط"}
        </div>
        <div className="text-center md:text-right flex-1">
          <h2 className="text-2xl font-black text-foreground">{user.name || "طالب"}</h2>
          <p className="text-sm font-bold text-muted-foreground mt-1">{user.email}</p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto">
          <Link href="/profile"><Button variant="outline" className="w-full rounded-xl">تعديل الصورة والبيانات</Button></Link>
          <Button variant="outline" className="w-full rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" onClick={() => logout()}>
            <LogOut className="ml-2 h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription & Guardian */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white dark:bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="h-6 w-6 text-amber-500" />
              <h2 className="text-lg font-black text-foreground">الاشتراك</h2>
            </div>
            <div className="rounded-xl bg-[#F7F8FA] dark:bg-slate-900 p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-muted-foreground">الخطة الحالية</span>
                 <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                   {dashboard?.subscription.status === "active" ? "نشط" : dashboard?.subscription.status === "trial" ? "تجربة" : "مجاني"}
                 </span>
              </div>
               <p className="text-xl font-black text-foreground">{dashboard?.subscription.type || user.subscription?.type || "الحساب المجاني"}</p>
               {dashboard?.subscription.daysLeft ? <p className="mt-2 text-xs font-bold text-muted-foreground">متبقي {dashboard.subscription.daysLeft} يوم</p> : null}
            </div>
            <Link href="/enhanced-subscription"><Button className="w-full mt-4 rounded-xl font-black bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90">
              ترقية أو تمديد الاشتراك
            </Button></Link>
          </section>

          <section className="rounded-2xl border border-border bg-white dark:bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-[#398B79]" />
                <h2 className="text-lg font-black text-foreground">ولي الأمر</h2>
              </div>
              <Dialog open={isGuardianDialogOpen} onOpenChange={setIsGuardianDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs font-bold">تعديل</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="font-black text-xl">بيانات ولي الأمر</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-foreground">رقم الجوال (واتساب)</Label>
                      <Input 
                        value={guardianPhone} 
                        onChange={(e) => setGuardianPhone(e.target.value)} 
                        className="rounded-xl text-left" 
                        dir="ltr"
                        placeholder="05XXXXXXXX"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/50">
                      <Label className="text-sm font-bold text-foreground cursor-pointer">
                        إرسال تقرير بعد كل اختبار
                      </Label>
                      <Switch checked={notifyOnTest} onCheckedChange={setNotifyOnTest} />
                    </div>
                    <Button 
                      onClick={handleGuardianSubmit} 
                      disabled={updateGuardian.isPending} 
                      className="w-full rounded-xl font-black bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90"
                    >
                      حفظ التغييرات
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {user.guardianPhone ? (
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span dir="ltr">{user.guardianPhone}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لم يتم إضافة رقم ولي الأمر بعد.</p>
              )}
            </div>
          </section>
        </div>

        {/* Security */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white dark:bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-black text-foreground">الأمان</h2>
            </div>
            
            <div className="space-y-4">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-[#0D1B2A]/30 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">كلمة المرور</p>
                        <p className="text-xs text-muted-foreground mt-0.5">تغيير كلمة المرور الخاصة بك</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold px-2">تغيير</Button>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="font-black text-xl">تغيير كلمة المرور</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-foreground">كلمة المرور الحالية</Label>
                      <Input 
                        type="password"
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        className="rounded-xl text-left" 
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-foreground">كلمة المرور الجديدة</Label>
                      <Input 
                        type="password"
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="rounded-xl text-left" 
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-foreground">تأكيد كلمة المرور الجديدة</Label>
                      <Input 
                        type="password"
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="rounded-xl text-left" 
                        dir="ltr"
                      />
                    </div>
                    <Button 
                      onClick={handlePasswordSubmit} 
                      disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword} 
                      className="w-full rounded-xl font-black bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90"
                    >
                      حفظ التغييرات
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
