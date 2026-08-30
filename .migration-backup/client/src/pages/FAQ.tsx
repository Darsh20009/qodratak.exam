import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, HelpCircleIcon, MessageCircleIcon, BookOpenIcon, ClockIcon, CrownIcon, StarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    category: 'عام',
    icon: HelpCircleIcon,
    color: 'from-blue-500 to-emerald-600',
    questions: [
      {
        question: 'ما هو موقع قدراتك؟',
        answer: 'قدراتك هو منصة تعليمية شاملة مصممة لمساعدة الطلاب في التحضير لاختبارات القياس. نوفر اختبارات تفاعلية، وتحليلات مفصلة، وأدوات إدارة الوقت لضمان نجاحك.'
      },
      {
        question: 'هل الموقع مجاني؟',
        answer: 'نعم! نؤمن أن التعليم حق للجميع. جميع الميزات الأساسية متاحة مجاناً مع تجربة 7 أيام للمستخدمين الجدد. الاشتراكات المدفوعة تساعد في دعم المنصة وتوفير المحتوى المجاني للجميع.'
      },
      {
        question: 'كيف يمكنني إنشاء حساب؟',
        answer: 'يمكنك البدء مباشرة كمستخدم مجاني دون تسجيل. للحصول على مميزات إضافية، يمكنك التسجيل أو الاشتراك في الخطط المدفوعة.'
      }
    ]
  },
  {
    category: 'الاختبارات',
    icon: BookOpenIcon,
    color: 'from-green-500 to-teal-600',
    questions: [
      {
        question: 'ما أنواع الاختبارات المتاحة؟',
        answer: 'نوفر اختبارات القدرات اللفظية والكمية، اختبارات محاكاة قياس الكاملة، تحديات متنوعة، واختبارات مخصصة حسب نقاط ضعفك.'
      },
      {
        question: 'كم عدد الأسئلة المتاحة؟',
        answer: 'لدينا أكثر من 2500 سؤال متنوع يغطي جميع أقسام اختبار القياس، مع إضافة أسئلة جديدة بانتظام.'
      },
      {
        question: 'هل يمكنني مراجعة إجاباتي؟',
        answer: 'بالطبع! يمكنك مراجعة جميع إجاباتك، رؤية الحلول المفصلة، وتحميل تقارير لأخطائك للمراجعة لاحقاً.'
      }
    ]
  },
  {
    category: 'التجربة المجانية',
    icon: ClockIcon,
    color: 'from-orange-500 to-red-600',
    questions: [
      {
        question: 'كم تدوم التجربة المجانية؟',
        answer: 'التجربة المجانية تدوم 7 أيام كاملة للمستخدمين الجدد. بعدها يمكنك الاستمرار بالميزات الأساسية أو الاشتراك للحصول على مميزات إضافية.'
      },
      {
        question: 'ماذا يحدث بعد انتهاء التجربة المجانية؟',
        answer: 'بعد انتهاء التجربة المجانية، ستحتاج للاشتراك للوصول للمحتوى المتقدم. يمكنك اختيار الخطة التي تناسبك.'
      },
      {
        question: 'هل يمكنني تمديد التجربة المجانية؟',
        answer: 'التجربة المجانية محدودة بـ 7 أيام لكل جهاز. لكن يمكنك الاشتراك في خططنا المعقولة للاستمرار.'
      }
    ]
  },
  {
    category: 'الاشتراكات',
    icon: CrownIcon,
    color: 'from-green-600 to-amber-600',
    questions: [
      {
        question: 'ما هي خطط الاشتراك المتاحة؟',
        answer: ' نوفر خطط كثيرة مثل pro  الشهرية والتي يكون اشتراكها 49 ريال و خطة pro life  لثلث أشهر و التي يكون اشتراكه 117 بدل من 149  و الأخيرة pro life plus  والتي تكون بي 235 بدلا من 297'
      },
      {
        question: 'ما الفرق بين الحساب المجاني والمدفوع؟',
        answer: 'الحساب المدفوع يوفر وصولاً غير محدود، مميزات متقدمة، دعم أولوية، وتحليلات مفصلة. المجاني يشمل الميزات الأساسية مع حدود زمنية.'
      },
    ]
  },
  {
    category: 'الدعم الفني',
    icon: MessageCircleIcon,
    color: 'from-teal-500 to-blue-600',
    questions: [
      {
        question: 'ما هي ساعات عمل الدعم الفني؟',
        answer: 'نحن متاحون يومياً من الساعة 10 صباحاً حتى 12 منتصف الليل. يوم الجمعة من الساعة 2 ظهراً حتى 11 مساءً.'
      },
      {
        question: 'كيف يمكنني التواصل مع الدعم؟',
        answer: 'يمكنك التواصل معنا عبر تيليجرام مباشرة من الموقع. فريق الدعم يرد خلال دقائق في أوقات العمل.'
      },
      {
        question: 'هل الدعم متاح باللغة العربية؟',
        answer: 'نعم، جميع خدمات الدعم الفني متاحة باللغة العربية مع فريق متخصص ومتفهم لاحتياجات الطلاب السعوديين.'
      }
    ]
  }
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 text-right focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium text-gray-900 dark:text-white">
          {question}
        </span>
        <div className="mr-4">
          {isOpen ? (
            <ChevronUpIcon className="w-5 h-5 text-blue-600" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
    </button>
    {isOpen && (
      <div className="px-6 pb-4">
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {answer}
        </p>
      </div>
    )}
  </div>
);

export const FAQPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
            <HelpCircleIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🤔 الأسئلة الشائعة
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          نجيب على جميع استفساراتك حول منصة قدراتك وخدماتنا التعليمية
        </p>
      </div>

      {/* فيديو شرح المنصة */}
      <Card className="mb-12 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <BookOpenIcon className="w-5 h-5" />
            </div>
            🎥 فيديو شرح المنصة
            <div className="mr-auto">
              <StarIcon className="w-5 h-5 animate-pulse" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              شاهد كيفية استخدام منصة قدراتك
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              فيديو شامل يوضح جميع ميزات المنصة وطريقة الاستفادة منها بأفضل شكل
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 shadow-inner">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe 
                  src="https://www.youtube.com/embed/uojLGnnUbk8?rel=0&modestbranding=1&showinfo=0"
                  title="فيديو تعريف منصة قدراتك"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
                  style={{ border: 'none' }}
                ></iframe>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {faqs.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          
          return (
            <Card key={categoryIndex} className="overflow-hidden">
              <CardHeader className={`bg-gradient-to-r ${category.color} text-white`}>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {category.category}
                  <div className="mr-auto">
                    <StarIcon className="w-5 h-5 animate-pulse" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {category.questions.map((item, itemIndex) => {
                  const itemId = `${categoryIndex}-${itemIndex}`;
                  return (
                    <FAQItem
                      key={itemId}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openItems[itemId] || false}
                      onToggle={() => toggleItem(itemId)}
                    />
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact Section */}
      <Card className="mt-12 bg-gradient-to-r from-blue-50 to-emerald-600 dark:from-blue-900/20 dark:to-emerald-600/20 border-blue-200 dark:border-blue-700">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center">
              <MessageCircleIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            لم تجد إجابة لسؤالك؟
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            فريق الدعم الفني في خدمتك على مدار الساعة للإجابة على جميع استفساراتك
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <Button 
              onClick={() => window.location.href = '/support'}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white"
            >
              <MessageCircleIcon className="w-4 h-4 mr-2" />
              تواصل مع الدعم
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400 py-3">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              متاح يومياً 10ص - 12م
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQPage;