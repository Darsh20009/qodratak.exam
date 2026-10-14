/** Route metadata lives in static head nodes, never in React-owned hoisted nodes. */
export function updateRouteHead(
  head: HTMLHeadElement, options: { canonical?: string; robots?: string },
) {
  if (options.canonical !== undefined) {
    let link = head.querySelector<HTMLLinkElement>("#qodratak-route-canonical");
    if (!link) {
      link = head.ownerDocument.createElement("link");
      link.id = "qodratak-route-canonical";
      head.appendChild(link);
    }
    link.rel = "canonical";
    link.href = options.canonical;
  }
  if (options.robots !== undefined) {
    let meta = head.querySelector<HTMLMetaElement>("#qodratak-route-robots");
    if (!meta) {
      meta = head.ownerDocument.createElement("meta");
      meta.id = "qodratak-route-robots";
      head.appendChild(meta);
    }
    meta.name = "robots";
    meta.content = options.robots;
  }
}
