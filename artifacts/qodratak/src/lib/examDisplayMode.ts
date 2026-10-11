export const EXAM_FOCUS_EVENT = "qodratak:exam-focus";

/** The page-only mode also works when an embedded browser denies native fullscreen. */
export function isExamFocusMode() {
  return typeof document !== "undefined" &&
    (Boolean(document.fullscreenElement) || document.documentElement.dataset.examFocusMode === "true");
}

export function setExamPageFocus(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) document.documentElement.dataset.examFocusMode = "true";
  else delete document.documentElement.dataset.examFocusMode;
  document.dispatchEvent(new Event(EXAM_FOCUS_EVENT));
}

export async function enterExamFocus(): Promise<"native" | "page"> {
  setExamPageFocus(true);
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    if (document.fullscreenElement) {
      setExamPageFocus(false);
      return "native";
    }
  } catch {
    // The caller explicitly tells the student that page-only focus is active.
  }
  return "page";
}

export async function exitExamFocus() {
  setExamPageFocus(false);
  if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
}
