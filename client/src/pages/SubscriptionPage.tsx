
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { Button } from "@/components/ui/button";

export function SubscriptionPage() {
  const handleRecoveryClick = () => {
    window.location.href = 'https://t.me/qodratak2030';
  };

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">باقات الاشتراك</h1>
        <p className="text-muted-foreground">اختر الباقة المناسبة لك واستمتع بجميع المميزات</p>
      </div>

      <SubscriptionPlans />

      <div className="mt-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>استرداد بيانات الاشتراك</CardTitle>
            <CardDescription>
              هل كنت مشترك سابقاً وتريد استرداد بياناتك؟
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRecoveryClick} variant="outline">
              استرداد بيانات الاشتراك
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SubscriptionPage;
