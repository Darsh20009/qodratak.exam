import type { GuideChapter } from "./guideChapters";

export type GuideAudience = "student" | "admin" | "institution" | "teacher";
export type GuideFilmOptions = {
  film?: "guide" | "marketing" | "marketing-welcome" | "admin" | "institution" | "teacher";
  chapter?: GuideChapter;
  muted?: boolean;
};

export function guideFilmSrc({ film = "guide", chapter, muted }: GuideFilmOptions = {}) {
  const params = new URLSearchParams();
  if (film !== "guide") params.set("film", film);
  else if (chapter) params.set("chapter", chapter);
  if (muted) params.set("muted", "1");
  return `/qodratak-guide/${params.size ? `?${params}` : ""}`;
}

export function normalizeGuideDisplayName(value: unknown): string {
  if (typeof value !== "string") return "";
  return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ").trim()).slice(0, 64).join("");
}

export function isGuideReadyMessage(
  origin: string, expectedOrigin: string, source: unknown, frameWindow: unknown, data: unknown,
) {
  return Boolean(frameWindow && source === frameWindow && origin === expectedOrigin
    && data && typeof data === "object" && "type" in data && data.type === "qodratak.guide.ready");
}

/** Existing student preference keys remain compatible; other roles are isolated. */
export function roleGuideHiddenKey(audience: GuideAudience, uid: string) {
  return audience === "student" ? `qodratak.dashboard.guideFilm.hidden.v1.${uid}`
    : `qodratak.role.guideFilm.hidden.v1.${audience}.${uid}`;
}
