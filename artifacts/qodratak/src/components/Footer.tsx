import { Clock3, ExternalLink, Mail, MapPin, MessageCircle } from "lucide-react";
import { LEGAL_ENTITY_NAME, SUPPORT_EMAIL, SUPPORT_PHONE, UNIFIED_NATIONAL_NUMBER } from "@/constants/legalIdentity";
import { BrandMark } from "@/components/BrandMark";

type FooterLink = { label: string; href: string; soon?: boolean };

const serviceLinks: FooterLink[] = [
  { label: "تدريب اختبار القدرات", href: "/qiyas-hub" },
  { label: "التحصيلي", href: "/tahsilik", soon: true },
  { label: "اختبارات تجريبية مجانية", href: "/free-verbal-test" },
  { label: "الدورات", href: "/courses" },
  { label: "مقالات ودلائل", href: "/learn" },
  { label: "الباقات والاشتراكات", href: "/#plans" },
  { label: "دليل الخدمات وطريقة الاستخدام", href: "/guide" },
  { label: "دليل التدريب المتقدم", href: "/platform-guide" },
  { label: "الأسئلة الشائعة", href: "/faq" },
];

const policyLinks: FooterLink[] = [
  { label: "الشروط والأحكام", href: "/terms" },
  { label: "الخصوصية وحماية البيانات (PDPL)", href: "/privacy" },
  { label: "الاسترجاع والاستبدال", href: "/refund-policy" },
  { label: "الشكاوى والدعم", href: "/support" },
];

const paymentMethods = ["مدى Mada", "Apple Pay", "Visa", "MasterCard"];

const focusRing =
  "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function LinkColumn({ title, links, testId }: { title: string; links: FooterLink[]; testId: string }) {
  return (
    <nav aria-label={title} data-testid={testId}>
      <h3 className="text-sm font-black text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={`inline-flex items-center gap-2 text-[13px] font-bold text-muted-foreground transition-colors duration-200 hover:text-foreground ${focusRing}`}
              data-testid={`link-footer-${link.href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"}`}
            >
              {link.label}
              {link.soon && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground">
                  قريبًا
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const whatsappHref = `https://wa.me/966${SUPPORT_PHONE.replace(/^0/, "")}`;

  return (
    <footer id="footer" className="border-t border-border bg-muted/40 text-foreground dark:bg-card/60" dir="rtl">
      <div className="mx-auto max-w-6xl px-5 pb-4 pt-8 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.15fr] lg:gap-10">
          {/* Brand + payment */}
          <div className="min-w-0">
            <BrandMark imageClassName="h-10 w-10" />
            <p className="mt-1.5 text-xs font-bold text-muted-foreground">{LEGAL_ENTITY_NAME}</p>
            <p className="mt-3 max-w-sm text-[13px] leading-6 text-muted-foreground">
              منصة تعليمية وتدريبية لطلاب الثانوية بالمملكة العربية السعودية، متوافقة مع أنظمة التجارة الإلكترونية وحماية البيانات الشخصية (PDPL).
            </p>
            <p className="mt-4 text-[11px] font-black text-muted-foreground">وسائل الدفع الإلكتروني المعتمدة</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {paymentMethods.map((method) => (
                <li key={method} className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-black text-foreground">
                  {method}
                </li>
              ))}
            </ul>
          </div>

          <LinkColumn title="الاختبارات والخدمات" links={serviceLinks} testId="nav-footer-services" />
          <LinkColumn title="السياسات والأنظمة" links={policyLinks} testId="nav-footer-policies" />

          {/* Support */}
          <div className="min-w-0">
            <h3 className="text-sm font-black">الدعم وخدمة العملاء</h3>
            <a href="/support" className={`mt-3 inline-block text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground ${focusRing}`} data-testid="link-footer-support-center">
              مركز الدعم والتواصل
            </a>
            <div className="mt-3 space-y-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-2.5 transition-colors duration-200 hover:bg-emerald-600/15 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:hover:bg-emerald-400/15 ${focusRing}`}
                data-testid="link-footer-whatsapp"
              >
                <MessageCircle className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-black text-emerald-800 dark:text-emerald-300">الدعم الفني عبر واتساب</span>
                  <span dir="ltr" className="block text-sm font-black text-emerald-700 dark:text-emerald-400">{SUPPORT_PHONE}</span>
                </span>
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={`flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-colors duration-200 hover:border-foreground/25 dark:border-slate-200 dark:bg-slate-100 dark:hover:border-slate-400 ${focusRing}`}
                data-testid="link-footer-email"
              >
                <Mail className="h-5 w-5 shrink-0 text-muted-foreground dark:text-slate-600" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-black text-muted-foreground dark:text-slate-600">راسلنا عبر البريد الإلكتروني</span>
                  <span dir="ltr" className="block break-all text-sm font-black text-foreground dark:text-slate-900">{SUPPORT_EMAIL}</span>
                </span>
              </a>
            </div>
            <div className="mt-3 space-y-1.5 text-xs font-bold text-muted-foreground">
              <p className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                ساعات العمل: 9:00 ص - 10:00 م
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                المملكة العربية السعودية
              </p>
            </div>
          </div>
        </div>

        {/* Legal strip */}
        <div className="mt-7 flex flex-col gap-3 border-t border-border pt-4 text-[11px] font-bold text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p data-testid="text-footer-legal">
            © 2026 {LEGAL_ENTITY_NAME}. جميع الحقوق محفوظة.
            <span className="mx-2 text-border" aria-hidden="true">|</span>
            الرقم الوطني الموحد: <span dir="ltr">{UNIFIED_NATIONAL_NUMBER}</span>
          </p>
          <a
            href="https://qiroxstudio.online"
            target="_blank"
            rel="noopener noreferrer"
            className={`group inline-flex items-center gap-1.5 self-start px-1 py-0.5 text-[11px] font-black transition-colors hover:text-foreground md:self-auto ${focusRing}`}
            data-testid="link-footer-qirox"
          >
            <span dir="ltr">Made by Qirox Studio Group</span>
            <img
              src="https://qiroxstudio.online/qirox-icon-nobg.png"
              alt="شعار Qirox Studio"
              width="20"
              height="20"
              loading="lazy"
              className="h-5 w-5 object-contain opacity-75 transition-opacity group-hover:opacity-100"
            />
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
