import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, CrownIcon, DiamondIcon, StarIcon } from "lucide-react";

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">خطط الاشتراك</h1>
        <p className="text-lg text-muted-foreground">اختر الخطة المناسبة لك وابدأ رحلتك نحو التميز</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* الخطة المجانية */}
        <Card className="relative">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <StarIcon className="h-5 w-5" />
              الخطة المجانية
            </CardTitle>
            <CardDescription>مثالية للمبتدئين</CardDescription>
            <div className="text-3xl font-bold">مجاناً</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>اختبارات قياس أساسية</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>إدارة الوقت</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>تحميل التطبيق</span>
              </li>
            </ul>
            <Button className="w-full mt-4" variant="outline">
              الخطة الحالية
            </Button>
          </CardContent>
        </Card>

        {/* خطة Pro */}
        <Card className="relative border-primary">
          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
            الأكثر شعبية
          </Badge>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CrownIcon className="h-5 w-5 text-amber-500" />
              خطة Pro
            </CardTitle>
            <CardDescription>للطلاب الطموحين</CardDescription>
            <div className="text-3xl font-bold">99 ريال/شهر</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>جميع مميزات الخطة المجانية</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>اختبارات القدرات المتقدمة</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>المساعد الذكي</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>المكتبة الشاملة</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>التحديات والمسابقات</span>
              </li>
            </ul>
            <Button className="w-full mt-4">
              ترقية الآن
            </Button>
          </CardContent>
        </Card>

        {/* خطة Pro Life */}
        <Card className="relative border-amber-500">
          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500">
            أفضل قيمة
          </Badge>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <DiamondIcon className="h-5 w-5 text-amber-500" />
              خطة Pro Life
            </CardTitle>
            <CardDescription>دفعة واحدة مدى الحياة</CardDescription>
            <div className="text-3xl font-bold">999 ريال</div>
            <div className="text-sm text-muted-foreground line-through">بدلاً من 1188 ريال/سنة</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>جميع مميزات خطة Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>وصول مدى الحياة</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>تحديثات مجانية للأبد</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>دعم فني مميز</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>شارة مميزة</span>
              </li>
            </ul>
            <Button className="w-full mt-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600">
              احصل عليها مدى الحياة
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>جميع الخطط تشمل ضمان استرداد الأموال لمدة 30 يوماً</p>
        <p>للاستفسارات: تواصل معنا على التليجرام @qodratak2030</p>
      </div>
    </div>
  );
}