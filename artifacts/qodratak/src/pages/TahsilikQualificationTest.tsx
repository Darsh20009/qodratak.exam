import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Target, Brain,
  CheckCircle, Shuffle, AlertCircle, ChevronRight
} from 'lucide-react';

type SystemType = 'namir' | 'old';

const SYSTEMS = {
  namir: {
    id: 7,
    name: 'نظام نمر',
    badge: 'الأحدث',
    badgeColor: 'bg-rose-500',
    icon: Target,
    gradient: 'from-rose-500 to-red-600',
    borderActive: 'border-rose-500',
    description: 'أحدث نظام اختبار قياس القدرات — مطابق تماماً لاختبار نمر الرسمي',
    stats: [
      { label: 'الأقسام', value: '5 أقسام' },
      { label: 'الأسئلة', value: '125 سؤال' },
      { label: 'محسوب', value: '105 سؤال' },
      { label: 'وقت كل قسم', value: '26 دقيقة' },
    ],
    features: [
      'كل قسم: 13 لفظي + 12 كمي',
      '20 سؤال تجريبي غير محسوب',
      'استراحة 30 ثانية بين الأقسام',
      'توقيت دقيق لكل قسم بمفرده',
    ],
    hint: 'نظام نمر هو النظام الجديد المعتمد حالياً في اختبار قياس — يُوصى به للطلاب الذين يتقدمون للاختبار قريباً.',
  },
  old: {
    id: 5,
    name: 'النظام القديم',
    badge: 'الكلاسيكي',
    badgeColor: 'bg-teal-100',
    icon: Brain,
    gradient: 'from-teal-600 to-blue-600',
    borderActive: 'border-teal-400',
    description: 'النظام الكلاسيكي لاختبار قياس القدرات — الشكل الأصلي المعروف',
    stats: [
      { label: 'الأقسام', value: '7 أقسام' },
      { label: 'الأسئلة', value: '120 سؤال' },
      { label: 'مختلط', value: 'لفظي + كمي' },
      { label: 'الوقت الكلي', value: '120 دقيقة' },
    ],
    features: [
      '3 أقسام مختلطة + 4 أقسام منفصلة',
      'توزيع متوازن بين اللفظي والكمي',
      'أسئلة من بنك متنوع',
      'تقرير مفصل بعد الانتهاء',
    ],
    hint: 'النظام القديم مفيد للتدريب العام والفهم الشامل لأنواع الأسئلة — الوقت أكثر مرونة.',
  },
};

export default function TahsilikQualificationTest() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<SystemType>('namir');

  const system = SYSTEMS[selected];
  const SystemIcon = system.icon;

  const handleStart = () => {
    setLocation(`/qiyas?examId=${system.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-500/30 dark:from-gray-950 dark:to-teal-500/20 py-6 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setLocation('/tahsilik')}
            className="text-gray-500 hover:text-teal-700 transition-colors"
            data-testid="btn-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">اختبار قدراتك التأهلي</h1>
            <p className="text-sm text-gray-500">اختر نظام الاختبار الذي تريد التدرب عليه</p>
          </div>
        </div>

        {/* System selector toggle */}
        <div className="flex bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-1 mb-6 shadow-sm gap-1">
          {(Object.keys(SYSTEMS) as SystemType[]).map(key => {
            const s = SYSTEMS[key];
            const Icon = s.icon;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                data-testid={`tab-${key}`}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  selected === key
                    ? `bg-gradient-to-r ${s.gradient} text-white shadow`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Selected system card */}
        <div className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${system.borderActive} p-5 mb-5 shadow-sm transition-all duration-200`}>
          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${system.gradient} flex items-center justify-center shrink-0`}>
              <SystemIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">{system.name}</h2>
                <Badge className={`${system.badgeColor} text-white border-0 text-xs`}>{system.badge}</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{system.description}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {system.stats.map((stat, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-2">
            {system.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 shrink-0 ${selected === 'namir' ? 'text-rose-500' : 'text-teal-700'}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hint */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 mb-5 flex gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{system.hint}</p>
        </div>

        {/* Switch hint */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 justify-center">
          <Shuffle className="h-3.5 w-3.5" />
          <span>يمكنك التنقل بين النظامين في أي وقت باستخدام الأزرار أعلاه</span>
        </div>

        {/* CTA */}
        <Button
          onClick={handleStart}
          className={`w-full bg-gradient-to-r ${system.gradient} hover:opacity-90 text-white rounded-2xl py-4 text-base font-bold shadow-lg`}
          data-testid="btn-start-exam"
        >
          <ChevronRight className="h-5 w-5 ml-2" />
          ابدأ اختبار {system.name}
        </Button>

        <Button
          variant="ghost"
          onClick={() => setLocation('/qiyas')}
          className="w-full mt-2 text-gray-400 text-sm"
          data-testid="btn-all-exams"
        >
          عرض جميع الاختبارات
        </Button>

      </div>
    </div>
  );
}
