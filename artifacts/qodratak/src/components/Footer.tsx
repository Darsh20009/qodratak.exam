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
    <footer id="footer" className="border-t border-border bg-background text-foreground" dir="rtl">
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
                <p className="mt-0.5 text-xs font-bold text-muted-foreground">قدراتك · Qodratak</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              منصة تعليمية وتدريبية متكاملة لطلاب الثانوية بالمملكة العربية السعودية، تساعدك على الاستعداد بخطة واضحة ونتيجة تفهمها.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black">تجربة تعليمية موثوقة</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    متوافقة مع متطلبات وزارة التجارة وأنظمة التجارة الإلكترونية وحماية البيانات الشخصية (PDPL).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-black text-muted-foreground">وسائل الدفع الإلكتروني المعتمدة</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span key={method} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-black text-foreground">
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
                <a key={link.label} href={link.href} className="block text-sm font-bold text-muted-foreground transition hover:text-foreground">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-black">ابدأ مع قدراتك</h3>
            <nav className="mt-4 space-y-3" aria-label="طريقة العمل والأسعار">
              <a href="/guide" className="block text-sm font-bold text-muted-foreground transition hover:text-foreground">دليل الخدمات وطريقة الاستخدام</a>
              <a href="/platform-guide" className="block text-sm font-bold text-muted-foreground transition hover:text-foreground">دليل التدريب المتقدم</a>
              <a href="/pricing" className="block text-sm font-bold text-muted-foreground transition hover:text-foreground">الأسعار والاشتراكات</a>
              <a href="/faq" className="block text-sm font-bold text-muted-foreground transition hover:text-foreground">الأسئلة الشائعة</a>
            </nav>

            <h3 className="mt-8 text-sm font-black">السياسات والأنظمة</h3>
            <div className="mt-4 space-y-3">
              {policyLinks.map((link) => (
                <a key={link.href} href={link.href} className="block text-sm font-bold text-muted-foreground transition hover:text-foreground">{link.label}</a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black">الدعم وخدمة العملاء</h3>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <a href="/support" className="flex items-center gap-2 font-bold transition hover:text-foreground">
                <MessageCircle className="h-4 w-4 text-primary" />
                مركز الدعم والتواصل
              </a>
              <a href="https://wa.me/966510510140" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-bold text-primary transition hover:text-foreground">
                <Phone className="h-4 w-4" />
                <span dir="ltr">0510510140</span>
              </a>
              <p className="flex items-start gap-2 font-bold">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ساعات العمل: 9:00 ص - 10:00 م
              </p>
              <p className="flex items-start gap-2 font-bold">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                المملكة العربية السعودية
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <div className="flex flex-col gap-4 text-xs font-bold text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 منصة قدرات التعليمية. جميع الحقوق محفوظة.</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <a href="/terms" className="hover:text-foreground">الشروط والأحكام</a>
              <span aria-hidden="true">•</span>
              <a href="/privacy" className="hover:text-foreground">الخصوصية</a>
              <span aria-hidden="true">•</span>
              <a href="/refund-policy" className="hover:text-foreground">الاسترجاع</a>
              <span aria-hidden="true">•</span>
              <a href="/support" className="hover:text-foreground">الشكاوى والدعم</a>
            </div>
          </div>

          <div className="mt-7 flex justify-center">
            <a
              href="https://qiroxstudio.online"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-muted-foreground transition hover:bg-muted hover:text-foreground"
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