import path from "node:path";
import { fileURLToPath } from "node:url";

const artifactRoot = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(artifactRoot, "../.."));
await import("./dist/index.mjs");