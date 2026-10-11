import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Redo2, Trash2, Undo2, X } from "lucide-react";
import {
  NOTEBOOK_COLORS, NOTEBOOK_SIZES, clearSketch, commitStroke, drawStroke, emptySketch,
  normalizePoint, redoSketch, undoSketch, type NotebookSketch, type NotebookStroke,
} from "@/lib/examNotebook";

export interface ExamNotebookProps {
  open: boolean;
  questionKey: string;
  questionLabel: string;
  onClose: () => void;
}

const toolBtn = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-35 disabled:cursor-not-allowed";
const idle = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
const active = "border-[#14213d] bg-[#14213d] text-white";

export function ExamNotebook({ open, questionKey, questionLabel, onClose }: ExamNotebookProps) {
  const textMap = useRef(new Map<string, string>());
  const sketchMap = useRef(new Map<string, NotebookSketch>());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef<{ stroke: NotebookStroke; pointerId: number; key: string } | null>(null);
  const keyRef = useRef(questionKey);
  keyRef.current = questionKey;

  const [text, setText] = useState("");
  const [color, setColor] = useState(NOTEBOOK_COLORS[0].value);
  const [size, setSize] = useState(NOTEBOOK_SIZES[1].value);
  const [erasing, setErasing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [, setVersion] = useState(0);
  const bump = () => setVersion(v => v + 1);

  const getSketch = (k: string) => sketchMap.current.get(k) ?? emptySketch();

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.max(1, Math.round(rect.width * dpr));
    const ph = Math.max(1, Math.round(rect.height * dpr));
    if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const st of getSketch(keyRef.current).strokes) drawStroke(ctx, st, rect.width, rect.height);
    if (live.current && live.current.key === keyRef.current) drawStroke(ctx, live.current.stroke, rect.width, rect.height);
  }, []);

  const finishStroke = useCallback(() => {
    const l = live.current;
    if (!l) return;
    live.current = null;
    const c = canvasRef.current;
    if (c?.hasPointerCapture?.(l.pointerId)) { try { c.releasePointerCapture(l.pointerId); } catch { /* noop */ } }
    if (l.stroke.points.length) {
      sketchMap.current.set(l.key, commitStroke(getSketch(l.key), l.stroke));
      bump();
    }
  }, []);

  // question switch: finish pending stroke on old key, load text
  useEffect(() => {
    setText(textMap.current.get(questionKey) ?? "");
    setConfirmClear(false);
    return () => finishStroke();
  }, [questionKey, finishStroke]);

  useEffect(() => {
    if (!open) return;
    redraw();
    const c = canvasRef.current;
    if (!c || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(c);
    const mq = window.matchMedia?.(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq?.addEventListener?.("change", redraw);
    return () => { ro.disconnect(); mq?.removeEventListener?.("change", redraw); finishStroke(); };
  }, [open, questionKey, redraw, finishStroke]);

  useEffect(() => () => finishStroke(), [finishStroke]);

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Ignore a second finger/palm while the active pointer is writing.
    if (live.current) return;
    const c = e.currentTarget;
    c.setPointerCapture(e.pointerId);
    e.preventDefault();
    live.current = {
      pointerId: e.pointerId, key: keyRef.current,
      stroke: { color, size, erase: erasing, points: [normalizePoint(e.clientX, e.clientY, c.getBoundingClientRect())] },
    };
    const rect = c.getBoundingClientRect();
    const ctx = c.getContext("2d");
    if (ctx) drawStroke(ctx, live.current.stroke, rect.width, rect.height);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const l = live.current;
    if (!l || l.pointerId !== e.pointerId) return;
    const c = e.currentTarget;
    const rect = c.getBoundingClientRect();
    const from = l.stroke.points.length;
    const events = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [];
    const list = events.length ? events : [e.nativeEvent];
    for (const ev of list) l.stroke.points.push(normalizePoint(ev.clientX, ev.clientY, rect));
    const ctx = c.getContext("2d");
    if (ctx) drawStroke(ctx, l.stroke, rect.width, rect.height, from);
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (live.current?.pointerId === e.pointerId) finishStroke();
  };

  const mutate = (fn: (s: NotebookSketch) => NotebookSketch) => {
    finishStroke();
    sketchMap.current.set(questionKey, fn(getSketch(questionKey)));
    bump();
    redraw();
  };

  const handleClose = () => { finishStroke(); setConfirmClear(false); onClose(); };

  if (!open) return null;
  const sketch = getSketch(questionKey);
  const hasContent = sketch.strokes.length > 0 || text.length > 0;

  return (
    <aside
      data-exam-notebook=""
      data-testid="exam-notebook-panel"
      id="exam-notebook-panel"
      dir="rtl"
      aria-label={`مسودة ${questionLabel}`}
      className="w-80 shrink-0 self-stretch overflow-y-auto border-r border-slate-200 bg-[#f7f5ef] text-[#14213d]"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-slate-200 bg-[#f7f5ef] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-wide text-[#c2410c]">مسودة مؤقتة</p>
          <h2 className="truncate text-base font-extrabold" data-testid="text-notebook-question">{questionLabel}</h2>
        </div>
        <button type="button" onClick={handleClose} aria-label="إغلاق المسودة" data-testid="button-notebook-close" className={`${toolBtn} ${idle}`}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="space-y-4 p-4">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900" data-testid="text-notebook-disclaimer">
          ملاحظاتك هنا مؤقتة لهذا القسم فقط، لا تُرسل ولا تُصحَّح ولا تُحفظ بعد انتهائه.
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">ملاحظات مكتوبة</span>
          <textarea
            data-testid="exam-notebook-text"
            dir="rtl"
            value={textMap.current.get(questionKey) ?? ""}
            onChange={e => { setText(e.target.value); textMap.current.set(questionKey, e.target.value); }}
            rows={4}
            placeholder="اكتب خطوات الحل أو أفكارك..."
            className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-right text-sm leading-7 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </label>

        <section aria-label="أدوات الرسم" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">لوحة الرسم</span>
            <div className="flex gap-1.5">
              <button type="button" aria-pressed={!erasing} aria-label="قلم" data-testid="button-notebook-pen" onClick={() => setErasing(false)} className={`${toolBtn} ${!erasing ? active : idle}`}>
                <PenLine className="h-5 w-5" aria-hidden="true" />
              </button>
              <button type="button" aria-pressed={erasing} aria-label="ممحاة" data-testid="button-notebook-eraser" onClick={() => setErasing(true)} className={`${toolBtn} ${erasing ? active : idle}`}>
                <Eraser className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="لون القلم">
            {NOTEBOOK_COLORS.map(c => (
              <button key={c.value} type="button" aria-pressed={!erasing && color === c.value} aria-label={`لون ${c.label}`} data-testid={`button-notebook-color-${c.value.slice(1)}`}
                onClick={() => { setColor(c.value); setErasing(false); }}
                className={`${toolBtn} ${!erasing && color === c.value ? "border-[#14213d] ring-2 ring-[#14213d]/25" : "border-slate-200"} bg-white`}>
                <span className="h-5 w-5 rounded-full" style={{ background: c.value }} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="flex gap-1.5" role="group" aria-label="سماكة الخط">
            {NOTEBOOK_SIZES.map(s => (
              <button key={s.value} type="button" aria-pressed={size === s.value} aria-label={`سماكة ${s.label}`} data-testid={`button-notebook-size-${s.value}`}
                onClick={() => setSize(s.value)} className={`${toolBtn} flex-1 gap-2 ${size === s.value ? active : idle}`}>
                <span className="rounded-full bg-current" style={{ width: s.value + 2, height: s.value + 2 }} aria-hidden="true" />
                <span className="text-xs">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        <canvas
          ref={canvasRef}
          data-testid="exam-notebook-canvas"
          role="img"
          aria-label={`لوحة رسم حرة لـ ${questionLabel}، ارسم بالفأرة أو اللمس أو القلم`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onLostPointerCapture={onUp}
          className={`block h-80 w-full rounded-xl border-2 border-border bg-white dark:bg-white shadow-inner ${erasing ? "cursor-cell" : "cursor-crosshair"}`}
          style={{
            touchAction: "none",
            backgroundImage: "linear-gradient(#e7ecf3 1px, transparent 1px), linear-gradient(90deg, #e7ecf3 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="flex gap-1.5">
          <button type="button" aria-label="تراجع" data-testid="button-notebook-undo" disabled={!sketch.undo.length} onClick={() => mutate(undoSketch)} className={`${toolBtn} ${idle} flex-1 gap-1.5`}>
            <Undo2 className="h-4 w-4" aria-hidden="true" />تراجع
          </button>
          <button type="button" aria-label="إعادة" data-testid="button-notebook-redo" disabled={!sketch.redo.length} onClick={() => mutate(redoSketch)} className={`${toolBtn} ${idle} flex-1 gap-1.5`}>
            <Redo2 className="h-4 w-4" aria-hidden="true" />إعادة
          </button>
        </div>

        {confirmClear ? (
          <div role="alertdialog" aria-label="تأكيد المسح" className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-bold text-rose-900">مسح الكتابة والرسم لهذا السؤال؟</p>
            <div className="flex gap-1.5">
              <button type="button" data-testid="button-notebook-clear-confirm" onClick={() => {
                mutate(clearSketch); setText(""); textMap.current.delete(questionKey); setConfirmClear(false);
              }} className={`${toolBtn} flex-1 border-rose-700 bg-rose-700 text-white hover:bg-rose-800`}>نعم، امسح</button>
              <button type="button" data-testid="button-notebook-clear-cancel" onClick={() => setConfirmClear(false)} className={`${toolBtn} ${idle} flex-1`}>إلغاء</button>
            </div>
          </div>
        ) : (
          <button type="button" data-testid="button-notebook-clear" disabled={!hasContent} onClick={() => setConfirmClear(true)} className={`${toolBtn} w-full gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />مسح مسودة هذا السؤال
          </button>
        )}
      </div>
    </aside>
  );
}
