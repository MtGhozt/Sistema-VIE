import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { demoRouter } from "./routes/demoAuth.js";
import { convocatoriasRouter } from "./routes/convocatorias.js";
import { propuestasRouter } from "./routes/propuestas.js";
import { historicoRouter } from "./routes/historico.js";
import { evaluacionesRouter } from "./routes/evaluaciones.js";
import { notificacionesRouter } from "./routes/notificaciones.js";
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
  app.use("/api", evaluacionesRouter);
  app.use("/api", notificacionesRouter);

  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) { next(error); return; }
    const code = error && typeof error === "object" ? error.code : undefined;
    console.error("[api]", error instanceof Error ? error.message : "Error inesperado");
    if (code === "23505") {
      res.status(409).json({ error: "El registro entra en conflicto con un dato existente. No se completó la operación." });
      return;
    }
    res.status(500).json({ error: "No se pudo completar la operación" });
  };
  app.use(handleError);
  return app;
}
