
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SubscriptionPlans() {
  const handleSubscribe = (plan: string) => {
    window.location.href = 'https://t.me/qodratak2030';
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pro - الباقة السنوية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-3xl font-bold">180 SR</p>
            <p className="text-muted-foreground">سنوياً</p>
          </div>
          <div className="space-y-2 mb-4">
            <p>✓ جميع الاختبارات والتحديات</p>
            <p>✓ المكتبة الكاملة</p>
            <p>✓ إمكانية حفظ المجلدات</p>
          </div>
          <Button onClick={() => handleSubscribe('pro')} className="w-full">
            اشترك الآن
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pro Life - مدى الحياة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-3xl font-bold">500 SR</p>
            <p className="text-muted-foreground">دفعة واحدة</p>
          </div>
          <div className="space-y-2 mb-4">
            <p>✓ جميع مميزات Pro</p>
            <p>✓ صلاحية مدى الحياة</p>
            <p>✓ تحديثات مجانية</p>
          </div>
          <Button onClick={() => handleSubscribe('proLife')} className="w-full">
            اشترك الآن
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
