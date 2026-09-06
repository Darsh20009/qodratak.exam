import { useLocation } from "wouter";
import { SEO, PLATFORM_DESCRIPTION, PLATFORM_NAME } from "@/components/SEO";

type RouteMetadata = {
  title: string;
  description: string;
  structuredData?: Record<string, unknown>;
};

const PUBLIC_ROUTE_METADATA: Record<string, RouteMetadata> = {
  "/": {
    title: "منصة قدراتك | القدرات والتحصيلي",
    description:
      "منصة قدرات تعليمية لطلاب السعودية: تأسيس ومحوسب للقدرات، تدريب التحصيلي، اختبارات يومية وتحليل واضح للتقدم.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: "منصة قدرات التعليمية - قدراتك",
      alternateName: ["Qodratak", "منصة قدراتك"],
      description: "منصة تعليمية وتدريبية متكاملة لطلاب الثانوية في السعودية للاستعداد للقدرات والتحصيلي.",
      url: "https://qodratak.sa/",
      areaServed: { "@type": "Country", name: "Saudi Arabia" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "مسارات الاختبارات",
        itemListElement: [
          { "@type": "Course", name: "تدريب اختبار القدرات العامة" },
          { "@type": "Course", name: "تدريب اختبار التحصيلي" },
        ],
      },
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
  "/pricing": {
    title: "أسعار وخطط منصة قدراتك للتدريب",
    description:
      "قارن خطط منصة قدراتك واختر ما يناسب استعدادك لاختبارات القدرات والتحصيلي مع معرفة المزايا المتاحة لكل خطة.",
  },
};

export function RouteSEO() {
  const [location] = useLocation();
  const metadata = PUBLIC_ROUTE_METADATA[location];
  const isAuthenticatedRoot =
    location === "/" &&
    (() => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return Boolean(user?.id || user?._id);
      } catch {
        return false;
      }
    })();
  const isPublicRoute = Boolean(metadata) && !isAuthenticatedRoot;

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