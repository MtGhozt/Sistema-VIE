import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { demoRouter } from "./routes/demoAuth.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "Sistema VIE API",
      docs: "Ver PLAN-MAESTRO.md y CONTINUIDAD.md en la raíz del repo",
      health: "/api/health",
    });
  });

  app.use("/api", healthRouter);
  app.use("/api", demoRouter);

  return app;
}
