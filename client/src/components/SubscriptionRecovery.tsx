
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SubscriptionRecovery() {
  const handleRecoveryClick = () => {
    window.location.href = 'https://t.me/qodratak2030';
  };

  return (
    <Card className="mt-8">
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
  );
}
