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
    if(error?.type === "entity.too.large"){res.status(413).json({error:_req.is("application/json")?"El formulario supera el tamaño máximo de una solicitud. Reduzca los textos o registros extensos antes de guardar; los anexos se cargan desde Documentación.":"El archivo supera el máximo de 10 MiB"});return;}
    const code = error && typeof error === "object" ? error.code : undefined;
    console.error("[api]", error instanceof Error ? error.message : "Error inesperado");
    if (["22P02","22003","23503"].includes(String(code))) {res.status(400).json({error:"Dato o referencia no válidos; no se guardaron cambios"});return;}
    if (code === "22001") {
      const limit=String(error?.message??'').match(/(?:character varying|character)\((\d+)\)/)?.[1];
      res.status(400).json({error:limit?`Uno de los textos supera el máximo de ${limit} caracteres permitido por su campo. Acórtelo antes de guardar.`:"Uno de los textos supera la longitud permitida por su campo. Acórtelo antes de guardar."});return;
    }
    if (["22007","22008"].includes(String(code))) {res.status(400).json({error:"Hay una fecha inválida o fuera de rango. Revise las fechas de inicio y finalización."});return;}
    if (code === "23505") {
      const reasons:Record<string,string>={
        propuesta_palabra_clave_id_propuesta_idioma_palabra_idx:"Palabras clave: se repite un término en el mismo idioma. Quite la repetición antes de guardar.",
        propuesta_codigo_key:"El código automático de la propuesta coincide con otro existente. Vuelva a guardar; si se repite, solicite revisar la numeración.",
        propuesta_presupuesto_anual_id_propuesta_anio_idx:"Presupuesto: hay dos registros para el mismo año. Unifique los montos en una sola fila.",
        propuesta_participante_hora_id_participante_tipo_hora_idx:"Equipo: se repite un tipo de horas para la misma persona. Unifique esas horas.",
        propuesta_objetivo_especifico_id_propuesta_numero_idx:"Objetivos específicos: dos registros utilizan el mismo número. Recargue el expediente antes de volver a guardar.",
        actividad_plan_id_propuesta_id_objetivo_numero_idx:"Plan de acción: dos actividades utilizan el mismo número dentro de un objetivo. Recargue el expediente antes de volver a guardar.",
      };
      const constraint=String(error?.constraint??'');
      res.status(409).json({ error: Object.hasOwn(reasons,constraint)?reasons[constraint]:"Hay un dato duplicado que debe ser único. No se guardaron los cambios; revise los registros repetidos." });
      return;
    }
    res.status(500).json({ error: "No se pudo completar la operación" });
  };
  app.use(handleError);
  return app;
}
