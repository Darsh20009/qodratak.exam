import { Clock3, ExternalLink, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";

const learningLinks = [
  { label: "تدريب اختبار القدرات", href: "/qiyas-hub" },
  { label: "تدريب اختبار التحصيلي", href: "/tahsilik" },
  { label: "اختبارات تجريبية مجانية", href: "/free-verbal-test" },
  { label: "الدورات", href: "/courses" },
  { label: "مقالات ودلائل", href: "/learn" },
];

const policyLinks = [
  { label: "الشروط والأحكام", href: "/terms" },
  { label: "الخصوصية وحماية البيانات (PDPL)", href: "/privacy" },
  { label: "الاسترجاع والاستبدال", href: "/refund-policy" },
];

const paymentMethods = ["مدى Mada", "Apple Pay", "Visa", "MasterCard"];

export function Footer() {
  return (
    <footer id="footer" className="border-t border-[#D9E1E5] bg-gradient-to-b from-[#F4F8FA] to-[#EAF2F5] text-[#172337]" dir="rtl">
      <div className="mx-auto max-w-6xl px-5 pb-5 pt-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/qodratak-logo-transparent.png"
                alt="شعار منصة قدرات التعليمية"
                width="48"
                height="48"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h2 className="text-lg font-black">منصة قدرات التعليمية</h2>
                <p className="mt-0.5 text-xs font-bold text-[#5E7180]">قدراتك · Qodratak</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#5E7180]">
              منصة تعليمية وتدريبية متكاملة لطلاب الثانوية بالمملكة العربية السعودية، تساعدك على الاستعداد بخطة واضحة ونتيجة تفهمها.
            </p>

            <div className="mt-6 rounded-2xl border border-[#C9D9E0] bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#17354A] text-[#91D7C5]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black">تجربة تعليمية موثوقة</p>
                  <p className="mt-1 text-xs leading-5 text-[#5E7180]">
                    متوافقة مع متطلبات وزارة التجارة وأنظمة التجارة الإلكترونية وحماية البيانات الشخصية (PDPL).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-black text-[#5E7180]">وسائل الدفع الإلكتروني المعتمدة</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span key={method} className="rounded-lg border border-[#C9D9E0] bg-white px-3 py-2 text-xs font-black text-[#334B5A]">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black">الاختبارات والخدمات</h3>
            <nav className="mt-4 space-y-3" aria-label="الاختبارات والخدمات">
              {learningLinks.map((link) => (
                <a key={link.label} href={link.href} className="block text-sm font-bold text-[#5E7180] transition hover:text-[#17354A]">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-black">ابدأ مع قدراتك</h3>
            <nav className="mt-4 space-y-3" aria-label="طريقة العمل والأسعار">
              <a href="/guide" className="block text-sm font-bold text-[#5E7180] transition hover:text-[#17354A]">دليل الخدمات وطريقة الاستخدام</a>
              <a href="/platform-guide" className="block text-sm font-bold text-[#5E7180] transition hover:text-[#17354A]">دليل التدريب المتقدم</a>
              <a href="/pricing" className="block text-sm font-bold text-[#5E7180] transition hover:text-[#17354A]">الأسعار والاشتراكات</a>
              <a href="/faq" className="block text-sm font-bold text-[#5E7180] transition hover:text-[#17354A]">الأسئلة الشائعة</a>
            </nav>

            <h3 className="mt-8 text-sm font-black">السياسات والأنظمة</h3>
            <div className="mt-4 space-y-3">
              {policyLinks.map((link) => (
                <a key={link.href} href={link.href} className="block text-sm font-bold text-[#5E7180] transition hover:text-[#17354A]">{link.label}</a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black">الدعم وخدمة العملاء</h3>
            <div className="mt-4 space-y-4 text-sm text-[#5E7180]">
              <a href="/support" className="flex items-center gap-2 font-bold transition hover:text-[#17354A]">
                <MessageCircle className="h-4 w-4 text-[#398B79]" />
                مركز الدعم والتواصل
              </a>
              <a href="https://wa.me/966511500913" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-bold text-[#398B79] transition hover:text-[#17354A]">
                <Phone className="h-4 w-4" />
                <span dir="ltr">0511500913</span>
              </a>
              <p className="flex items-start gap-2 font-bold">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#398B79]" />
                ساعات العمل: 9:00 ص - 10:00 م
              </p>
              <p className="flex items-start gap-2 font-bold">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#398B79]" />
                المملكة العربية السعودية
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[#C9D9E0] pt-6">
          <div className="flex flex-col gap-4 text-xs font-bold text-[#5E7180] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 منصة قدرات التعليمية. جميع الحقوق محفوظة.</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <a href="/terms" className="hover:text-[#17354A]">الشروط والأحكام</a>
              <span aria-hidden="true">•</span>
              <a href="/privacy" className="hover:text-[#17354A]">الخصوصية</a>
              <span aria-hidden="true">•</span>
              <a href="/refund-policy" className="hover:text-[#17354A]">الاسترجاع</a>
              <span aria-hidden="true">•</span>
              <a href="/support" className="hover:text-[#17354A]">الشكاوى والدعم</a>
            </div>
          </div>

          <div className="mt-7 flex justify-center">
            <a
              href="https://qiroxstudio.online"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-[#5E7180] transition hover:bg-white/70 hover:text-[#17354A]"
            >
              <span>Made by Qirox Studio Group</span>
              <img
                src="https://qiroxstudio.online/qirox-icon-nobg.png"
                alt="شعار Qirox Studio"
                width="28"
                height="28"
                loading="lazy"
                className="h-7 w-7 object-contain opacity-75 transition group-hover:opacity-100"
              />
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}