import { alcancePropuestas, exigirAlcance, etapaRol } from "../alcancePropuestas.js";
import { seccionesSubsanacion } from "../subsanacion.js";
import { readFileSync } from "node:fs";
import { saveRubric, loadRubric } from "../rubricas.js";
import { HttpError } from "../middleware/HttpError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Router } from "express";
import { pool, query } from "../db.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";

/**
 * CU3 / CU4 — Persistencia de dictamen PI, resultado de comité, aval y resolución CIE.
 *
 * Las pantallas del frontend siguen siendo por rol; este router escribe en Postgres
 * y avanza `propuesta.estado_actual` / `etapa_flujo` para que el histórico (CU5)
 * refleje las decisiones.
 *
 * etapa_flujo (alineado al seed):
 *   0 redacción · 1 vinculación/envío · 2 comité · 3 consejo · 4 VIE · 5 CIE · 6 resolución
 */

export const evaluacionesRouter = Router();

const VIE_ITEMS = JSON.parse(readFileSync(new URL("../../../shared/checklist-vie.json",import.meta.url),"utf8")) as {codigo:string;etiqueta:string}[];

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  en_subsanacion: "En subsanación",
  enviada: "Enviada",
  en_evaluacion: "En evaluación",
  dictaminada: "Dictaminada",
  avalada: "Avalada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const MODALIDAD_LABEL: Record<string, string> = {
  basica: "Investigación básica",
  aplicada: "Investigación aplicada",
  basica_aplicada: "Investigación básica y aplicada",
  desarrollo_tecnologico: "Desarrollo tecnológico",
  fortalecimiento: "Fortalecimiento",
};

type BandejaRow = {
  id_propuesta: number;
  codigo: string;
  titulo: string;
  modalidad: string;
  estado_actual: string;
  etapa_flujo: number;
  fecha_envio: string | null;
  resumen: string | null;
  abstract_en: string | null;
  requiere_dictamen_pi: boolean;
  pi_estado: string|null;
  escuela_nombre: string;
  coordinador_nombre: string;
  convocatoria_nombre: string;
  oficio_pi: string | null;
  oficio_comite: string | null;
  oficio_aval: string | null;
  resolucion: string | null;
  calificacion_comite: string | null;
  notificada: boolean;
  justificacion_aval: string | null;
  coordinador_correo: string;
  fecha_resolucion: string | null;
  vie_checks: Record<string,boolean>;
};

const BANDEJA_SQL = `
  SELECT
    p.id_propuesta,
    p.codigo,
    p.titulo,
    p.modalidad,
    p.estado_actual,
    p.etapa_flujo,
    p.fecha_envio,
    p.resumen,
    p.abstract_en,
    p.requiere_dictamen_pi,
    CASE WHEN NOT p.requiere_dictamen_pi AND pcn.id_propuesta IS NOT NULL THEN 'no_requerido' ELSE dpi.estado END AS pi_estado,
    e.nombre AS escuela_nombre,
    u.nombre_completo AS coordinador_nombre,
    u.correo_institucional AS coordinador_correo,
    r.fecha_resolucion,
    c.nombre AS convocatoria_nombre,
    dpi.numero_oficio AS oficio_pi,
    rc.numero_oficio AS oficio_comite,
    av.numero_oficio AS oficio_aval,
    r.numero_resolucion AS resolucion,
    COALESCE((SELECT json_object_agg(ch.codigo_item,ch.verificado) FROM revision_checklist ch
      WHERE ch.id_revision=(SELECT rv.id_revision FROM revision_expediente rv WHERE rv.id_propuesta=p.id_propuesta AND rv.etapa='vie' ORDER BY rv.ciclo DESC LIMIT 1)), '{}'::json) AS vie_checks,
    av.observaciones AS justificacion_aval,
    EXISTS (SELECT 1 FROM comunicacion_institucional ci WHERE ci.id_propuesta=p.id_propuesta AND ci.tipo='resolucion_cie' AND ci.confirmada=true) AS notificada,
    rc.calificacion_promedio::text AS calificacion_comite
  FROM propuesta p
  JOIN escuela e ON e.id_escuela = p.id_escuela
  JOIN usuario u ON u.id_usuario = p.id_coordinador
  JOIN convocatoria c ON c.id_convocatoria = p.id_convocatoria
  LEFT JOIN dictamen_pi dpi ON dpi.id_propuesta = p.id_propuesta
  LEFT JOIN pi_certificacion_no_requerido pcn ON pcn.id_propuesta = p.id_propuesta
  LEFT JOIN resultado_comite rc ON rc.id_propuesta = p.id_propuesta
  LEFT JOIN aval_consejo av ON av.id_propuesta = p.id_propuesta
  LEFT JOIN resolucion_cie r ON r.id_propuesta = p.id_propuesta
  WHERE p.estado_actual <> 'borrador'
`;

