import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  LearningContentAnnotation,
  LearningContentAnnotationData,
} from "@/hooks/use-student";
import { cn } from "@/lib/utils";
import { appendFoundationPoint, canStartFoundationStroke, foundationStrokePayload } from "@/lib/foundationDrawing";

export type FoundationAnnotationTool = "READ" | "PEN" | "HIGHLIGHT" | "UNDERLINE" | "NOTE" | "ERASE";

type Point = { x: number; y: number; pressure?: number };

type FoundationAnnotationSurfaceProps = {
  sectionId: string;
  annotations: LearningContentAnnotation[];
  activeTool: FoundationAnnotationTool;
  onSurfaceRef: (node: HTMLDivElement | null) => void;
  onDrawingComplete: (data: LearningContentAnnotationData) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  children: React.ReactNode;
  className?: string;
};

function isDrawingPointer(event: React.PointerEvent, activeTool: FoundationAnnotationTool): boolean {
  return canStartFoundationStroke(activeTool, event);
}

function pointsToPath(points: Point[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function DrawingOverlay({
  root,
  annotations,
  activeTool,
  onDeleteAnnotation,
}: {
  root: HTMLDivElement | null;
  annotations: LearningContentAnnotation[];
  activeTool: FoundationAnnotationTool;
  onDeleteAnnotation: (annotationId: string) => void;
}) {
  const [layoutVersion, setLayoutVersion] = useState(0);
  const drawingAnnotations = useMemo(() => annotations.filter((annotation) => annotation.type === "DRAWING" && annotation.data.points?.length), [annotations]);
  const textAnnotations = useMemo(() => annotations.filter((annotation) => annotation.type === "HIGHLIGHT" || annotation.type === "UNDERLINE"), [annotations]);

  useEffect(() => {
    if (!root) return;
    const resizeObserver = new ResizeObserver(() => setLayoutVersion((value) => value + 1));
    const handleResize = () => setLayoutVersion((value) => value + 1);
    resizeObserver.observe(root);
    window.addEventListener("resize", handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [root]);

  const textRects = useMemo(() => {
    if (!root) return [];
    // Dynamic import would delay restoration; the helper is kept local to the
    // annotation surface so this layer can stay independent from the reader.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let node = walker.nextNode();
    while (node) {
      if (node.textContent) nodes.push(node as Text);
      node = walker.nextNode();
    }
    const locate = (target: number): [Text, number] | null => {
      let total = 0;
      for (const textNode of nodes) {
        const length = textNode.textContent?.length || 0;
        if (target <= total + length) return [textNode, Math.max(0, target - total)];
        total += length;
      }
      const last = nodes.at(-1);
      return last ? [last, last.textContent?.length || 0] : null;
    };
    const rootRect = root.getBoundingClientRect();
    return textAnnotations.flatMap((annotation) => {
      const anchor = annotation.data.anchor;
      if (!anchor) return [];
      const start = locate(anchor.start);
      const end = locate(anchor.end);
      if (!start || !end) return [];
      const range = document.createRange();
      range.setStart(start[0], start[1]);
      range.setEnd(end[0], end[1]);
      return Array.from(range.getClientRects()).map((rect) => ({
        annotation,
        left: rect.left - rootRect.left,
        top: rect.top - rootRect.top,
        width: rect.width,
        height: rect.height,
      }));
    });
  }, [layoutVersion, root, textAnnotations]);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        {textRects.map((rect, index) => (
          <span
            key={`${rect.annotation.id}-${index}`}
            className={cn(
              "absolute rounded-sm",
              rect.annotation.type === "HIGHLIGHT" ? "bg-[#f3c969]/45" : "border-b-[3px] border-[#e07a5f]",
              activeTool === "ERASE" && "pointer-events-auto cursor-pointer hover:bg-[#e07a5f]/20",
            )}
            style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
            role={activeTool === "ERASE" ? "button" : undefined}
            tabIndex={activeTool === "ERASE" ? 0 : undefined}
            aria-label={activeTool === "ERASE" ? "حذف annotation" : undefined}
            onPointerDown={activeTool === "ERASE" ? (event) => { event.stopPropagation(); onDeleteAnnotation(rect.annotation.id); } : undefined}
          />
        ))}
      </div>
      <svg className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
        {drawingAnnotations.map((annotation) => (
          <path
            key={annotation.id}
            d={pointsToPath(annotation.data.points as Point[])}
            fill="none"
            stroke={annotation.data.color || "#e07a5f"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={annotation.data.lineWidth || 3}
            vectorEffect="non-scaling-stroke"
            className={activeTool === "ERASE" ? "pointer-events-auto cursor-pointer opacity-80" : "pointer-events-none"}
            onPointerDown={activeTool === "ERASE" ? (event) => { event.stopPropagation(); onDeleteAnnotation(annotation.id); } : undefined}
          />
        ))}
      </svg>
    </>
  );
}

export function FoundationAnnotationSurface({
  sectionId,
  annotations,
  activeTool,
  onSurfaceRef,
  onDrawingComplete,
  onDeleteAnnotation,
  children,
  className,
}: FoundationAnnotationSurfaceProps) {
  const [drawing, setDrawing] = useState<Point[] | null>(null);
  const [root, setRootState] = useState<HTMLDivElement | null>(null);
  const pointerId = useRef<number | null>(null);
  const livePoints = useRef<Point[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRootState(rootRef.current);
    onSurfaceRef(rootRef.current);
  }, [onSurfaceRef]);

  const pointFromEvent = (event: React.PointerEvent): Point | null => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      ...(event.pressure > 0 ? { pressure: Math.max(0, Math.min(1, event.pressure)) } : {}),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== null || !isDrawingPointer(event, activeTool)) return;
    if ((event.target as Element).closest("button,a,input,textarea,select,[contenteditable=true]")) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.preventDefault();
    pointerId.current = event.pointerId;
    livePoints.current = [point];
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawing([point]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    const point = pointFromEvent(event);
    if (point) {
      appendFoundationPoint(livePoints.current, point);
      setDrawing([...livePoints.current]);
    }
  };

  const finishDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    if (event.type === "pointerup") {
      const endpoint = pointFromEvent(event);
      if (endpoint) appendFoundationPoint(livePoints.current, endpoint);
    }
    const points = foundationStrokePayload(livePoints.current);
    pointerId.current = null;
    livePoints.current = [];
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDrawing(null);
    if (points.length >= 2) {
      onDrawingComplete({
        points,
        color: "#e07a5f",
        lineWidth: 3,
      });
    }
  };

  return (
    <div
      ref={rootRef}
      data-annotation-section={sectionId}
      className={cn("relative", activeTool === "PEN" && "select-none", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrawing}
      onPointerCancel={finishDrawing}
      onLostPointerCapture={finishDrawing}
      style={{ touchAction: activeTool === "PEN" ? "none" : undefined, cursor: activeTool === "PEN" ? "crosshair" : undefined }}
    >
      {children}
      <DrawingOverlay root={root} annotations={annotations} activeTool={activeTool} onDeleteAnnotation={onDeleteAnnotation} />
      {drawing?.length ? (
        <svg className="pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-visible" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          <path d={pointsToPath(drawing)} fill="none" stroke="#e07a5f" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} vectorEffect="non-scaling-stroke" />
        </svg>
      ) : null}
    </div>
  );
}