import type { LearningContentAnnotation } from "@/hooks/use-student";

export type TextAnchor = { start: number; end: number };

function textNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    if (node.textContent) nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function globalOffset(root: HTMLElement, container: Node, offset: number): number {
  const range = document.createRange();
  range.setStart(root, 0);
  range.setEnd(container, offset);
  return range.toString().length;
}

function locateOffset(root: HTMLElement, target: number): [Text, number] | null {
  let total = 0;
  for (const node of textNodes(root)) {
    const length = node.textContent?.length || 0;
    if (target <= total + length) return [node, Math.max(0, target - total)];
    total += length;
  }
  const last = textNodes(root).at(-1);
  return last ? [last, last.textContent?.length || 0] : null;
}

export function getCurrentTextSelection(root: HTMLElement | null): { selectedText: string; anchor: TextAnchor } | null {
  if (!root || typeof window === "undefined") return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  const selectedText = selection.toString().trim();
  if (!selectedText) return null;
  const start = globalOffset(root, range.startContainer, range.startOffset);
  const end = globalOffset(root, range.endContainer, range.endOffset);
  return { selectedText, anchor: { start: Math.min(start, end), end: Math.max(start, end) } };
}

export function rangeFromTextAnchor(root: HTMLElement, anchor: TextAnchor): Range | null {
  const start = locateOffset(root, anchor.start);
  const end = locateOffset(root, anchor.end);
  if (!start || !end) return null;
  const range = document.createRange();
  range.setStart(start[0], start[1]);
  range.setEnd(end[0], end[1]);
  return range;
}

export function getAnnotationRects(root: HTMLElement | null, annotation: LearningContentAnnotation): Array<{ left: number; top: number; width: number; height: number }> {
  if (!root || (annotation.type !== "HIGHLIGHT" && annotation.type !== "UNDERLINE")) return [];
  const anchor = annotation.data.anchor;
  if (!anchor) return [];
  const range = rangeFromTextAnchor(root, anchor);
  if (!range) return [];
  const rootRect = root.getBoundingClientRect();
  return Array.from(range.getClientRects()).map((rect) => ({
    left: rect.left - rootRect.left,
    top: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height,
  })).filter((rect) => rect.width > 0 && rect.height > 0);
}