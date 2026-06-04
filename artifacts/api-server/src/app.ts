import express, { type Express, type Request, type Response, type NextFunction } from "express";
  import cors from "cors";
  import pinoHttp from "pino-http";
  import router from "./routes";
  import { logger } from "./lib/logger";
  import path from "path";
  import { fileURLToPath } from "url";
  import { existsSync } from "fs";

  const app: Express = express();

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
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", router);

  // Serve built frontend (single-service deployment)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.resolve(__dirname, "../../solosplus/dist");
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/.*$/, (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  // Global JSON error handler — must be LAST, after all routes
  // Prevents Express from returning HTML error pages on unhandled errors
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const msg = err?.message ?? "Internal server error";
    logger.error({ err: msg }, "Unhandled route error");
    if (!res.headersSent) {
      res.status(500).json({ error: msg });
    }
  });

  export default app;
  