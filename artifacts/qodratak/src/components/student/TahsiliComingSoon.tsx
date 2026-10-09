import { Link, useLocation, useSearch } from 'wouter';
import { LockKeyhole, ArrowLeft, BookOpen } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

export function TahsiliComingSoon() {
  return <div className="mx-auto max-w-xl px-5 py-20 text-center" dir="rtl">
    <LockKeyhole className="mx-auto h-12 w-12 text-muted-foreground" />
    <p className="mt-6 font-bold text-primary">التحصيلي — قريبًا</p>
    <h1 className="mt-3 text-3xl font-black">نجهّز تجربة التحصيلي</h1>
    <p className="mt-4 leading-8 text-muted-foreground">دروس التحصيلي واختباراته وخططه مغلقة مؤقتًا إلى أن يكتمل تجهيزها. نتائجك القديمة محفوظة. يمكنك الآن متابعة مسار القدرات.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link href="/preparation-course" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"><BookOpen className="h-4 w-4" />دورتي في القدرات</Link>
      <Link href="/" className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold"><ArrowLeft className="h-4 w-4" />لوحة التحكم</Link>
    </div>
  </div>;
}
export function StudentAvailabilityBoundary({ children }: { children: React.ReactNode }) {
  const [path] = useLocation();
  const search = useSearch();
  const { user } = useUser();
  const admin = ['system_admin', 'support_admin', 'admin'].includes(user?.role || '');
  const parameters = new URLSearchParams(search);
  const tahsiliPath = /^\/(?:tahsili|tahsilik)(?:[-/]|$)/.test(path) || path === '/student-program/tahsili';
  const tahsiliScope = ['/foundation', '/computerized', '/learning/today', '/preparation-course', '/question-bank'].some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) &&
    ['program', 'programId', 'subject', 'subjectId', 'track'].some((key) => /tahsili|تحصيل/i.test(parameters.get(key) || ''));
  if (!admin && (tahsiliPath || tahsiliScope)) return <TahsiliComingSoon />;
  return <>{children}</>;
}