function mapBandeja(row: BandejaRow) {
  return {
    id: row.id_propuesta,
    codigo: row.codigo,
    titulo: row.titulo,
    modalidad: row.modalidad,
    modalidadLabel: MODALIDAD_LABEL[row.modalidad] ?? row.modalidad,
    estadoActual: row.estado_actual,
    estadoLabel: ESTADO_LABEL[row.estado_actual] ?? row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
    resumen: row.resumen,
    abstractEn: row.abstract_en,
    piRequired: row.requiere_dictamen_pi,
    piEstado: row.pi_estado,
    escuela: row.escuela_nombre,
    investigadora: row.coordinador_nombre,
    coordinadorCorreo: row.coordinador_correo,
    fechaResolucion: row.fecha_resolucion,
    convocatoria: row.convocatoria_nombre,
    oficioPI: row.oficio_pi,
    oficioComite: row.oficio_comite,
    oficioAval: row.oficio_aval,
    resolucion: row.resolucion,
    notificada: row.notificada,
    vieChecks: row.vie_checks,
    justificacionAval: row.justificacion_aval,
    evaluacionComite: row.calificacion_comite
      ? { average: Number(row.calificacion_comite) }
      : null,
  };
}

/** Roles que pueden operar cada acción del prototipo. */
const ACTION_ROLES: Record<string, Set<string>> = {
  pi: new Set(["vinculacion", "admin"]),
  "committee-ready": new Set(["comite_asistente", "admin"]),
  return: new Set(["comite_asistente", "gestora_vie", "admin"]),
  "pi-not-required": new Set(["vinculacion", "admin"]),
  "save-rubric": new Set(["comite_evaluador", "cie", "admin"]),
  "committee-score": new Set(["comite_evaluador", "admin"]),
  "send-council": new Set(["consejo_asistente", "admin"]),
  "council-approve": new Set(["consejo", "admin"]),
  "council-reject": new Set(["consejo", "admin"]),
  "communicate-aval": new Set(["direccion_escuela", "admin"]),
  "vie-checklist": new Set(["gestora_vie", "admin"]),
  "vie-observation": new Set(["gestora_vie", "admin"]),
  "send-cie": new Set(["gestora_vie", "admin"]),
  "cie-approve": new Set(["cie", "admin"]),
  "cie-reject": new Set(["cie", "admin"]),
  "notify-resolution": new Set(["direccion_investigacion", "admin"]),
};

function roleOk(role: string | null | undefined, action: string) {
  const allowed = ACTION_ROLES[action];
  if (!allowed) return false;
  return !!role && allowed.has(role);
}

const EVALUATION_VIEWS = new Set(["vinculacion","comite_asistente","comite_evaluador","consejo_asistente","consejo","direccion_escuela","gestora_vie","cie","direccion_investigacion","admin"]);

/** Filtro de bandeja por rol (etapa / estado). */
function bandejaClause(role: string | null | undefined): {
  sql: string;
  params: unknown[];
} {
  switch (role) {
    case "vinculacion":
      return {
        sql: ` AND p.estado_actual IN ('enviada','en_evaluacion','dictaminada','avalada') AND
          (p.etapa_flujo<=1 OR (p.requiere_dictamen_pi AND NOT EXISTS(SELECT 1 FROM dictamen_pi d WHERE d.id_propuesta=p.id_propuesta AND d.estado='emitido'))
          OR (NOT p.requiere_dictamen_pi AND NOT EXISTS(SELECT 1 FROM pi_certificacion_no_requerido pc WHERE pc.id_propuesta=p.id_propuesta)))`,
        params: [],
      };
    case "comite_asistente":
    case "comite_evaluador":
      return {
        sql: ` AND p.etapa_flujo BETWEEN 1 AND 2 AND p.estado_actual IN ('enviada', 'en_evaluacion', 'dictaminada')`,
        params: [],
      };
    case "consejo_asistente":
    case "consejo":
    case "direccion_escuela":
      return {
        // Incluye dictaminada/en_evaluación (por decidir) y avalada (ya decidida, aún visible).
        sql: ` AND p.etapa_flujo BETWEEN 2 AND 4 AND p.estado_actual IN ('en_evaluacion', 'dictaminada', 'avalada')`,
        params: [],
      };
    case "gestora_vie":
      return {
        sql: ` AND p.etapa_flujo BETWEEN 3 AND 4 AND p.estado_actual IN ('dictaminada', 'avalada')`,
        params: [],
      };
    case "cie":
      return {
        sql: ` AND p.etapa_flujo >= 4 AND p.estado_actual IN ('avalada', 'en_evaluacion', 'dictaminada') AND p.estado_actual NOT IN ('aprobada', 'rechazada')`,
        params: [],
      };
    case "direccion_investigacion":
      return {
        sql: ` AND p.estado_actual IN ('aprobada', 'rechazada')`,
        params: [],
      };
    case "admin":
    default:
      return { sql: "", params: [] };
  }
}

