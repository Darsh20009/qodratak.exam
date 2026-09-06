import React from "react";
import { Link } from "wouter";
import { 
  BrainCircuit, 
  Calculator, 
  BookOpen, 
  Layers, 
  FolderOpen, 
  Activity,
  GraduationCap,
  Microscope,
  ChevronLeft,
  TrendingUp
} from "lucide-react";

export default function ComputerizedPage() {
  return (
    <div className="mx-auto max-w-5xl p-5 md:p-8 animate-fade-in space-y-10">
      <header>
        <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white mb-2">المحوسب</h1>
        <p className="text-sm text-muted-foreground">اختبارات تحاكي اختبار قياس الحقيقي لتدريب فعال.</p>
      </header>

      {/* Qudrat Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="h-6 w-6 text-[#398B79] dark:text-emerald-400" />
          <h2 className="text-xl font-black text-foreground">القدرات</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "قدرات كمي", desc: "تدريب على مسائل الجبر والهندسة", href: "/quantitative-tests", icon: Calculator, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { title: "قدرات لفظي", desc: "تدريب على التناظر وإكمال الجمل", href: "/verbal-tests", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { title: "اختبار مختلط", desc: "محاكاة لاختبار قدرات كامل", href: "/qiyas", icon: Activity, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { title: "بنك الأسئلة", desc: "تصفح آلاف الأسئلة وتدرب", href: "/question-bank", icon: Layers, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="group rounded-2xl border border-border bg-white dark:bg-card p-5 h-full transition hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between">
                <div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.bg} ${item.color} mb-4`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-black text-foreground text-lg mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                  ابدأ الآن <ChevronLeft className="h-3 w-3 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tahsili Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="h-6 w-6 text-rose-500 dark:text-rose-400" />
          <h2 className="text-xl font-black text-foreground">التحصيلي</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "تدريب المواد", desc: "تدريب منفصل لكل مادة علمية", href: "/tahsili", icon: Microscope, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
            { title: "بنك التحصيلي", desc: "مراجعة أسئلة التجميعات", href: "/tahsili/question-bank", icon: Layers, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            { title: "اختبار شامل", desc: "اختبار تحصيلي يحاكي الواقع", href: "/tahsili/exams", icon: Activity, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
            { title: "التقدم", desc: "متابعة تطور مستواك", href: "/records", icon: TrendingUp, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/20" },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="group rounded-2xl border border-border bg-white dark:bg-card p-5 h-full transition hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between">
                <div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.bg} ${item.color} mb-4`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-black text-foreground text-lg mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                  استمر <ChevronLeft className="h-3 w-3 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Shared Tools */}
      <section className="border-t border-border pt-8">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-2xl">
          <Link href="/folders">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-foreground">مجلداتي</h3>
                <p className="text-xs text-muted-foreground mt-0.5">أسئلتك واختباراتك المحفوظة</p>
              </div>
            </div>
          </Link>
          <Link href="/records">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-foreground">سجل التقدم</h3>
                <p className="text-xs text-muted-foreground mt-0.5">نتائج اختباراتك السابقة</p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
