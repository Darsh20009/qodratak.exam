import { Router } from "express";
import { Readable } from "node:stream";
import { fetchR2VerbalObject, VerbalBookFileStorageError } from "../services/qudratVerbalBookFilesService";

// Preserve the existing public foundation-video URLs without shipping MP4s in Git.
// Only this curriculum namespace is exposed; R2 credentials never leave the server.
export function createFoundationAssetsRouter(fetchAsset = fetchR2VerbalObject) {
  const router = Router();
  router.use(async (request, response, next) => {
    if (!["GET", "HEAD"].includes(request.method) || !/\.mp4$/i.test(request.path)) {
      next();
      return;
    }
    let relativePath: string;
    try {
      relativePath = decodeURIComponent(request.path).replace(/^\/+/, "");
    } catch {
      response.status(400).json({ message: "Invalid lesson media path." });
      return;
    }
    if (!/^(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.mp4$/i.test(relativePath)) {
      response.status(400).json({ message: "Invalid lesson media path." });
      return;
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    response.once("close", abort);
    const timeout = setTimeout(abort, 20_000);
    try {
      const upstream = await fetchAsset(`foundation/quantitative/${relativePath}`, {
        method: request.method as "GET" | "HEAD",
        range: request.header("range"),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (![200, 206, 416].includes(upstream.status)) {
        await upstream.body?.cancel();
        response.status(upstream.status === 404 ? 404 : 502)
          .json({ message: "Lesson media is temporarily unavailable." });
        return;
      }
      response.status(upstream.status);
      for (const header of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
        const value = upstream.headers.get(header);
        if (value) response.setHeader(header, value);
      }
      if (upstream.ok) response.setHeader("Cache-Control", "public, max-age=300");
      if (request.method === "HEAD" || !upstream.body) {
        await upstream.body?.cancel();
        response.end();
        return;
      }
      const stream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
      stream.once("error", () => response.destroy());
      response.once("close", () => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      if (!response.destroyed && !response.headersSent) {
        response.status(error instanceof VerbalBookFileStorageError ? error.statusCode : 502)
          .json({ message: "Lesson media storage is unavailable." });
      }
    } finally {
      clearTimeout(timeout);
    }
  });
  return router;
}
