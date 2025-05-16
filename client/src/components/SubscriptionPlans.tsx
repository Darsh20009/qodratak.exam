import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyIcon, CheckIcon } from "lucide-react";
import { ClipboardList } from "lucide-react";

export function SubscriptionPlans() {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'proLife' | null>(null);
  const [copySuccess, setCopySuccess] = useState<'bank' | 'stc' | null>(null);
  const discountPercentage = 20;

  const handleCopy = async (text: string, type: 'bank' | 'stc') => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleSubscribe = (plan: 'pro' | 'proLife') => {
    setSelectedPlan(plan);
    setIsPaymentDialogOpen(true);
  };

  const handleTelegramRedirect = () => {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const planPrice = selectedPlan === 'pro' ? '180' : '500';

    const message = encodeURIComponent(
      `طلب اشتراك جديد:\n` +
      `الاسم: ${userData?.name || ''}\n` +
      `البريد الإلكتروني: ${userData?.email || ''}\n` +
      `نوع الباقة: ${selectedPlan === 'pro' ? 'Pro - 180 SR' : 'Pro Life - 400 SR (خصم 20%)'}\n` +
      `يرجى إرفاق سند التحويل`
    );

    window.open(`https://t.me/qodratak2030?text=${message}`, '_blank');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-2">اشترك الآن</h1>
      <p className="text-muted-foreground text-center mb-8">
        اختر الباقة المناسبة لك واستمتع بجميع المميزات
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>باقة سنوية مميزة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">180 ريال</div>
            <ul className="space-y-2 mb-6">
              <li>✓ جميع الاختبارات</li>
              <li>✓ المجلدات الخاصة</li>
              <li>✓ التحديات والمنافسات</li>
              <li>✓ دعم فني متميز</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe('pro')}
            >
              اشترك الآن
            </Button>
          </CardFooter>
        </Card>

        <Card className="relative overflow-hidden border-primary">
          <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-sm">
            الأفضل قيمة
          </div>
          <CardHeader>
            <CardTitle>Pro Life</CardTitle>
            <CardDescription>اشتراك مدى الحياة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="text-3xl font-bold mb-4">
                <span className="line-through text-muted-foreground">500 ريال</span>
                <span className="mr-2 text-primary">400 ريال</span>
              </div>
              <div className="absolute -top-6 -right-2 bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full">
                خصم 20%
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              <li>✓ جميع مميزات Pro</li>
              <li>✓ تحديثات مجانية مدى الحياة</li>
              <li>✓ أولوية في الدعم الفني</li>
              <li>✓ مميزات حصرية</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe('proLife')}
              variant="default"
            >
              اشترك الآن
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل الدفع</DialogTitle>
            <DialogDescription>
              يرجى إدخال بياناتك واختيار طريقة الدفع المناسبة
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
        <div className="absolute top-4 right-4">
          <span className="bg-primary text-white px-2 py-1 rounded-full text-sm">خصم {discountPercentage}%</span>
        </div>
            <div className="space-y-2">
              <h3 className="font-medium">البيانات الشخصية:</h3>
              <Input
                type="text"
                placeholder="الاسم الكامل"
                className="w-full"
              />
              <Input
                type="tel"
                placeholder="رقم الهاتف"
                className="w-full"
                dir="ltr"
              />
              <Input
                type="email"
                placeholder="البريد الإلكتروني"
                className="w-full"
                dir="ltr"
              />
              <Input
                type="password"
                placeholder="كلمة المرور"
                className="w-full"
              />
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h3 className="font-medium">الراجحي (تحويل بنكي):</h3>
              <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                <code className="text-sm">SA78 8000 0539 6080 1942 4738</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("SA78 8000 0539 6080 1942 4738", 'bank')}
                >
                  {copySuccess === 'bank' ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">STC Pay (تحويل مباشر):</h3>
              <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                <code className="text-sm">+966532441566</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy("+966532441566", 'stc')}
                >
                  {copySuccess === 'stc' ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                onClick={handleTelegramRedirect}
              >
                توثيق الحساب عبر تليجرام
              </Button>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                بعد إتمام التحويل، يرجى التواصل معنا على تليجرام لتوثيق حسابك
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}