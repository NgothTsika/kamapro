import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    app: "KamaGame",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`KamaGame API listening on port ${env.PORT}`);
});
