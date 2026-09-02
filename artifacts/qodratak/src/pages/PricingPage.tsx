import React from 'react';
import { CheckIcon, CrownIcon, ZapIcon, StarIcon, HeartIcon, TrendingUpIcon, ShieldCheckIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'مجاني',
    price: '0',
    period: '',
    description: 'للبدء في رحلتك التعليمية',
    color: 'from-gray-500 to-gray-600',
    badge: 'تجربة 7 أيام',
    badgeColor: 'bg-gray-100 text-gray-800',
    features: [
      'تجربة مجانية لمدة 7 أيام',
      'وصول محدود للاختبارات',
      'تقارير أساسية',
      'دعم فني محدود',
      'محتوى تعليمي أساسي'
    ],
    limitations: [
      'محدود بـ 7 أيام للمستخدمين الجدد',
      'عدد محدود من الاختبارات',
      'لا يشمل المميزات المتقدمة'
    ],
    cta: 'ابدأ مجاناً',
    popular: false
  },
  {
    name: 'Pro',
    price: '29',
    period: 'شهرياً',
    description: 'للطلاب الجادين في التحضير',
    color: 'from-blue-600 to-emerald-600',
    badge: 'الأكثر شعبية',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    features: [
      'وصول غير محدود لجميع الأسئلة',
      'أكثر من 5,565 سؤال متنوع',
      'تحليلات مفصلة وذكية',
      'تقارير PDF قابلة للتحميل',
      'دعم فني بأولوية',
      'تتبع التقدم المتقدم',
      'اختبارات مخصصة',
      '36 نموذج ورقي'
    ],
    limitations: [],
    cta: 'اشترك الآن',
    popular: true
  },
  {
    name: 'Pro Life',
    price: '74',
    period: '3 أشهر',
    description: 'الاشتراك الثلاثي الأفضل قيمة',
    color: 'from-green-600 to-amber-600',
    badge: 'أفضل قيمة',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-100 dark:text-green-700',
    features: [
      'جميع مميزات Pro',
      'جلسات مباشرة مع الخبراء',
      'تقارير مفصلة ودورية',
      'أولوية في الدعم الفني',
      'محتوى حصري ومتقدم',
      'شهادات إنجاز',
      'خصومات على الدورات'
    ],
    limitations: [],
    cta: 'اشترك لـ 3 أشهر',
    popular: false,
    savings: 'وفر مقارنة بالاشتراك الشهري'
  },
  {
    name: 'Pro Life Plus',
    price: '134',
    period: '6 أشهر',
    description: 'أقوى خطة للتحضير المكثف',
    color: 'from-amber-500 to-orange-600',
    badge: 'الأشمل',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100',
    features: [
      'جميع مميزات Pro Life',
      'وصول مكثف لـ 6 أشهر كاملة',
      'دعم فني على مدار الساعة',
      'محتوى حصري ومتجدد',
      'تقارير أداء متقدمة جداً',
      'وصول مبكر للمميزات الجديدة'
    ],
    limitations: [],
    cta: 'اشترك لـ 6 أشهر',
    popular: false,
    savings: 'الخيار الأمثل للتحضير الجاد'
  }
];

const PricingCard: React.FC<{ plan: typeof plans[0]; index: number }> = ({ plan, index }) => (
  <Card 
    className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
      plan.popular ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'hover:shadow-lg'
    }`}
  >
    {plan.popular && (
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-center py-2 text-sm font-bold">
        ⭐ الأكثر شعبية
      </div>
    )}
    
    <CardHeader className={`bg-gradient-to-r ${plan.color} text-white pb-8 ${plan.popular ? 'pt-12' : 'pt-6'}`}>
      <div className="text-center">
        <Badge className={`mb-4 ${plan.badgeColor}`}>
          {plan.badge}
        </Badge>
        <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
        <div className="mb-4">
          <span className="text-4xl font-extrabold">{plan.price}</span>
          {plan.period && (
            <span className="text-lg opacity-90 mr-2">ريال</span>
          )}
          {plan.period && (
            <div className="text-sm opacity-80 mt-1">{plan.period}</div>
          )}
        </div>
        <p className="text-white/90 text-sm">{plan.description}</p>
        {plan.savings && (
          <div className="mt-3 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
            💰 {plan.savings}
          </div>
        )}
      </div>
    </CardHeader>

    <CardContent className="p-6">
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckIcon className="w-4 h-4" />
          المميزات المشمولة:
        </h4>
        <ul className="space-y-3">
          {plan.features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-start gap-3">
              <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>

        {plan.limitations.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2 mb-3">
              <ShieldCheckIcon className="w-4 h-4" />
              القيود:
            </h4>
            <ul className="space-y-2">
              {plan.limitations.map((limitation, limitIndex) => (
                <li key={limitIndex} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0 mt-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button 
        className={`w-full py-3 font-bold text-lg bg-gradient-to-r ${plan.color} hover:opacity-90 text-white transition-all duration-200`}
        onClick={() => {
          if (plan.name === 'مجاني') {
            window.location.href = '/signup?return=%2Fprofile';
          } else {
            window.location.href = '/subscription';
          }
        }}
      >
        {plan.cta}
        {plan.name === 'Pro Life مدى الحياة' && (
          <CrownIcon className="w-5 h-5 mr-2" />
        )}
      </Button>
    </CardContent>
  </Card>
);

export const PricingPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 rounded-full flex items-center justify-center animate-pulse">
            <CrownIcon className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 bg-clip-text text-transparent mb-6">
          🎯 خطط الأسعار
        </h1>
        <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          اختر الخطة التي تناسب احتياجاتك وابدأ رحلتك نحو النجاح في اختبارات القياس
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan, index) => (
          <PricingCard key={index} plan={plan} index={index} />
        ))}
      </div>

      {/* Features Comparison */}
      <Card className="mb-16">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="text-center text-2xl font-bold flex items-center justify-center gap-3">
            <TrendingUpIcon className="w-6 h-6 text-blue-600" />
            مقارنة المميزات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-4 font-semibold">الميزة</th>
                  <th className="text-center p-4 font-semibold text-gray-600">مجاني</th>
                  <th className="text-center p-4 font-semibold text-blue-600">Pro الشهري</th>
                  <th className="text-center p-4 font-semibold text-green-700">Pro Life</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">عدد الاختبارات</td>
                  <td className="text-center p-4">محدود (7 أيام)</td>
                  <td className="text-center p-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">تحليلات مفصلة</td>
                  <td className="text-center p-4">أساسية</td>
                  <td className="text-center p-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">تقارير PDF</td>
                  <td className="text-center p-4">❌</td>
                  <td className="text-center p-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center p-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">الدعم الفني</td>
                  <td className="text-center p-4">محدود</td>
                  <td className="text-center p-4">أولوية</td>
                  <td className="text-center p-4">مدى الحياة</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-emerald-600 dark:from-blue-900/20 dark:to-emerald-600/20">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              💡 أسئلة شائعة حول الأسعار
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">
                هل يمكنني تغيير خطتي لاحقاً؟
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                نعم، يمكنك الترقية من الخطة الشهرية إلى مدى الحياة في أي وقت.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg text-green-700 dark:text-green-700 mb-2">
                ما هي وسائل الدفع المقبولة؟
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                نقبل جميع بطاقات الائتمان والدفع الإلكتروني المحلي.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              onClick={() => window.location.href = '/faq'}
              variant="outline" 
              className="font-semibold"
            >
              عرض جميع الأسئلة الشائعة
              <HeartIcon className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingPage;