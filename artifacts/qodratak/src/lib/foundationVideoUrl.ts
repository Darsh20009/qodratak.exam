const EXTERNAL_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function isDirectFoundationVideo(rawUrl: string): boolean {
  const pathname = rawUrl.trim().split(/[?#]/, 1)[0].toLowerCase();
  return /\.(mp4|m4v|webm|ogv|ogg)$/.test(pathname);
}

export function resolveFoundationAssetUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value || EXTERNAL_URL.test(value)) return value;

  const configuredBase = import.meta.env.BASE_URL || "/";
  const basePath = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
  const baseUrl = new URL(basePath, window.location.origin);
  return new URL(value.replace(/^\/+/, ""), baseUrl).toString();
}

export const resolveFoundationVideoUrl = resolveFoundationAssetUrl;

export function foundationVideoUrlAt(rawUrl: string, seconds: number): string {
  const url = new URL(resolveFoundationAssetUrl(rawUrl), window.location.origin);
  url.hash = `t=${Math.max(0, Math.floor(seconds))}`;
  return url.toString();
}