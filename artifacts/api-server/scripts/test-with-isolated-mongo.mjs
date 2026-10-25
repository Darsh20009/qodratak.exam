import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const block = (reason) => {
  console.error(`[Mongo test preflight] BLOCKED: ${reason}`);
  process.exit(2);
};

const testUri = process.env.MONGODB_TEST_URI;
const expectedProductionDb = process.env.MONGODB_PRODUCTION_DB_NAME?.trim();

if (!testUri) {
  block("MONGODB_TEST_URI is missing; integration tests were not started.");
}
if (!expectedProductionDb) {
  block("MONGODB_PRODUCTION_DB_NAME is missing; database separation cannot be checked.");
}
if (process.env.NODE_ENV === "production") {
  block("Tests cannot run in a production environment.");
}

let testDbName;
try {
  const parsed = new URL(testUri);
  if (parsed.protocol !== "mongodb:" && parsed.protocol !== "mongodb+srv:") {
    block("MONGODB_TEST_URI must use a MongoDB connection scheme.");
  }
  testDbName = decodeURIComponent(parsed.pathname.split("/").filter(Boolean)[0] || "");
} catch {
  block("MONGODB_TEST_URI is malformed.");
}

if (!testDbName || !/(^|[._-])test([._-]|$)/i.test(testDbName)) {
  block("The configured test database name must contain a distinct test marker.");
}
if (testDbName === expectedProductionDb) {
  block("The test database name matches the configured production database name.");
}

let connection;
try {
  // Connect only with the test-only secret. Never fall back to MONGODB_URI.
  connection = await mongoose
    .createConnection(testUri, { serverSelectionTimeoutMS: 5000 })
    .asPromise();

  if (connection.db?.databaseName !== testDbName) {
    block("The connected database does not match the configured test database.");
  }

  const status = await connection.db.admin().command({ connectionStatus: 1 });
  const roles = status?.authInfo?.authenticatedUserRoles;
  const isScopedTestUser =
    Array.isArray(roles) &&
    roles.length > 0 &&
    roles.every(
      (role) =>
        role?.db === testDbName &&
        (role?.role === "readWrite" || role?.role === "read"),
    ) &&
    roles.some((role) => role?.role === "readWrite");

  if (!isScopedTestUser) {
    block("The authenticated MongoDB user is not limited to read/readWrite on the test database.");
  }

  // A read-only metadata query confirms the test database is reachable before tests start.
  await connection.db.listCollections({}, { nameOnly: true }).toArray();
  console.log("[Mongo test preflight] Isolated test database and scoped user verified.");
} catch {
  if (connection) await connection.close().catch(() => undefined);
  block("Could not verify the test database connection and privileges; no tests were started.");
}

await connection.close();

const testDirectory = path.resolve("test");
const testFiles = readdirSync(testDirectory)
  .filter((file) => file.endsWith(".test.ts"))
  .sort()
  .map((file) => path.join(testDirectory, file));

if (testFiles.length === 0) {
  block("No server test files were found.");
}

// Explicitly bind the test process to the verified test URI. This overwrites
// any inherited MONGODB_URI so the suite cannot silently use another database.
const testEnvironment = {
  ...process.env,
  NODE_ENV: "test",
  MONGODB_URI: testUri,
};
const result = spawnSync(
  "pnpm",
  ["--filter", "@workspace/scripts", "exec", "tsx", "--test", ...testFiles],
  { cwd: process.cwd(), env: testEnvironment, stdio: "inherit" },
);

if (result.error) {
  console.error("[Mongo test preflight] Could not start the isolated test runner.");
  process.exit(1);
}
process.exit(result.status ?? 1);
