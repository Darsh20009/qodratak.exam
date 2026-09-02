import express, { type Express } from "express";
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

const app: Express = express();
const sessionSecret = process.env.SESSION_SECRET;
const mongoUrl = process.env.MONGODB_URI;
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
