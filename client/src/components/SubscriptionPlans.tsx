
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CopyIcon, CheckIcon, SparklesIcon, StarIcon, ShieldCheckIcon, RocketIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID = "ASFNDEAoLJ9frq71gWnW287UDQz7nC_FrKgrBsEHitKI9EKV8AlSzwZTCDBUfDpTdrDan6j7M4YAmbjp";

const paypalOptions = {
  clientId: PAYPAL_CLIENT_ID,
  currency: "SAR",
  intent: "capture"
};

export function SubscriptionPlans() {
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'proLife' | null>(null);
  const [copySuccess, setCopySuccess] = useState<'bank' | 'stc' | 'paypal' | null>(null);

  const handleCopy = async (text: string, type: 'bank' | 'stc' | 'paypal') => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(type);
    toast({
      title: "تم النسخ بنجاح",
      description: "تم نسخ رقم الحساب إلى الحافظة"
    });
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleSubscribe = (plan: 'pro' | 'proLife') => {
    setSelectedPlan(plan);
    setIsPaymentDialogOpen(true);
  };

  const handleTelegramRedirect = () => {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const planPrice = selectedPlan === 'pro' ? '180' : '400';
    const message = encodeURIComponent(
      `طلب اشتراك جديد:\n` +
      `الاسم: ${userData?.name || ''}\n` +
      `البريد الإلكتروني: ${userData?.email || ''}\n` +
      `نوع الباقة: ${selectedPlan === 'pro' ? 'Pro - 180 SR' : 'Pro Life - 400 SR'}\n` +
      `يرجى إرفاق سند التحويل`
    );
    window.open(`https://t.me/qodratak2030?text=${message}`, '_blank');
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">اختر باقتك المفضلة</h1>
          <p className="text-muted-foreground text-lg">
            استمتع بتجربة تعليمية متكاملة مع باقاتنا المميزة
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Pro Plan */}
          <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300">
            <div className="absolute top-4 right-4">
              <ShieldCheckIcon className="h-6 w-6 text-primary" />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>باقة سنوية مميزة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-6">180 ريال / سنة</div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5 text-primary" />
                  جميع الاختبارات
                </li>
                <li className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-primary" />
                  المجلدات الخاصة
                </li>
                <li className="flex items-center gap-2">
                  <RocketIcon className="h-5 w-5 text-primary" />
                  التحديات والمنافسات
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full text-lg py-6"
                onClick={() => handleSubscribe('pro')}
              >
                اشترك الآن
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Life Plan */}
          <Card className="relative overflow-hidden border-2 border-primary bg-primary/5">
            <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-6 py-1 rotate-12">
              الأفضل قيمة
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro Life</CardTitle>
              <CardDescription>اشتراك مدى الحياة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <div className="text-4xl font-bold">
                  <span className="line-through text-muted-foreground">500 ريال</span>
                  <span className="text-primary mr-2">400 ريال</span>
                </div>
                <span className="absolute -top-4 right-32 bg-primary text-primary-foreground text-sm px-2 py-1 rounded-full">
                  خصم 20%
                </span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5 text-primary" />
                  جميع مميزات Pro
                </li>
                <li className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-primary" />
                  تحديثات مجانية مدى الحياة
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-primary" />
                  أولوية في الدعم الفني
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full text-lg py-6"
                variant="default"
                onClick={() => handleSubscribe('proLife')}
              >
                اشترك الآن
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>طرق الدفع المتاحة</DialogTitle>
              <DialogDescription>
                اختر طريقة الدفع المناسبة لك
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">الراجحي (تحويل بنكي)</h3>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <code className="text-sm font-mono">SA78 8000 0539 6080 1942 4738</code>
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

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">STC Pay</h3>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <code className="text-sm font-mono">+966532441566</code>
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

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">PayPal</h3>
                <PayPalButtons
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [{
                        amount: {
                          value: selectedPlan === 'pro' ? '180.00' : '400.00',
                          currency_code: 'SAR'
                        },
                        description: selectedPlan === 'pro' ? 'Pro Subscription' : 'Pro Life Subscription'
                      }]
                    });
                  }}
                  onApprove={async (data, actions) => {
                    if (actions.order) {
                      const order = await actions.order.capture();
                      toast({
                        title: "تم الدفع بنجاح",
                        description: "سيتم تفعيل اشتراكك قريباً"
                      });
                    }
                  }}
                  style={{ layout: "horizontal" }}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleTelegramRedirect}
              >
                تأكيد الدفع عبر تليجرام
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                بعد إتمام التحويل، يرجى التواصل معنا على تليجرام لتفعيل اشتراكك
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PayPalScriptProvider>
  );
}
