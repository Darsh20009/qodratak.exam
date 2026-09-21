const EMBED_OPTIONS = "controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3";

function youtubeEmbed(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${EMBED_OPTIONS}`;
}

function getYouTubeId(url: URL) {
  if (url.hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] || null;
  }

  if (!url.hostname.endsWith("youtube.com") && !url.hostname.endsWith("youtube-nocookie.com")) {
    return null;
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  if (pathParts[0] === "embed" || pathParts[0] === "shorts" || pathParts[0] === "live") {
    return pathParts[1] || null;
  }

  return url.searchParams.get("v");
}

/**
 * Returns an in-platform embed URL and never sends a student to the provider page.
 * Provider branding is controlled by the provider and cannot be removed completely.
 */
export function getVideoEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;

    const youtubeId = getYouTubeId(url);
    if (youtubeId) return youtubeEmbed(youtubeId);

    if (url.hostname === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&badge=0&dnt=1`
        : null;
    }

    if (url.hostname === "player.vimeo.com" && url.pathname.startsWith("/video/")) {
      const separator = url.search ? "&" : "?";
      return `${url.toString()}${separator}title=0&byline=0&portrait=0&badge=0&dnt=1`;
    }

    return url.toString();
  } catch {
    return null;
  }
}