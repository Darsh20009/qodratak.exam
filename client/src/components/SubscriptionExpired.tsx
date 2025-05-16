
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function SubscriptionExpired() {
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>انتهى اشتراكك</CardTitle>
          <CardDescription>
            لمواصلة الاستفادة من جميع المميزات، يرجى تجديد اشتراكك
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <Link href="/subscribe">تجديد الاشتراك</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/subscription-recovery">استرداد بيانات الاشتراك</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