async function loadPropuesta(id: number) {
  const result = await query<{
    id_propuesta: number;
    codigo: string;
    estado_actual: string;
    etapa_flujo: number;
    id_escuela: number;
    id_coordinador: number;
    titulo: string;
    requiere_dictamen_pi: boolean;
  }>(
    `SELECT id_propuesta, codigo, estado_actual, etapa_flujo, id_escuela, id_coordinador, titulo, requiere_dictamen_pi
     FROM propuesta WHERE id_propuesta = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function advanceEstado(
  client: { query: typeof pool.query },
  opts: {
    idPropuesta: number;
    estadoAnterior: string;
    estadoNuevo: string;
    etapa: number;
    userId: number;
    observacion: string;
  },
) {
  await client.query(
    `UPDATE propuesta
     SET estado_actual = $1, etapa_flujo = $2
     WHERE id_propuesta = $3`,
    [opts.estadoNuevo, opts.etapa, opts.idPropuesta],
  );
  await client.query(
    `INSERT INTO propuesta_historial_estado (
       id_propuesta, estado_anterior, estado_nuevo, id_usuario, fecha_hora, observacion, etapa_evento
     ) VALUES ($1, $2, $3, $4, NOW(), $5, current_setting('vie.etapa_evento',true)::smallint)`,
    [
      opts.idPropuesta,
      opts.estadoAnterior,
      opts.estadoNuevo,
      opts.userId,
      opts.observacion.slice(0, 500),
    ],
  );
}

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function yes(v: unknown): boolean {
  const s = str(v).toLowerCase();
  return s === "sí" || s === "si" || s === "true" || s === "1";
}

/** Listado de expedientes para la bandeja del rol actual. */
evaluacionesRouter.get(
  "/evaluaciones/bandeja",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const authenticatedRole = req.demoAuth!.role;
    if(!authenticatedRole || !EVALUATION_VIEWS.has(authenticatedRole)){res.status(403).json({error:"El rol no posee bandeja de evaluación"});return;}
    const requestedView = String(req.query.vista??"");
    if(requestedView && (authenticatedRole!=="admin" || !EVALUATION_VIEWS.has(requestedView))){res.status(403).json({error:"Vista de evaluación no permitida"});return;}
    const role = requestedView || authenticatedRole;
    const clause = bandejaClause(role);
    const scope = alcancePropuestas(req.demoAuth!,clause.params.length+1);
    const result = await query<BandejaRow>(
      `${BANDEJA_SQL}${clause.sql} AND ${scope.sql}
       ORDER BY p.fecha_envio DESC NULLS LAST, p.id_propuesta DESC
       LIMIT 100`,
      [...clause.params,...scope.params],
    );
    res.json({
      role,
      items: result.rows.map(mapBandeja),
      total: result.rows.length,
    });
  }),
);

/** Detalle de un expediente en bandeja (por id numérico). */
evaluacionesRouter.get(
  "/evaluaciones/propuestas/:id",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "id inválido" });
      return;
    }
    await exigirAlcance(id,req.demoAuth!);
    const result = await query<BandejaRow>(
      `${BANDEJA_SQL} AND p.id_propuesta = $1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    res.json(mapBandeja(row));
  }),
);

evaluacionesRouter.get("/evaluaciones/propuestas/:id/pi", requireDemoAuth, asyncHandler(async(req,res)=>{
  if(!roleOk(req.demoAuth!.role,"pi")){res.status(403).json({error:"Sin permiso para editar el dictamen"});return;}
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1){res.status(400).json({error:"ID inválido"});return;}
  await exigirAlcance(id,req.demoAuth!);
  const proposal=await loadPropuesta(id);
  if(!proposal){res.status(404).json({error:"Propuesta no encontrada"});return;}
  const row=await query("SELECT * FROM dictamen_pi WHERE id_propuesta=$1",[id]);
  const d=row.rows[0];
  const certification=(await query("SELECT * FROM pi_certificacion_no_requerido WHERE id_propuesta=$1",[id])).rows[0];
  res.json({estado:proposal.requiere_dictamen_pi?d?.estado??null:certification?"no_requerido":null,fundamentoNoRequerido:certification?.fundamento??null,certificadoPor:certification?.id_certificador??null,fecha:certification?.fecha_certificacion??d?.fecha_dictamen??null,form:d?{
    potencial:d.potencial_proteccion?"Sí":"No",innovacion:d.es_innovador?"Sí":"No",tipoActivo:d.activo_identificable??"",tipoPI:d.mecanismo_pi??"",
    novedad:d.novedad??"",titularidad:d.titularidad??"",divulgacion:d.recomendaciones_divulgacion??"",confidencialidad:d.confidencialidad??"",
    analisis:d.analisis_tecnico??"",recomendaciones:d.recomendaciones_vinculacion??"",oficio:d.numero_oficio??"",fecha:d.fecha_dictamen instanceof Date?d.fecha_dictamen.toISOString().slice(0,10):String(d.fecha_dictamen??'').slice(0,10),
  }:null});
}));

