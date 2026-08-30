import path from "node:path";
import { fileURLToPath } from "node:url";

const artifactRoot = path.dirname(fileURLToPath(import.meta.url));
process.chdir(artifactRoot);
await import("./dist/index.mjs");