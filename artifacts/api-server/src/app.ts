import express, { type Express } from "express";
import { createFoundationAssetsRouter } from "./routes/foundationAssets";
import cors from "cors";
import MongoStore from "connect-mongo";
import session from "express-session";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import adminRouter from "./adminRoutes";
import multiplayerRouter from "./multiplayerRoutes";
import notificationRouter from "./notificationRoutes";
import { logger } from "./lib/logger";
import { enforceSessionIp } from "./middleware/sessionIp";
import { enforceStudentTrialAccess } from "./middleware/studentTrialAccess";
import { notifyTechnicalFailure } from "./services/technicalErrorAlerts";

const app: Express = express();
const sessionSecret = process.env.SESSION_SECRET;
const mongoUrl = process.env.MONGODB_URI;
if (process.env.NODE_ENV === "production" && !mongoUrl) {
  throw new Error("MONGODB_URI is required in production");
}
const isEmbeddedPreview = Boolean(
  process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS,
);
const requiresCrossSiteCookie =
  process.env.NODE_ENV === "production" || isEmbeddedPreview;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is required");
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
if (isEmbeddedPreview) {
  app.use((request, _response, next) => {
    request.headers["x-forwarded-proto"] = "https";
    next();
  });
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    ...(mongoUrl
      ? {
          store: MongoStore.create({
            mongoUrl,
            collectionName: "sessions",
            ttl: 30 * 24 * 60 * 60,
            autoRemove: "native",
          }),
        }
      : {}),
    name: requiresCrossSiteCookie
      ? "__Host-qodratak.sid"
      : "qodratak.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: requiresCrossSiteCookie,
      sameSite: requiresCrossSiteCookie ? "none" : "lax",
      partitioned: isEmbeddedPreview,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(enforceSessionIp);
app.use("/api", enforceStudentTrialAccess);
app.use("/api", (request, response, next) => {
  response.once("finish", () => {
    const requestPath = request.originalUrl.split("?")[0];
    if (
      response.statusCode >= 500 &&
      requestPath !== "/api/diagnostics/client-error"
    ) {
      void notifyTechnicalFailure({
        source: "api",
        method: request.method,
        path: requestPath,
        statusCode: response.statusCode,
        errorName: "HttpServerError",
        requestId: String((request as any).id || ""),
      });
    }
  });
  next();
});

app.use("/api/uploads", express.static("uploads"));
app.use("/api/admin", adminRouter);
app.use("/api", router);
app.use("/api/multiplayer", multiplayerRouter);
app.use("/api/notifications", notificationRouter);

if (process.env.NODE_ENV === "production") {
  const frontendDistPath = path.resolve(
    process.cwd(),
    "artifacts/qodratak/dist/public",
  );
  const configuredFoundationAssetBaseUrl =
    process.env.FOUNDATION_ASSET_BASE_URL?.trim() || "";
  if (configuredFoundationAssetBaseUrl) {
    let parsedFoundationAssetBaseUrl: URL;
    try {
      parsedFoundationAssetBaseUrl = new URL(configuredFoundationAssetBaseUrl);
    } catch {
      throw new Error(
        "FOUNDATION_ASSET_BASE_URL must be an absolute HTTP or HTTPS URL.",
      );
    }
    if (
      (parsedFoundationAssetBaseUrl.protocol !== "http:" &&
        parsedFoundationAssetBaseUrl.protocol !== "https:") ||
      parsedFoundationAssetBaseUrl.username ||
      parsedFoundationAssetBaseUrl.password ||
      parsedFoundationAssetBaseUrl.search ||
      parsedFoundationAssetBaseUrl.hash
    ) {
      throw new Error(
        "FOUNDATION_ASSET_BASE_URL must be a public HTTP or HTTPS URL without credentials, query, or hash.",
      );
    }
  }
  const serializedFoundationAssetBaseUrl = JSON.stringify(
    configuredFoundationAssetBaseUrl,
  ).replaceAll("<", "\\u003c");

  app.get("/runtime-config.js", (_request, response) => {
    response
      .type("application/javascript")
      .set("Cache-Control", "no-store")
      .send(
        `window.__FOUNDATION_ASSET_BASE_URL__=${serializedFoundationAssetBaseUrl};`,
      );
  });
  app.use("/foundation/quantitative", createFoundationAssetsRouter());
  app.use(express.static(frontendDistPath, { index: false }));
  app.use((request, response, next) => {
    if (
      request.method !== "GET" ||
      request.path === "/api" ||
      request.path.startsWith("/api/") ||
      request.path.startsWith("/ws/")
    ) {
      next();
      return;
    }

    response.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

export default app;
