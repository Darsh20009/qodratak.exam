import { Link, useLocation } from "wouter";
import { Building2, ClipboardList, ShieldCheck, Users, ArrowLeft } from "lucide-react";

const portalHighlights = [
  { title: "الطلاب", text: "إدارة الطلاب عند التفعيل", Icon: Users },
  { title: "المتابعة", text: "تقارير واضحة للحساب", Icon: ClipboardList },
  { title: "الحماية", text: "صلاحيات منفصلة وآمنة", Icon: ShieldCheck },
];

export default function InstitutionPortalPage() {
  const [, setLocation] = useLocation();
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();

  return (
    <div className="min-h-full bg-[#F7F4EE] px-5 py-10 sm:px-8" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-[#24202D]/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#171723] text-[#91D7C5]"><Building2 className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-black tracking-[.14em] text-[#8B8278]">بوابة المؤسسة</p>
              <h1 className="mt-1 text-2xl font-black text-[#171723]">{user.institution?.name || user.fullName || user.name || "حساب المؤسسة"}</h1>
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden border border-[#24202D]/10 bg-[#FFFCF7] shadow-[0_20px_60px_rgba(42,38,54,.08)]">
          <div className="border-b border-[#24202D]/10 p-6 sm:p-8">
            <span className="border border-[#FF8A70]/45 bg-[#FFF0EC] px-2.5 py-1 text-xs font-black text-[#A74B3A]">حساب مؤسسة تجريبي</span>
            <h2 className="mt-4 text-3xl font-black text-[#171723]">أهلًا بك في مساحة مؤسستك.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6B625B]">هذه مساحة آمنة لمعاينة رحلة المؤسسة. عند تفعيل حساب مؤسسة حقيقي من الإدارة، ستظهر هنا بيانات الطلاب والتقارير والخطط الخاصة بها.</p>
          </div>
          <div className="grid gap-px bg-[#24202D]/10 sm:grid-cols-3">
            {portalHighlights.map(({ title, text, Icon }) => (
              <div key={title} className="bg-[#FFFCF7] p-6">
                <Icon className="h-5 w-5 text-[#FF8A70]" />
                <h3 className="mt-3 text-sm font-black text-[#171723]">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#6B625B]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/account" className="inline-flex items-center gap-2 bg-[#171723] px-5 py-3 text-sm font-black text-white transition hover:bg-[#2A2636]">إدارة الحساب <ArrowLeft className="h-4 w-4" /></Link>
          <button onClick={() => setLocation("/")} className="border border-[#24202D]/15 px-5 py-3 text-sm font-black text-[#171723] transition hover:bg-[#24202D]/5">العودة للرئيسية</button>
        </div>
      </div>
    </div>
  );
}