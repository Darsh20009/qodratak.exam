import { useLocation } from "wouter";
import { SEO, PLATFORM_DESCRIPTION, PLATFORM_NAME } from "@/components/SEO";
import { LEGAL_ENTITY_NAME } from "@/constants/legalIdentity";

type RouteMetadata = {
  title: string;
  description: string;
  structuredData?: Record<string, unknown>;
};

const PUBLIC_ROUTE_METADATA: Record<string, RouteMetadata> = {
  "/": {
    title: "قدراتك | منصة القدرات والتحصيلي في السعودية",
    description:
      "قدراتك (Qodratak) هي منصة القدرات والتحصيلي في السعودية: تأسيس لفظي وكمي، بنك أسئلة، اختبارات محاكية وخطة تدريب واضحة.",
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["Organization", "EducationalOrganization"],
          "@id": "https://qodratak.sa/#organization",
          name: "قدراتك",
          legalName: LEGAL_ENTITY_NAME,
          alternateName: ["منصة قدراتك", "منصة قدراتك التعليمية", "Qodratak"],
          description: "منصة تعليمية وتدريبية متكاملة لطلاب الثانوية في السعودية للاستعداد للقدرات والتحصيلي.",
          url: "https://qodratak.sa/",
          areaServed: { "@type": "Country", name: "Saudi Arabia" },
          knowsAbout: ["اختبار القدرات العامة", "اختبار التحصيلي", "القدرات اللفظية", "القدرات الكمية"],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "مسارات الاختبارات",
            itemListElement: [
              { "@type": "Course", name: "تدريب اختبار القدرات العامة" },
              { "@type": "Course", name: "تدريب اختبار التحصيلي" },
            ],
          },
        },
        {
          "@type": "WebSite",
          "@id": "https://qodratak.sa/#website",
          name: "قدراتك",
          alternateName: ["منصة قدراتك", "Qodratak"],
          url: "https://qodratak.sa/",
          inLanguage: "ar-SA",
          publisher: { "@id": "https://qodratak.sa/#organization" },
        },
        {
          "@type": "WebPage",
          "@id": "https://qodratak.sa/#webpage",
          name: "قدراتك | منصة القدرات والتحصيلي في السعودية",
          url: "https://qodratak.sa/",
          inLanguage: "ar-SA",
          isPartOf: { "@id": "https://qodratak.sa/#website" },
          about: { "@id": "https://qodratak.sa/#organization" },
        },
        {
          "@type": "FAQPage",
          "@id": "https://qodratak.sa/#faq",
          mainEntity: [
            {
              "@type": "Question",
              name: "ما هي قدراتك؟",
              acceptedAnswer: {
                "@type": "Answer",
                text: "قدراتك (Qodratak) منصة تعليمية سعودية تساعد الطلاب على الاستعداد لاختبارات القدرات والتحصيلي من خلال التأسيس وبنك الأسئلة والاختبارات المحاكية وتحليل النتائج.",
              },
            },
            {
              "@type": "Question",
              name: "هل منصة قدراتك مناسبة للتدريب على القدرات والتحصيلي؟",
              acceptedAnswer: {
                "@type": "Answer",
                text: "نعم، تقدم منصة قدراتك مسارات منفصلة للقدرات اللفظية والكمية وللتحصيلي، مع شروحات وتدريب واختبارات محاكية وخطة تقدم.",
              },
            },
            {
              "@type": "Question",
              name: "كيف أبدأ في قدراتك؟",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ابدأ من الصفحة الرئيسية، اختر مسار القدرات أو التحصيلي، ثم حدد مستوى التدريب وابدأ بالدرس أو الاختبار المناسب لك.",
              },
            },
          ],
        },
      ],
    },
  },
  "/qiyas-hub": {
    title: "اختبارات القدرات وقياس | منصة قدراتك",
    description:
      "ابدأ التدريب على اختبار القدرات العامة مع اختبارات محاكية وأقسام لفظية وكمية وخطة تساعدك على معرفة مستواك.",
  },
  "/learn": {
    title: "المكتبة التعليمية للقدرات والتحصيلي | منصة قدراتك",
    description:
      "مكتبة قدراتك التعليمية تجمع الشروحات التأسيسية وأسئلة التدريب للقدرات والتحصيلي في مسار واضح يناسب مرحلة استعدادك.",
  },
  "/teacher": {
    title: "نظام المعلم للتدريب على القدرات | منصة قدراتك",
    description:
      "نظام المعلم من قدراتك يتيح تقييماً تشخيصياً ومساراً تعليمياً يساعد على تنظيم التدريب ومتابعة الاحتياج.",
  },
  "/install": {
    title: "تثبيت تطبيق منصة قدراتك | تدريب القدرات والتحصيلي",
    description:
      "تعرف على طرق تثبيت منصة قدراتك على الجوال والكمبيوتر للوصول إلى اختبارات القدرات والتحصيلي ومتابعة تقدمك بسهولة.",
  },
  "/usage-guide": {
    title: "دليل استخدام منصة قدراتك | ابدأ التدريب بثقة",
    description:
      "دليل عربي يشرح طريقة استخدام منصة قدراتك، بدءاً من إنشاء الحساب وحتى التدريب على القدرات والتحصيلي ومراجعة النتائج.",
  },
  "/platform-guide": {
    title: "دليل منصة قدراتك للتدريب على القدرات",
    description:
      "تعرف على أقسام منصة قدراتك وطريقة الاستفادة من الاختبارات اللفظية والكمية والمحاكاة وبنك الأسئلة.",
  },
  "/faq": {
    title: "الأسئلة الشائعة عن منصة قدراتك | الدعم",
    description:
      "إجابات واضحة عن منصة قدراتك، أنواع اختبارات القدرات والتحصيلي، الحسابات، التجربة المجانية، الاشتراكات وطرق الدعم.",
  },
  "/guide": {
    title: "دليل الخدمات وطريقة الاستخدام | منصة قدراتك",
    description:
      "تعرف على رحلة الطالب وخدمات منصة قدراتك وبنك الأسئلة والمدرب الذكي والاختبارات المحاكية والأسعار ووسائل الدفع.",
  },
  "/pricing": {
    title: "أسعار قدراتك وباقات التدريب | منصة القدرات والتحصيلي",
    description:
      "تعرف على باقات قدراتك للتدريب على القدرات والتحصيلي، وماذا يتضمن كل اشتراك من بنك أسئلة واختبارات وتحليل للتقدم.",
  },
  "/terms": {
    title: "الشروط والأحكام | منصة قدراتك",
    description: "الشروط والأحكام المنظمة لاستخدام منصة قدراتك التعليمية وفق الأنظمة السارية في المملكة العربية السعودية.",
  },
  "/privacy": {
    title: "سياسة الخصوصية وحماية البيانات | منصة قدراتك",
    description: "تعرف على طريقة جمع ومعالجة وحماية بيانات مستخدمي منصة قدراتك وحقوقهم وفق نظام حماية البيانات الشخصية السعودي.",
  },
  "/refund-policy": {
    title: "سياسة الاسترجاع والاستبدال | منصة قدراتك",
    description: "تعرف على ضوابط استرجاع المبالغ وإلغاء الاشتراكات واستبدال الباقات في منصة قدراتك.",
  },
};

export function RouteSEO({ isAuthenticated, isLoading }: { isAuthenticated?: boolean; isLoading?: boolean }) {
  const [location] = useLocation();
  const metadata = PUBLIC_ROUTE_METADATA[location];
  const isPublicRoute = !isLoading && Boolean(metadata) && !(location === "/" && isAuthenticated);

  return (
    <SEO
      title={metadata?.title || PLATFORM_NAME}
      description={metadata?.description || PLATFORM_DESCRIPTION}
      url={location || "/"}
      noIndex={!isPublicRoute}
      manageCanonical
      manageRobots
      structuredData={metadata?.structuredData}
    />
  );
}