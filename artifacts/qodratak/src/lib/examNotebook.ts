export type NotebookPoint = { x: number; y: number };
export type NotebookStroke = { color: string; size: number; erase: boolean; points: NotebookPoint[] };
export type NotebookSketch = { strokes: NotebookStroke[]; redo: NotebookStroke[][]; undo: NotebookStroke[][] };
const MAX_UNDO_STEPS = 64;

export const NOTEBOOK_COLORS = [
  { value: "#14213d", label: "كحلي" },
  { value: "#c2410c", label: "برتقالي" },
  { value: "#0f766e", label: "أخضر مزرق" },
  { value: "#be123c", label: "أحمر" },
];
export const NOTEBOOK_SIZES = [
  { value: 2, label: "رفيع" },
  { value: 4, label: "متوسط" },
  { value: 8, label: "عريض" },
];

export function emptySketch(): NotebookSketch {
  return { strokes: [], undo: [], redo: [] };
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Convert client coords to normalized [0..1] coords relative to rect. */
export function normalizePoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): NotebookPoint {
  return {
    x: rect.width > 0 ? clamp01((clientX - rect.left) / rect.width) : 0,
    y: rect.height > 0 ? clamp01((clientY - rect.top) / rect.height) : 0,
  };
}

/** Stroke width scales with canvas width (reference 320 css px) so sketches keep proportion. */
export function strokeWidth(size: number, cssWidth: number, erase: boolean): number {
  const w = size * Math.max(0.5, cssWidth / 320);
  return erase ? w * 4 : w;
}

/** Commit a finished stroke; snapshots prior strokes for undo, clears redo. */
export function commitStroke(s: NotebookSketch, stroke: NotebookStroke): NotebookSketch {
  if (stroke.points.length === 0) return s;
  return { strokes: [...s.strokes, stroke], undo: [...s.undo, s.strokes].slice(-MAX_UNDO_STEPS), redo: [] };
}

export function clearSketch(s: NotebookSketch): NotebookSketch {
  if (s.strokes.length === 0) return s;
  return { strokes: [], undo: [...s.undo, s.strokes].slice(-MAX_UNDO_STEPS), redo: [] };
}

export function undoSketch(s: NotebookSketch): NotebookSketch {
  if (s.undo.length === 0) return s;
  return { strokes: s.undo[s.undo.length - 1], undo: s.undo.slice(0, -1), redo: [...s.redo, s.strokes] };
}

export function redoSketch(s: NotebookSketch): NotebookSketch {
  if (s.redo.length === 0) return s;
  return { strokes: s.redo[s.redo.length - 1], redo: s.redo.slice(0, -1), undo: [...s.undo, s.strokes].slice(-MAX_UNDO_STEPS) };
}

/** Draw one stroke onto a context already scaled to CSS pixels. */
export function drawStroke(ctx: CanvasRenderingContext2D, st: NotebookStroke, w: number, h: number, from = 0) {
  const pts = st.points;
  if (pts.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = st.erase ? "destination-out" : "source-over";
  ctx.strokeStyle = st.color;
  ctx.fillStyle = st.color;
  ctx.lineWidth = strokeWidth(st.size, w, st.erase);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x * w, pts[0].y * h, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const start = Math.max(0, from - 1);
    ctx.beginPath();
    ctx.moveTo(pts[start].x * w, pts[start].y * h);
    for (let i = start + 1; i < pts.length; i++) ctx.lineTo(pts[i].x * w, pts[i].y * h);
    ctx.stroke();
  }
  ctx.restore();
}

/*
 Pure helper test cases:
 - normalizePoint(150,120,{left:100,top:100,width:200,height:40}) -> {x:0.25,y:0.5}; out of bounds clamps to 0/1; zero-size rect -> 0.
 - commitStroke with empty points returns same sketch; otherwise appends, pushes previous strokes to undo, clears redo.
 - commit(eraser stroke) then undoSketch restores strokes without eraser; redoSketch reapplies it.
 - clearSketch on empty returns same object; on non-empty is undoable back to original strokes.
 - undo/redo on empty stacks are no-ops (identity).
 - strokeWidth(4,320,false)=4; (4,640,false)=8; eraser multiplies by 4; tiny canvases floor at 0.5x.
*/