evaluacionesRouter.get("/evaluaciones/propuestas/:id/rubrica", requireDemoAuth, asyncHandler(async(req,res)=>{
  const role=req.demoAuth!.role;
  if(!roleOk(role,"save-rubric")){res.status(403).json({error:"Sin permiso para consultar evaluaciones individuales"});return;}
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1){res.status(400).json({error:"ID inválido"});return;}
  await exigirAlcance(id,req.demoAuth!);
  const p=await query<{modalidad:string}>("SELECT modalidad FROM propuesta WHERE id_propuesta=$1",[id]);
  if(!p.rows[0]){res.status(404).json({error:"Propuesta no encontrada"});return;}
  const instance=role==='cie'?'cie':role==='admin'&&req.query.instancia==='cie'?'cie':'comite';
  res.json({scores:await loadRubric(pool,id,req.demoAuth!.userId!,instance,p.rows[0].modalidad)});
}));

/**
 * Ejecuta una acción de evaluación del prototipo.
 * Body: { action: string, payload?: object }
 */
evaluacionesRouter.post(
  "/evaluaciones/propuestas/:id/acciones",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const action = str(req.body?.action);
    const payload = asRecord(req.body?.payload);
    const role = req.demoAuth!.role;
    const userId = req.demoAuth!.userId!;

    if (!Number.isFinite(id) || !action) {
      res.status(400).json({ error: "id y action son obligatorios" });
      return;
    }
    if (!roleOk(role, action)) {
      res.status(403).json({
        error: `El rol ${role ?? "(ninguno)"} no puede ejecutar la acción "${action}"`,
      });
      return;
    }

    const propuesta = await loadPropuesta(id);
    if (!propuesta) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    if (propuesta.estado_actual === "borrador") {
      res.status(400).json({ error: "La propuesta aún está en borrador" });
      return;
    }

    await exigirAlcance(id,req.demoAuth!);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const locked = await client.query("SELECT * FROM propuesta WHERE id_propuesta=$1 FOR UPDATE", [id]);
      if (!locked.rows[0]) throw new HttpError(404, "Propuesta no encontrada");
      Object.assign(propuesta, locked.rows[0]);
      await exigirAlcance(id,req.demoAuth!,client.query.bind(client));
      if (propuesta.estado_actual === "borrador") throw new HttpError(409, "La propuesta aún está en borrador");
      if (["aprobada", "rechazada"].includes(propuesta.estado_actual) && action !== "notify-resolution") {
        throw new HttpError(409, "El expediente está cerrado; no se puede modificar su decisión");
      }

      if(propuesta.estado_actual==="en_subsanacion") throw new HttpError(409,"El investigador debe subsanar y reenviar a la instancia que devolvió antes de continuar");
      const decisions=await client.query("SELECT 1 FROM aval_consejo WHERE id_propuesta=$1 AND resultado IN ('rechaza','rechazado') UNION ALL SELECT 1 FROM resolucion_cie WHERE id_propuesta=$1 AND resultado='rechazada'",[id]);
      if(decisions.rowCount && action!=="notify-resolution") throw new HttpError(409,"Existe un rechazo previo; su reapertura requiere la excepción del equipo (D09)");
      const pi=await client.query("SELECT * FROM dictamen_pi WHERE id_propuesta=$1",[id]);
      const piRecord=pi.rows[0];
      const certification=(await client.query("SELECT * FROM pi_certificacion_no_requerido WHERE id_propuesta=$1",[id])).rows[0];
      if((action==="pi"&&piRecord&&["emitido","no_requerido"].includes(piRecord.estado)) || (action==="pi-not-required"&&certification)) throw new HttpError(409,"El dictamen o certificación PI está cerrado; no puede sobrescribirse");
      const advances=new Set(["committee-ready","committee-score","send-council","council-approve","council-reject","communicate-aval","send-cie","cie-approve","cie-reject"]);
      if(advances.has(action)) {
        const valid=locked.rows[0].requiere_dictamen_pi
          ? piRecord?.estado==="emitido" && piRecord.id_emisor && piRecord.fecha_dictamen
          : certification && String(certification.fundamento??"").trim() && certification.id_certificador && certification.fecha_certificacion;
        if(!valid) throw new HttpError(409,locked.rows[0].requiere_dictamen_pi?"Se requiere dictamen PI emitido antes de avanzar":"Falta certificar PI no requerido con fundamento y responsable");
      }
      const ranges:Record<string,[number,number]>={pi:[1,5],"pi-not-required":[1,5],"committee-ready":[1,2],"committee-score":[1,2],"send-council":[2,3],"council-approve":[3,3],"council-reject":[3,3],"communicate-aval":[3,4],"vie-checklist":[4,4],"vie-observation":[4,4],"send-cie":[4,4],"cie-approve":[5,5],"cie-reject":[5,5]};
      const range=ranges[action];
      if(range&&(propuesta.etapa_flujo<range[0]||propuesta.etapa_flujo>range[1])) throw new HttpError(409,"La acción no corresponde a la instancia actual del expediente");
      const instance=role==="cie" || role==="admin"&&payload.instancia==="cie"?"cie":"comite";
      if(action==="save-rubric"&&propuesta.etapa_flujo!==(instance==="cie"?5:2)) throw new HttpError(409,"La evaluación no corresponde a la instancia actual");
      if((action==="committee-score"||action==="save-rubric"&&instance==="comite")&&(await client.query("SELECT 1 FROM resultado_comite WHERE id_propuesta=$1",[id])).rowCount) throw new HttpError(409,"El dictamen del Comité está cerrado; no puede sobrescribirse");

      const adminStage=action==="return"?(payload.instancia==="vie"?4:2):action==="pi"||action==="pi-not-required"?1:action.startsWith("committee")?2:action.startsWith("council")||action==="communicate-aval"||action==="send-council"?3:action.startsWith("vie")||action==="send-cie"?4:action.startsWith("cie")?5:action==="notify-resolution"?6:propuesta.etapa_flujo;
      const actorStage=role==="admin"?adminStage:etapaRol(role);
      await client.query("SELECT set_config('vie.etapa_evento',$1,true)",[String(actorStage)]);
      let message = "Acción registrada";
      const prev = propuesta.estado_actual;

      switch (action) {
        case "pi-not-required": {
          if(locked.rows[0].requiere_dictamen_pi) throw new HttpError(409,"La propuesta requiere dictamen PI; no puede omitirse");
          const fundamento=str(payload.fundamento);
          if(!fundamento) throw new HttpError(400,"El fundamento de PI no requerido es obligatorio");
          await client.query("INSERT INTO pi_certificacion_no_requerido(id_propuesta,id_certificador,fundamento) VALUES($1,$2,$3)",[id,userId,fundamento]);
          await advanceEstado(client,{idPropuesta:id,estadoAnterior:prev,estadoNuevo:propuesta.etapa_flujo<=1?"en_evaluacion":prev,etapa:Math.max(propuesta.etapa_flujo,2),userId,observacion:"PI no requerido: certificación registrada por Vinculación"});
          message="PI no requerido certificado con fundamento, fecha y responsable.";
          break;
        }
        case "pi": {
          if(!locked.rows[0].requiere_dictamen_pi) throw new HttpError(409,"Registre la certificación explícita de PI no requerido");
          if (!["Sí","No"].includes(str(payload.potencial)) || !["Sí","No"].includes(str(payload.innovacion))) throw new HttpError(400,"Indique potencial de protección e innovación del dictamen");
          const oficio =
            str(payload.oficio) ||
            `CV-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const fecha = str(payload.fecha) || new Date().toISOString().slice(0, 10);
          await client.query(
            `
            INSERT INTO dictamen_pi (
              id_propuesta, id_emisor, potencial_proteccion, es_innovador,
              activo_identificable, mecanismo_pi, novedad, titularidad,
              recomendaciones_divulgacion, confidencialidad, analisis_tecnico,
              recomendaciones_vinculacion, numero_oficio, fecha_dictamen, estado
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::date, 'emitido'
            )
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_emisor = EXCLUDED.id_emisor,
              potencial_proteccion = EXCLUDED.potencial_proteccion,
              es_innovador = EXCLUDED.es_innovador,
              activo_identificable = EXCLUDED.activo_identificable,
              mecanismo_pi = EXCLUDED.mecanismo_pi,
              novedad = EXCLUDED.novedad,
              titularidad = EXCLUDED.titularidad,
              recomendaciones_divulgacion = EXCLUDED.recomendaciones_divulgacion,
              confidencialidad = EXCLUDED.confidencialidad,
              analisis_tecnico = EXCLUDED.analisis_tecnico,
              recomendaciones_vinculacion = EXCLUDED.recomendaciones_vinculacion,
              numero_oficio = EXCLUDED.numero_oficio,
              fecha_dictamen = EXCLUDED.fecha_dictamen,
              estado = 'emitido'
            `,
            [
              id,
              userId,
              yes(payload.potencial),
              yes(payload.innovacion),
              str(payload.tipoActivo).slice(0, 200) || null,
              str(payload.tipoPI).slice(0, 200) || null,
              str(payload.novedad) || null,
              str(payload.titularidad) || null,
              str(payload.divulgacion) || null,
              str(payload.confidencialidad) || null,
              str(payload.analisis) || null,
              str(payload.recomendaciones) || null,
              oficio.slice(0, 40),
              fecha,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: propuesta.etapa_flujo<=1?"en_evaluacion":prev,
            etapa: Math.max(propuesta.etapa_flujo, 2),
            userId,
            observacion: `Dictamen PI emitido (${oficio})`,
          });
          message = "Dictamen de PI emitido y oficio agregado al expediente.";
          break;
        }

        case "committee-ready": {
          await client.query(
            `
            INSERT INTO revision_expediente (
              id_propuesta, etapa, ciclo, id_revisor, resultado, fecha_inicio, fecha_fin
            ) SELECT $1, 'comite', COALESCE(MAX(ciclo),0)+1, $2, 'completo', NOW(), NOW() FROM revision_expediente WHERE id_propuesta=$1 AND etapa='comite'
            ON CONFLICT (id_propuesta, etapa, ciclo) DO UPDATE SET
              id_revisor = EXCLUDED.id_revisor,
              resultado = 'completo',
              fecha_fin = NOW()
            `,
            [id, userId],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "en_evaluacion",
            etapa: Math.max(propuesta.etapa_flujo, 2),
            userId,
            observacion: "Expediente marcado completo para el cuerpo evaluador",
          });
          message = "Propuesta enviada al cuerpo evaluador.";
          break;
        }

        case "return": {
          const instancia=role==="gestora_vie"?"vie":role==="admin"&&payload.instancia==="vie"?"vie":"comite";
          if(instancia==="vie"?propuesta.etapa_flujo!==4:![1,2].includes(propuesta.etapa_flujo)) throw new HttpError(409,"Solo puede devolver desde su instancia actual");
          if(instancia==="comite"&&(await client.query("SELECT 1 FROM resultado_comite WHERE id_propuesta=$1",[id])).rowCount) throw new HttpError(409,"El dictamen del Comité ya está cerrado");
          const texto=str(payload.texto);
          const secciones=payload.secciones;
          if(!texto||!Array.isArray(secciones)||!secciones.length||secciones.some(c=>!seccionesSubsanacion.some(s=>s.codigo===c))) throw new HttpError(400,"Indique motivo y secciones concretas a subsanar");
          await client.query(`INSERT INTO propuesta_subsanacion(id_propuesta,instancia,rol_destino,estado_retorno,etapa_retorno,secciones,motivo,id_devuelta_por)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,instancia,instancia==="vie"?"gestora_vie":"comite_asistente",instancia==="vie"?prev:"en_evaluacion",instancia==="vie"?4:2,[...new Set(secciones)],texto,userId]);
          const rev=await client.query(`INSERT INTO revision_expediente(id_propuesta,etapa,ciclo,id_revisor,resultado,fecha_inicio,fecha_fin)
            SELECT $1,$2::varchar(20),COALESCE(MAX(ciclo),0)+1,$3,'devuelto',NOW(),NOW() FROM revision_expediente WHERE id_propuesta=$1 AND etapa=$2::varchar(20) RETURNING id_revision`,[id,instancia,userId]);
          for(const section of [...new Set(secciones)]) await client.query(`INSERT INTO observacion(id_propuesta,id_revision,etapa,seccion_formulario,id_creada_por,mensaje,requiere_respuesta,fecha_creacion)
            VALUES($1,$2,$3,$4,$5,$6,true,NOW())`,[id,rev.rows[0].id_revision,instancia,section,userId,texto]);
          await advanceEstado(client,{idPropuesta:id,estadoAnterior:prev,estadoNuevo:"en_subsanacion",etapa:propuesta.etapa_flujo,userId,observacion:`Devuelta por ${instancia}: ${texto}`});
          await client.query("INSERT INTO notificacion(id_usuario_destino,id_propuesta,titulo,mensaje,leida,fecha_hora) VALUES($1,$2,$3,$4,false,NOW())",[propuesta.id_coordinador,id,"Subsanación requerida",texto.slice(0,500)]);
          message="Propuesta en subsanación. El reenvío regresará a esta misma instancia.";
          break;
        }

        case "save-rubric": {
          const modality = locked.rows[0].modalidad as string;
          const instance = role === "cie" || role === "admin" && payload.instancia === "cie" ? "cie" : "comite";
          await saveRubric(client,id,userId,instance,modality,payload);
          message = "Los cambios de la evaluación se guardaron correctamente.";
          break;
        }

        case "committee-score": {
          const evaluation = await saveRubric(client,id,userId,"comite",locked.rows[0].modalidad as string,payload,true);
          const promedio = evaluation.total;
          const oficio =
            str(payload.oficio) ||
            `CT-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const fundamento =
            str(payload.fundamento) ||
            str(payload.texto) ||
            "Evaluación del Comité Técnico registrada desde el prototipo.";
          await client.query(
            `
            INSERT INTO resultado_comite (
              id_propuesta, recomendacion, calificacion_promedio, numero_oficio,
              fundamento, fecha_dictamen, id_coordinador_comite
            ) VALUES ($1, $6, $2, $3, $4, CURRENT_DATE, $5)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              recomendacion = EXCLUDED.recomendacion,
              calificacion_promedio = EXCLUDED.calificacion_promedio,
              numero_oficio = EXCLUDED.numero_oficio,
              fundamento = EXCLUDED.fundamento,
              fecha_dictamen = CURRENT_DATE,
              id_coordinador_comite = EXCLUDED.id_coordinador_comite
            `,
            [
              id,
              promedio,
              oficio.slice(0, 40),
              fundamento,
              userId,
              evaluation.recommendation,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "dictaminada",
            etapa: Math.max(propuesta.etapa_flujo, 3),
            userId,
            observacion: `Dictamen del Comité (${oficio})`,
          });
          message = "Evaluación completada y preparada para consolidación.";
          break;
        }

        case "send-council": {
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: prev === "dictaminada" ? "dictaminada" : "en_evaluacion",
            etapa: Math.max(propuesta.etapa_flujo, 3),
            userId,
            observacion: "Expediente enviado al Consejo de Profesores",
          });
          message = "Expediente enviado al Consejo de Profesores.";
          break;
        }

        case "council-approve":
        case "council-reject": {
          const previous=await client.query("SELECT 1 FROM aval_consejo WHERE id_propuesta=$1",[id]);
          if(previous.rowCount)throw new HttpError(409,"El aval ya fue emitido. No se ha definido una reapertura de decisiones.");
          const texto = str(payload.texto);
          if (!texto) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La justificación es obligatoria" });
            return;
          }
          const aprueba = action === "council-approve";
          const oficio =
            str(payload.oficio) ||
            `ESC-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          await client.query(
            `
            INSERT INTO aval_consejo (
              id_propuesta, id_aprobador, resultado, articulo,
              numero_oficio, observaciones, fecha_aval
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_aprobador = EXCLUDED.id_aprobador,
              resultado = EXCLUDED.resultado,
              articulo = EXCLUDED.articulo,
              numero_oficio = EXCLUDED.numero_oficio,
              observaciones = EXCLUDED.observaciones,
              fecha_aval = CURRENT_DATE
            `,
            [
              id,
              userId,
              aprueba ? "aprueba" : "rechaza",
              str(payload.articulo) || null,
              oficio.slice(0, 40),
              texto,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: aprueba ? "avalada" : "rechazada",
            etapa: aprueba ? Math.max(propuesta.etapa_flujo, 4) : 6,
            userId,
            observacion: aprueba
              ? `Aval aprobado (${oficio})`
              : `Aval rechazado (${oficio}): ${texto.slice(0, 200)}`,
          });
          message = aprueba
            ? "Aval aprobado y oficio generado."
            : "Aval rechazado correctamente. Justificación registrada.";
          break;
        }

        case "communicate-aval": {
          const aval=await client.query("SELECT resultado FROM aval_consejo WHERE id_propuesta=$1",[id]);
          if(!["aprueba","aprobado"].includes(aval.rows[0]?.resultado))throw new HttpError(409,"Se requiere un aval aprobado antes de comunicarlo a VIE");
          await client.query(
            `
            INSERT INTO comunicacion_institucional (
              id_propuesta, tipo, id_emisor, destinatario_texto,
              confirmada, fecha_envio, mensaje
            ) VALUES ($1, 'aval_consejo', $2, 'VIE / Dirección de Investigación', false, NOW(), $3)
            `,
            [
              id,
              userId,
              `Comunicación de aval de la propuesta ${propuesta.codigo}`,
            ],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: prev === "rechazada" ? "rechazada" : "avalada",
            etapa: Math.max(propuesta.etapa_flujo, 4),
            userId,
            observacion: "Aval comunicado a VIE",
          });
          message =
            "Comunicación del aval registrada para VIE; la generación del archivo de oficio está pendiente.";
          break;
        }

        case "vie-checklist": {
          const checks=asRecord(payload.checks);
          if(VIE_ITEMS.some(item=>typeof checks[item.codigo]!=="boolean"))throw new HttpError(400,"Complete los estados de verificación");
          const allOk=VIE_ITEMS.every(item=>checks[item.codigo]===true);
          const previous=await client.query("SELECT ciclo,resultado FROM revision_expediente WHERE id_propuesta=$1 AND etapa='vie' ORDER BY ciclo DESC LIMIT 1",[id]);
          const latest=previous.rows[0];
          const cycle=latest?latest.ciclo+(latest.resultado==='devuelto'?1:0):1;
          const revision=await client.query<{id_revision:number}>(`INSERT INTO revision_expediente(id_propuesta,etapa,ciclo,id_revisor,resultado,fecha_inicio,fecha_fin)
            VALUES($1,'vie',$4,$2,$3,NOW(),NOW()) ON CONFLICT(id_propuesta,etapa,ciclo) DO UPDATE SET id_revisor=EXCLUDED.id_revisor,resultado=EXCLUDED.resultado,fecha_fin=NOW() RETURNING id_revision`,[id,userId,allOk?'completo':'en_revision',cycle]);
          for(const item of VIE_ITEMS)await client.query(`INSERT INTO revision_checklist(id_revision,codigo_item,etiqueta,obligatorio,verificado) VALUES($1,$2,$3,true,$4)
            ON CONFLICT(id_revision,codigo_item) DO UPDATE SET verificado=EXCLUDED.verificado`,[revision.rows[0].id_revision,item.codigo,item.etiqueta,checks[item.codigo]]);
          message="Verificación VIE guardada.";
          break;
        }

        case "vie-observation": {
          const texto = str(payload.texto);
          if (!texto) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La observación es obligatoria" });
            return;
          }
          await client.query(
            `
            INSERT INTO observacion (
              id_propuesta, etapa, id_creada_por, mensaje,
              requiere_respuesta, fecha_creacion
            ) VALUES ($1, 'vie', $2, $3, false, NOW())
            `,
            [id, userId, texto],
          );
          await client.query("INSERT INTO notificacion(id_usuario_destino,id_propuesta,titulo,mensaje,leida,fecha_hora) VALUES($1,$2,$3,$4,false,NOW())",[propuesta.id_coordinador,id,`Observación VIE · ${propuesta.codigo}`,texto.slice(0,500)]);
          message = "Observación enviada correctamente al equipo investigador.";
          break;
        }

        case "send-cie": {
          const reviewed=await client.query("SELECT resultado FROM revision_expediente WHERE id_propuesta=$1 AND etapa='vie' ORDER BY ciclo DESC LIMIT 1",[id]);
          if(reviewed.rows[0]?.resultado!=="completo")throw new HttpError(409,"Guarde la verificación VIE completa antes de remitir al CIE");
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: "avalada",
            etapa: Math.max(propuesta.etapa_flujo, 5),
            userId,
            observacion: "Expediente remitido al CIE",
          });
          message = "Expediente enviado al CIE.";
          break;
        }

        case "cie-approve":
        case "cie-reject": {
          const fundamento =
            str(payload.texto) ||
            str(payload.fundamento) ||
            (action === "cie-approve"
              ? "Resolución aprobatoria del CIE."
              : "Resolución de rechazo del CIE.");
          if (action === "cie-reject" && !str(payload.texto) && !str(payload.fundamento)) {
            await client.query("ROLLBACK");
            res.status(400).json({ error: "La justificación es obligatoria" });
            return;
          }
          const numero =
            str(payload.numero) ||
            `CIE-RES-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
          const resultado = action === "cie-approve" ? "aprobada" : "rechazada";
          await client.query(
            `
            INSERT INTO resolucion_cie (
              id_propuesta, id_responsable, resultado, numero_resolucion,
              fundamento, fecha_resolucion
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
            ON CONFLICT (id_propuesta) DO UPDATE SET
              id_responsable = EXCLUDED.id_responsable,
              resultado = EXCLUDED.resultado,
              numero_resolucion = EXCLUDED.numero_resolucion,
              fundamento = EXCLUDED.fundamento,
              fecha_resolucion = CURRENT_DATE
            `,
            [id, userId, resultado, numero.slice(0, 40), fundamento],
          );
          await advanceEstado(client, {
            idPropuesta: id,
            estadoAnterior: prev,
            estadoNuevo: resultado,
            etapa: 6,
            userId,
            observacion: `Resolución CIE ${numero}: ${resultado}`,
          });
          message =
            action === "cie-approve"
              ? "Resolución aprobatoria emitida."
              : "Resolución de rechazo emitida. Justificación registrada.";
          break;
        }

        case "notify-resolution": {
          const resolution = await client.query("SELECT resultado FROM resolucion_cie WHERE id_propuesta=$1", [id]);
          if (!resolution.rowCount || !["aprobada", "rechazada"].includes(propuesta.estado_actual)) {
            throw new HttpError(409, "Se requiere una resolución CIE antes de notificarla");
          }
          const sent = await client.query("SELECT 1 FROM comunicacion_institucional WHERE id_propuesta=$1 AND tipo='resolucion_cie' AND confirmada=true", [id]);
          if (sent.rowCount) { message = "La resolución ya fue notificada."; break; }
          await client.query(
            `
            INSERT INTO notificacion (
              id_usuario_destino, id_propuesta, titulo, mensaje, leida, fecha_hora
            ) VALUES ($1, $2, $3, $4, false, NOW())
            `,
            [
              propuesta.id_coordinador,
              id,
              `Resolución de ${propuesta.codigo}`,
              `Se notificó formalmente el resultado de la propuesta «${propuesta.titulo}».`,
            ],
          );
          await client.query(
            `
            INSERT INTO comunicacion_institucional (
              id_propuesta, tipo, id_emisor, id_destinatario,
              confirmada, fecha_envio, mensaje
            ) VALUES ($1, 'resolucion_cie', $2, $3, true, NOW(), $4)
            `,
            [
              id,
              userId,
              propuesta.id_coordinador,
              `Notificación de resolución de ${propuesta.codigo}`,
            ],
          );
          message =
            "Resolución notificada a la persona coordinadora y comunicación registrada.";
          break;
        }

        default:
          await client.query("ROLLBACK");
          res.status(400).json({ error: `Acción desconocida: ${action}` });
          return;
      }

      await client.query("COMMIT");

      const refreshed = await query<BandejaRow>(
        `${BANDEJA_SQL} AND p.id_propuesta = $1`,
        [id],
      );
      res.json({
        message,
        action,
        propuesta: refreshed.rows[0] ? mapBandeja(refreshed.rows[0]) : null,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      if (err instanceof HttpError) { res.status(err.status).json({ error: err.message }); return; }
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[evaluaciones]", action, detail);
      res.status(500).json({ error: "No se pudo persistir la acción" });
    } finally {
      client.release();
    }
  }),
);
