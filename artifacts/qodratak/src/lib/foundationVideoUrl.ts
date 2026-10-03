const EXTERNAL_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;
const QUANTITATIVE_ASSET_PREFIX = "foundation/quantitative/";

declare global {
  interface Window {
    __FOUNDATION_ASSET_BASE_URL__?: string;
  }
}

export function isDirectFoundationVideo(rawUrl: string): boolean {
  const pathname = rawUrl.trim().split(/[?#]/, 1)[0].toLowerCase();
  return /\.(mp4|m4v|webm|ogv|ogg)$/.test(pathname);
}

export function resolveFoundationAssetUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value || EXTERNAL_URL.test(value)) return value;

  const relativePath = value.replace(/^\/+/, "");
  const externalAssetBase =
    window.__FOUNDATION_ASSET_BASE_URL__?.trim() ||
    import.meta.env.VITE_FOUNDATION_ASSET_BASE_URL?.trim();
  if (externalAssetBase && relativePath.startsWith(QUANTITATIVE_ASSET_PREFIX)) {
    let baseUrl: URL;
    try {
      baseUrl = new URL(
        externalAssetBase.endsWith("/") ? externalAssetBase : `${externalAssetBase}/`,
      );
    } catch {
      throw new Error("Foundation asset base URL must be an absolute HTTP or HTTPS URL.");
    }
    if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
      throw new Error("Foundation asset base URL must use HTTP or HTTPS.");
    }
    return new URL(relativePath, baseUrl).toString();
  }

  const configuredBase = import.meta.env.BASE_URL || "/";
  const basePath = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
  const baseUrl = new URL(basePath, window.location.origin);
  return new URL(relativePath, baseUrl).toString();
}

export const resolveFoundationVideoUrl = resolveFoundationAssetUrl;

export function foundationVideoUrlAt(rawUrl: string, seconds: number): string {
  const url = new URL(resolveFoundationAssetUrl(rawUrl), window.location.origin);
  url.hash = `t=${Math.max(0, Math.floor(seconds))}`;
  return url.toString();
}