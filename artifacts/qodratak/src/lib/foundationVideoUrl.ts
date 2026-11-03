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

export function getFoundationQuestionThumbnailUrl(rawUrl: string): string | undefined {
  const value = rawUrl.trim();
  if (!value) return undefined;

  const thumbnailPath = (sourcePath: string) => {
    const relativePath = sourcePath.replace(/^\/+/, "");
    const apiPrefix = relativePath.startsWith("api/foundation/quantitative/") ? "api/" : "";
    const assetPath = relativePath.slice(apiPrefix.length);
    const prefix = "foundation/quantitative/";
    if (!assetPath.startsWith(prefix)) return undefined;

    const questionPath = assetPath.slice(prefix.length);
    const match = questionPath.match(
      /^(computer-banks\/exam-\d{2,3}\/(?:background-removed\/)?)(question-\d{3})\.(?:jpe?g|png|webp)$/i,
    );
    if (!match) return undefined;
    return `${apiPrefix}${prefix}${match[1]}optimized/${match[2]}.webp`;
  };

  if (EXTERNAL_URL.test(value)) {
    try {
      const url = new URL(value);
      const pathMatch = url.pathname.match(/^(.*?)(\/(?:api\/)?foundation\/quantitative\/)(.*)$/i);
      if (!pathMatch) return undefined;
      const generated = thumbnailPath(pathMatch[2] + pathMatch[3]);
      if (!generated) return undefined;
      return `${url.origin}${pathMatch[1]}/${generated}`;
    } catch {
      return undefined;
    }
  }

  const generated = thumbnailPath(value);
  if (!generated) return undefined;
  const leadingSlash = value.startsWith("/") ? "/" : "";
  return `${leadingSlash}${generated}`;
}

export function resolveFoundationAssetUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value || EXTERNAL_URL.test(value)) return value;
  if (value.startsWith("/api/")) {
    return new URL(value, window.location.origin).toString();
  }

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

  if (relativePath.startsWith(QUANTITATIVE_ASSET_PREFIX)) {
    return new URL(`/api/${relativePath}`, window.location.origin).toString();
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