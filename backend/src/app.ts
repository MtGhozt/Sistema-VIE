import { administracionRouter } from "./routes/administracion.js";
import { documentosRouter } from "./routes/documentos.js";
import { HttpError } from "./middleware/HttpError.js";
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
  app.use("/api", documentosRouter);
  app.use("/api", administracionRouter);
  app.use("/api", historicoRouter);
  app.use("/api", evaluacionesRouter);
  app.use("/api", notificacionesRouter);

  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) { next(error); return; }
    if (error instanceof HttpError) { res.status(error.status).json({ error: error.message }); return; }
    if(error?.type === "entity.too.large"){res.status(413).json({error:"El archivo supera el máximo de 10 MiB"});return;}
    const code = error && typeof error === "object" ? error.code : undefined;
    console.error("[api]", error instanceof Error ? error.message : "Error inesperado");
    if (["22P02","22003","23503"].includes(String(code))) {res.status(400).json({error:"Dato o referencia no válidos; no se guardaron cambios"});return;}
    if (code === "23505") {
      res.status(409).json({ error: "El registro entra en conflicto con un dato existente. No se completó la operación." });
      return;
    }
    res.status(500).json({ error: "No se pudo completar la operación" });
  };
  app.use(handleError);
  return app;
}
