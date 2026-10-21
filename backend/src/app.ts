import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { demoRouter } from "./routes/demoAuth.js";
import { convocatoriasRouter } from "./routes/convocatorias.js";
import { propuestasRouter } from "./routes/propuestas.js";
import { historicoRouter } from "./routes/historico.js";
import { attachDemoAuth } from "./middleware/demoAuth.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(attachDemoAuth);

  app.get("/", (_req, res) => {
    res.json({
      name: "Sistema VIE API",
      docs: "Ver PLAN-MAESTRO.md y CONTINUIDAD.md en la raíz del repo",
      health: "/api/health",
    });
  });

  app.use("/api", healthRouter);
  app.use("/api", demoRouter);
  app.use("/api", convocatoriasRouter);
  app.use("/api", propuestasRouter);
  app.use("/api", historicoRouter);

  return app;
}
