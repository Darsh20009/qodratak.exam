import { LayoutGrid, Maximize, Minimize, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  focused: boolean;
  notebookOpen: boolean;
  fullscreenRequired: boolean;
  onFullscreen: () => void;
  onNotebook: () => void;
  timeLabel: string;
  urgent?: boolean;
  questionNumber: number;
  totalQuestions: number;
  showNavigation: boolean;
  navigationOpen: boolean;
  onNavigation: () => void;
  questionGrid: ReactNode;
  studyTools?: ReactNode;
  actions?: ReactNode;
  notice?: string;
}

export function ExamWorkspaceToolbar(props: Props) {
  const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600";
  return (
    <div className="relative z-30 hidden shrink-0 border-b border-gray-200 bg-white px-3 py-2 md:block" dir="rtl" data-testid="exam-workspace-toolbar">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={button} onClick={props.onFullscreen} aria-pressed={props.focused}
          disabled={props.focused && props.fullscreenRequired} data-testid="button-exam-fullscreen"
          title={props.fullscreenRequired ? "هذا الاختبار يتطلب البقاء في وضع الشاشة الكاملة" : undefined}>
          {props.focused ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          {props.focused ? props.fullscreenRequired ? "الشاشة الكاملة" : "الخروج من الشاشة الكاملة" : "الشاشة الكاملة"}
        </button>
        <button type="button" className={`${button} ${props.notebookOpen ? "!border-blue-400 !bg-blue-50 !text-blue-800" : ""}`}
          onClick={props.onNotebook} aria-pressed={props.notebookOpen} aria-controls="exam-notebook-panel" data-testid="button-exam-notebook">
          <NotebookPen className="h-4 w-4" /> النوتة
        </button>
        {props.showNavigation && (
          <button type="button" className={button} onClick={props.onNavigation} aria-expanded={props.navigationOpen}
            aria-controls="exam-focus-question-grid" data-testid="button-exam-question-grid">
            <LayoutGrid className="h-4 w-4" /> الأسئلة
          </button>
        )}
        {props.studyTools}
        {props.focused && props.actions && <div className="flex flex-wrap items-center gap-2">{props.actions}</div>}
        <div className="mr-auto flex items-center gap-3">
          <span className="text-xs font-bold text-gray-600">سؤال {props.questionNumber} / {props.totalQuestions}</span>
          <span role="timer" aria-label="الوقت المتبقي" className={`rounded-lg px-3 py-2 font-mono text-lg font-bold ${props.urgent ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-800"}`} data-testid="exam-workspace-timer">{props.timeLabel}</span>
        </div>
      </div>
      {props.notice && <p role="status" className="mt-2 text-xs leading-5 text-gray-600">{props.notice}</p>}
      {props.showNavigation && props.navigationOpen && (
        <div id="exam-focus-question-grid" className="absolute right-3 top-full mt-1 max-h-[60dvh] w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <p className="mb-3 text-sm font-bold text-gray-800">الانتقال بين أسئلة القسم</p>
          {props.questionGrid}
        </div>
      )}
    </div>
  );
}
