import piLimits from "../../../shared/pi-text-limits.json" with { type: "json" };
import { alcancePropuestas, exigirAlcance, etapaRol } from "../alcancePropuestas.js";
import { seccionesSubsanacion } from "../subsanacion.js";
import { readFileSync } from "node:fs";
import { saveRubric, loadRubric, proposalRubric, committeeStatus, assignCommittee, productRequirements } from "../rubricas.js";
import { generateEvaluacionIA, loadEvaluacionIA } from "../iaEvaluacion.js";
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
  rechazo_aval: "Aval rechazado",
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
  modalidad: string;modalidad_nombre:string|null;
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
    p.modalidad,mc.nombre AS modalidad_nombre,
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
  LEFT JOIN modalidad_catalogo mc ON mc.codigo=p.modalidad
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
    modalidadLabel: row.modalidad_nombre ?? MODALIDAD_LABEL[row.modalidad] ?? row.modalidad,
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
  "committee-confirm": new Set(["comite_asistente", "admin"]),
  "request-reconsideration": new Set(["investigador"]),
  "council-reconsider": new Set(["consejo", "admin"]),
  "pi-start":new Set(["vinculacion","admin"]),
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
        // Solo expedientes consolidados; incluye rechazo de aval para su reconsideración.
        sql: ` AND p.etapa_flujo BETWEEN 3 AND 4 AND p.estado_actual IN ('dictaminada','avalada','rechazo_aval')`,
        params: [],
      };
    case "gestora_vie":
      return {
        sql: ` AND p.etapa_flujo = 4 AND p.estado_actual='avalada'`,
        params: [],
      };
    case "cie":
      return {
        sql: ` AND p.etapa_flujo = 5 AND p.estado_actual='avalada' AND p.estado_actual NOT IN ('aprobada', 'rechazada')`,
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
    if(authenticatedRole==='comite_evaluador'){scope.params.push(req.demoAuth!.userId);scope.sql+=` AND EXISTS(SELECT 1 FROM comite_miembro cm WHERE cm.id_propuesta=p.id_propuesta AND cm.id_usuario=$${clause.params.length+scope.params.length})`;}

    const requestedProposal=String(req.query.propuesta??'').trim();
    if(requestedProposal.length>120)throw new HttpError(400,'La referencia del expediente es demasiado extensa.');
    const params=[...clause.params,...scope.params];
    let requestedOrder='';
    if(requestedProposal){params.push(requestedProposal);requestedOrder=`CASE WHEN p.id_propuesta::text=$${params.length} OR p.codigo=$${params.length} THEN 0 ELSE 1 END,`;}
    const result = await query<BandejaRow>(
      `${BANDEJA_SQL}${clause.sql} AND ${scope.sql}
       ORDER BY ${requestedOrder} p.fecha_envio DESC NULLS LAST, p.id_propuesta DESC
       LIMIT 100`,
      params,
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
  if(!roleOk(req.demoAuth!.role,"pi")&&req.demoAuth!.role!=="comite_asistente"){res.status(403).json({error:"Sin permiso para consultar el dictamen"});return;}
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1){res.status(400).json({error:"ID inválido"});return;}
  await exigirAlcance(id,req.demoAuth!);
  const proposal=await loadPropuesta(id);
  if(!proposal){res.status(404).json({error:"Propuesta no encontrada"});return;}
  const row=await query("SELECT * FROM dictamen_pi WHERE id_propuesta=$1",[id]);
  const raw=row.rows[0];
  const d=req.demoAuth!.role==="comite_asistente"&&raw?.estado!=="emitido"?undefined:raw;
  const certification=(await query("SELECT * FROM pi_certificacion_no_requerido WHERE id_propuesta=$1",[id])).rows[0];
  const inReview=(await query("SELECT 1 FROM revision_expediente WHERE id_propuesta=$1 AND etapa='pi' AND resultado='en_revision'",[id])).rowCount;
  res.json({emitidoEn:d?.emitido_en??null,enRevision:Boolean(inReview),estado:proposal.requiere_dictamen_pi?d?.estado??null:certification?"no_requerido":null,fundamentoNoRequerido:certification?.fundamento??null,certificadoPor:certification?.id_certificador??null,fecha:certification?.fecha_certificacion??d?.fecha_dictamen??null,form:d?{
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
  const p=await query<{modalidad:string;ciclo_evaluacion:number}>("SELECT modalidad,ciclo_evaluacion FROM propuesta WHERE id_propuesta=$1",[id]);
  if(!p.rows[0]){res.status(404).json({error:"Propuesta no encontrada"});return;}
  const instance=role==='cie'?'cie':role==='admin'&&req.query.instancia==='cie'?'cie':'comite';
  const rubric=await proposalRubric(pool,id,p.rows[0].modalidad);
  const evaluation=(await query("SELECT estado,productos_cumplen,productos_verificados FROM evaluacion WHERE id_propuesta=$1 AND id_evaluador=$2 AND instancia=$3 AND id_rubrica=$4 AND ciclo=$5",[id,req.demoAuth!.userId,instance,rubric.id_rubrica,p.rows[0].ciclo_evaluacion])).rows[0];
  const assigned=instance!=="comite"||!!(await query("SELECT 1 FROM comite_miembro WHERE id_propuesta=$1 AND id_usuario=$2",[id,req.demoAuth!.userId])).rowCount;
  const ciclo=p.rows[0].ciclo_evaluacion;
  res.json({ciclo,asignado:assigned,scores:await loadRubric(pool,id,req.demoAuth!.userId!,instance,p.rows[0].modalidad,ciclo),productosVerificados:evaluation?.productos_verificados??false,productos:await productRequirements(pool,id,p.rows[0].modalidad),sections:rubric.definicion,version:rubric.codigo,estado:evaluation?.estado??null,productosCumplen:evaluation?.productos_cumplen??false});
}));

/** Verifica que la persona pueda operar la sugerencia de IA del Comité. */
async function exigirEvaluadorComiteIA(id: number, auth: { userId: number | null; role: string | null }) {
  await exigirAlcance(id, auth);
  if (auth.role === "admin") return;
  if (auth.role !== "comite_evaluador") {
    throw new HttpError(403, "Solo las personas evaluadoras del Comité pueden consultar la sugerencia de IA");
  }
  const assigned = await query(
    "SELECT 1 FROM comite_miembro WHERE id_propuesta=$1 AND id_usuario=$2",
    [id, auth.userId],
  );
  if (!assigned.rowCount) throw new HttpError(403, "No está asignado como evaluador de este Comité");
}

/** Sugerencia de IA vigente para el ciclo y la rúbrica del expediente. */
evaluacionesRouter.get("/evaluaciones/propuestas/:id/ia", requireDemoAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "ID inválido" }); return; }
  await exigirEvaluadorComiteIA(id, req.demoAuth!);
  const p = await query<{ modalidad: string; ciclo_evaluacion: number }>(
    "SELECT modalidad, ciclo_evaluacion FROM propuesta WHERE id_propuesta=$1",
    [id],
  );
  if (!p.rows[0]) { res.status(404).json({ error: "Propuesta no encontrada" }); return; }
  const rubric = await proposalRubric(pool, id, p.rows[0].modalidad);
  res.json({
    evaluacion: await loadEvaluacionIA(id, rubric.id_rubrica, p.rows[0].ciclo_evaluacion),
  });
}));

/** Genera o regenera la sugerencia de IA; nunca escribe la nota humana. */
evaluacionesRouter.post("/evaluaciones/propuestas/:id/ia", requireDemoAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "ID inválido" }); return; }
  await exigirEvaluadorComiteIA(id, req.demoAuth!);
  if ((await query("SELECT 1 FROM resultado_comite WHERE id_propuesta=$1", [id])).rowCount) {
    throw new HttpError(409, "El dictamen del Comité ya está cerrado; no se regenera la sugerencia de IA");
  }
  const evaluacion = await generateEvaluacionIA(id, req.demoAuth!.userId!);
  res.status(201).json({ evaluacion });
}));

evaluacionesRouter.get('/evaluaciones/propuestas/:id/reconsideracion',requireDemoAuth,asyncHandler(async(req,res)=>{const id=Number(req.params.id);await exigirAlcance(id,req.demoAuth!);if(!['consejo','admin'].includes(req.demoAuth!.role!))throw new HttpError(403,'Solo el Consejo revisa la solicitud');res.json((await query('SELECT motivo,fecha_solicitud FROM reconsideracion_aval WHERE id_propuesta=$1 AND fecha_autorizacion IS NULL ORDER BY fecha_solicitud DESC',[id])).rows);}));

evaluacionesRouter.get('/evaluaciones/propuestas/:id/comite/candidatos',requireDemoAuth,asyncHandler(async(req,res)=>{
 const id=Number(req.params.id);await exigirAlcance(id,req.demoAuth!);if(!['comite_asistente','admin'].includes(req.demoAuth!.role!))throw new HttpError(403,'Solo asistencia del Comité o admin gestiona sus miembros');
 res.json((await query("SELECT u.id_usuario,u.nombre_completo FROM usuario u JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario JOIN rol r ON r.id_rol=ur.id_rol JOIN propuesta p ON p.id_escuela=u.id_escuela WHERE p.id_propuesta=$1 AND u.activo=true AND r.codigo='comite_evaluador' ORDER BY u.nombre_completo",[id])).rows);
}));
evaluacionesRouter.post('/evaluaciones/propuestas/:id/comite/reemplazo',requireDemoAuth,asyncHandler(async(req,res)=>{
 const id=Number(req.params.id);if(!['comite_asistente','admin'].includes(req.demoAuth!.role!))throw new HttpError(403,'Solo asistencia del Comité o admin gestiona sus miembros');await exigirAlcance(id,req.demoAuth!);
 const anterior=Number(req.body.idAnterior),nuevo=Number(req.body.idNuevo),motivo=String(req.body.motivo??'').trim();
 if(!Number.isSafeInteger(anterior)||!Number.isSafeInteger(nuevo)||!motivo||anterior===nuevo)throw new HttpError(400,'Indique evaluador anterior, sustituto y motivo');
 const client=await pool.connect();try{await client.query('BEGIN');const prop=(await client.query('SELECT * FROM propuesta WHERE id_propuesta=$1 FOR UPDATE',[id])).rows[0];
 if(prop.etapa_flujo!==2||prop.estado_actual!=='en_evaluacion'||(await client.query('SELECT 1 FROM resultado_comite WHERE id_propuesta=$1',[id])).rowCount)throw new HttpError(409,'No se puede modificar un Comité con dictamen cerrado o fuera de su etapa');
 if(!(await client.query('SELECT 1 FROM comite_miembro WHERE id_propuesta=$1 AND id_usuario=$2',[id,anterior])).rowCount)throw new HttpError(404,'La persona anterior no está asignada');
 if((await client.query("SELECT 1 FROM evaluacion WHERE id_propuesta=$1 AND id_evaluador=$2 AND instancia='comite' AND id_rubrica=$3 AND ciclo=$4 AND estado='completada'",[id,anterior,prop.id_rubrica_actual,prop.ciclo_evaluacion])).rowCount)throw new HttpError(409,'No se sustituye una evaluación individual ya entregada');
 if(!(await client.query("SELECT 1 FROM usuario u JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario JOIN rol r ON r.id_rol=ur.id_rol WHERE u.id_usuario=$1 AND u.id_escuela=$2 AND u.activo=true AND r.codigo='comite_evaluador'",[nuevo,prop.id_escuela])).rowCount)throw new HttpError(400,'El sustituto debe ser un evaluador activo de la escuela');
 await client.query('DELETE FROM comite_miembro WHERE id_propuesta=$1 AND id_usuario=$2',[id,anterior]);await client.query('INSERT INTO comite_miembro VALUES($1,$2)',[id,nuevo]);
 await client.query("INSERT INTO auditoria_operacion(id_usuario,accion,entidad,id_entidad,motivo,datos) VALUES($1,'sustituir','comite_miembro',$2,$3,$4::jsonb)",[req.demoAuth!.userId,id,motivo,JSON.stringify({idAnterior:anterior,idNuevo:nuevo})]);
 await client.query('COMMIT');res.json({message:'Evaluador sustituido; sus borradores anteriores se conservan sin contarlos en el consolidado'});
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}));

evaluacionesRouter.get('/evaluaciones/propuestas/:id/comite',requireDemoAuth,asyncHandler(async(req,res)=>{
 const id=Number(req.params.id);await exigirAlcance(id,req.demoAuth!);
 if(!['comite_asistente','comite_evaluador','admin'].includes(req.demoAuth!.role!))throw new HttpError(403,'La consolidación pertenece al Comité');
 const ciclo=(await query('SELECT ciclo_evaluacion FROM propuesta WHERE id_propuesta=$1',[id])).rows[0].ciclo_evaluacion;const anteriores=(await query("SELECT e.ciclo,u.nombre_completo,e.estado,e.puntaje_total FROM evaluacion e JOIN usuario u ON u.id_usuario=e.id_evaluador WHERE e.id_propuesta=$1 AND e.instancia='comite' AND e.ciclo<$2 ORDER BY e.ciclo,e.id_evaluador",[id,ciclo])).rows;res.json({ciclo,anteriores,miembros:await committeeStatus(pool,id),confirmado:!!(await query('SELECT 1 FROM resultado_comite WHERE id_propuesta=$1',[id])).rowCount});
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
      if(propuesta.estado_actual==='rechazo_aval'&&!['request-reconsideration','council-reconsider'].includes(action))throw new HttpError(409,'Aval rechazado: solicite y autorice un nuevo ciclo en el Consejo');
      const decisions=await client.query("SELECT 1 FROM aval_consejo WHERE id_propuesta=$1 AND resultado IN ('rechaza','rechazado') UNION ALL SELECT 1 FROM resolucion_cie WHERE id_propuesta=$1 AND resultado='rechazada'",[id]);
      if(decisions.rowCount && !["notify-resolution","request-reconsideration","council-reconsider"].includes(action)) throw new HttpError(409,"Existe un rechazo previo; su reapertura requiere la excepción del equipo (D09)");
      const pi=await client.query("SELECT * FROM dictamen_pi WHERE id_propuesta=$1",[id]);
      const piRecord=pi.rows[0];
      const certification=(await client.query("SELECT * FROM pi_certificacion_no_requerido WHERE id_propuesta=$1",[id])).rows[0];
      if((action==="pi"&&piRecord&&["emitido","no_requerido"].includes(piRecord.estado)) || (action==="pi-not-required"&&certification)) throw new HttpError(409,"El dictamen o certificación PI está cerrado; no puede sobrescribirse");
      const advances=new Set(["committee-ready","committee-score","committee-confirm","send-council","council-approve","council-reject","communicate-aval","send-cie","cie-approve","cie-reject"]);
      if(advances.has(action)) {
        const valid=locked.rows[0].requiere_dictamen_pi
          ? piRecord?.estado==="emitido" && piRecord.id_emisor && piRecord.fecha_dictamen
          : certification && String(certification.fundamento??"").trim() && certification.id_certificador && certification.fecha_certificacion;
        if(!valid) throw new HttpError(409,locked.rows[0].requiere_dictamen_pi?"Se requiere dictamen PI emitido antes de avanzar":"Falta certificar PI no requerido con fundamento y responsable");
      }
      const ranges:Record<string,[number,number]>={"pi-start":[1,5],pi:[1,5],"pi-not-required":[1,5],"committee-confirm":[2,2],"committee-ready":[1,2],"committee-score":[1,2],"send-council":[2,3],"council-approve":[3,3],"council-reject":[3,3],"communicate-aval":[3,4],"vie-checklist":[4,4],"vie-observation":[4,4],"send-cie":[4,4],"cie-approve":[5,5],"cie-reject":[5,5]};
      const range=ranges[action];
      if(range&&(propuesta.etapa_flujo<range[0]||propuesta.etapa_flujo>range[1])) throw new HttpError(409,"La acción no corresponde a la instancia actual del expediente");
      const instance=role==="cie" || role==="admin"&&payload.instancia==="cie"?"cie":"comite";
      if(action==="save-rubric"&&propuesta.etapa_flujo!==(instance==="cie"?5:2)) throw new HttpError(409,"La evaluación no corresponde a la instancia actual");
      if((action==="committee-score"||action==="save-rubric"&&instance==="comite")&&(await client.query("SELECT 1 FROM resultado_comite WHERE id_propuesta=$1",[id])).rowCount) throw new HttpError(409,"El dictamen del Comité está cerrado; no puede sobrescribirse");

      if(['council-approve','council-reject','send-council'].includes(action)&&!(await client.query('SELECT 1 FROM resultado_comite WHERE id_propuesta=$1',[id])).rowCount)throw new HttpError(409,'El Comité debe confirmar su dictamen consolidado');
      if(['send-cie','cie-approve','cie-reject'].includes(action)){
        if(!(await client.query("SELECT 1 FROM aval_consejo WHERE id_propuesta=$1 AND resultado IN ('aprueba','aprobado')",[id])).rowCount)throw new HttpError(409,'Se requiere aval aprobado del Consejo');
        if(!(await client.query("SELECT 1 FROM comunicacion_institucional WHERE id_propuesta=$1 AND tipo='aval_consejo'",[id])).rowCount)throw new HttpError(409,'El aval debe comunicarse a VIE');
      }
      if(['cie-approve','cie-reject'].includes(action)&&!(await client.query("SELECT 1 FROM propuesta_historial_estado WHERE id_propuesta=$1 AND estado_nuevo='avalada' AND observacion='Expediente remitido al CIE'",[id])).rowCount)throw new HttpError(409,'VIE debe remitir formalmente el expediente al CIE');
      const adminStage=action==="return"?(payload.instancia==="vie"?4:2):action==="pi"||action==="pi-not-required"?1:action.startsWith("committee")?2:action.startsWith("council")||action==="communicate-aval"||action==="send-council"?3:action.startsWith("vie")||action==="send-cie"?4:action.startsWith("cie")?5:action==="notify-resolution"?6:propuesta.etapa_flujo;
      const actorStage=role==="admin"?adminStage:etapaRol(role);
      await client.query("SELECT set_config('vie.etapa_evento',$1,true)",[String(actorStage)]);
      let message = "Acción registrada";
      const prev = propuesta.estado_actual;

      switch (action) {
        case "pi-not-required": {
          if(locked.rows[0].requiere_dictamen_pi) throw new HttpError(409,"La propuesta requiere dictamen PI; no puede omitirse");
          const fundamento=str(payload.fundamento);
          if(fundamento.length>piLimits.fundamento)throw new HttpError(400,`El fundamento admite como máximo ${piLimits.fundamento} caracteres`);
          if(!fundamento) throw new HttpError(400,"El fundamento de PI no requerido es obligatorio");
          await client.query("INSERT INTO pi_certificacion_no_requerido(id_propuesta,id_certificador,fundamento) VALUES($1,$2,$3)",[id,userId,fundamento]);
          await advanceEstado(client,{idPropuesta:id,estadoAnterior:prev,estadoNuevo:propuesta.etapa_flujo<=1?"en_evaluacion":prev,etapa:Math.max(propuesta.etapa_flujo,2),userId,observacion:"PI no requerido: certificación registrada por Vinculación"});
          await client.query("UPDATE revision_expediente SET resultado='completo',fecha_fin=NOW() WHERE id_propuesta=$1 AND etapa='pi' AND resultado='en_revision'",[id]);
          message="PI no requerido certificado con fundamento, fecha y responsable.";
          break;
        }
        case 'pi-start': {
          if(certification||piRecord?.estado==='emitido'||piRecord?.estado==='no_requerido')throw new HttpError(409,'El registro PI está cerrado; no puede reabrirse.');
          const existing=await client.query("SELECT 1 FROM revision_expediente WHERE id_propuesta=$1 AND etapa='pi' AND resultado='en_revision'",[id]);
          if(!existing.rowCount)await client.query("INSERT INTO revision_expediente(id_propuesta,etapa,ciclo,id_revisor,resultado,fecha_inicio) SELECT $1,'pi',COALESCE(MAX(ciclo),0)+1,$2,'en_revision',NOW() FROM revision_expediente WHERE id_propuesta=$1 AND etapa='pi'",[id,userId]);
          message='Revisión de PI iniciada. No se ha emitido dictamen ni certificado el no requerimiento.';break;
        }
        case "pi": {
          if(!locked.rows[0].requiere_dictamen_pi) throw new HttpError(409,"Registre la certificación explícita de PI no requerido");
          if (!["Sí","No"].includes(str(payload.potencial)) || !["Sí","No"].includes(str(payload.innovacion))) throw new HttpError(400,"Indique potencial de protección e innovación del dictamen");
          const fieldNames:Record<string,string>={tipoActivo:"Resultado o activo identificable",tipoPI:"Mecanismo de PI considerado",novedad:"Novedad",titularidad:"Titularidad",divulgacion:"Recomendaciones antes de divulgación pública",confidencialidad:"Confidencialidad",analisis:"Análisis técnico",recomendaciones:"Recomendaciones del Centro de Vinculación"};
          for(const [key,limit] of Object.entries(piLimits)) {
            if(key!=="fundamento"&&String(payload[key]??"").length>limit)throw new HttpError(400,`El campo «${fieldNames[key]??key}» admite como máximo ${limit} caracteres`);
          }
          const emission=(await client.query("SELECT clock_timestamp() AS instante, to_char(clock_timestamp() AT TIME ZONE 'America/Costa_Rica','YYYY') AS anio")).rows[0];
          const oficio=`CV-${emission.anio}-${String(id).padStart(3,"0")}`;
          const fecha=emission.instante;
          await client.query(
            `
            INSERT INTO dictamen_pi (
              id_propuesta, id_emisor, potencial_proteccion, es_innovador,
              activo_identificable, mecanismo_pi, novedad, titularidad,
              recomendaciones_divulgacion, confidencialidad, analisis_tecnico,
              recomendaciones_vinculacion, numero_oficio, fecha_dictamen, emitido_en, estado
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, ($14::timestamptz AT TIME ZONE 'America/Costa_Rica')::date, $14::timestamptz, 'emitido'
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
              emitido_en = EXCLUDED.emitido_en,
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
          await client.query("UPDATE revision_expediente SET resultado='completo',fecha_fin=NOW() WHERE id_propuesta=$1 AND etapa='pi' AND resultado='en_revision'",[id]);
          message = "Dictamen de PI emitido y oficio agregado al expediente.";
          break;
        }

        case "committee-ready": {
          await assignCommittee(client,id,propuesta.id_escuela);
          await proposalRubric(client,id,locked.rows[0].modalidad);

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
          if(instancia==='comite')await client.query('UPDATE propuesta SET ciclo_evaluacion=ciclo_evaluacion+1 WHERE id_propuesta=$1',[id]);
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
          await saveRubric(client,id,userId,"comite",locked.rows[0].modalidad,payload,true);
          message="Evaluación individual entregada. Falta confirmación del consolidado por la asistencia.";
          break;
        }
        case "committee-confirm": {
          const members=await committeeStatus(client,id);
          if(members.length!==3||members.some(m=>m.estado!=='completada'))throw new HttpError(409,'Deben estar entregadas las tres evaluaciones independientes');
          const fundamento=str(payload.texto);
          if(!fundamento)throw new HttpError(400,'Fundamente la confirmación del dictamen consolidado');
          if((await client.query('SELECT 1 FROM resultado_comite WHERE id_propuesta=$1',[id])).rowCount)throw new HttpError(409,'El dictamen consolidado ya está cerrado');
          const average=Math.round(members.reduce((n,m)=>n+Number(m.puntaje_total),0)/members.length*100)/100;
          const failed=(await client.query(`SELECT 1 FROM evaluacion e JOIN evaluacion_puntaje ep ON ep.id_evaluacion=e.id_evaluacion JOIN rubrica_criterio rc ON rc.id_criterio=ep.id_criterio JOIN propuesta p ON p.id_propuesta=e.id_propuesta WHERE e.id_propuesta=$1 AND e.instancia='comite' AND e.id_rubrica=p.id_rubrica_actual AND e.ciclo=p.ciclo_evaluacion AND e.estado='completada' AND EXISTS(SELECT 1 FROM comite_miembro cm WHERE cm.id_propuesta=e.id_propuesta AND cm.id_usuario=e.id_evaluador) AND rc.es_obligatorio AND ep.puntaje<=6 LIMIT 1`,[id])).rowCount;
          const recommendation=average>=70&&!failed&&members.every(m=>m.productos_cumplen)?'recomienda':'no_recomienda';
          await client.query(`INSERT INTO resultado_comite(id_propuesta,recomendacion,calificacion_promedio,numero_oficio,fundamento,fecha_dictamen,id_coordinador_comite) VALUES($1,$2,$3,$4,$5,CURRENT_DATE,$6)`,[id,recommendation,average,`CT-${id}`,fundamento,userId]);
          await advanceEstado(client,{idPropuesta:id,estadoAnterior:prev,estadoNuevo:'dictaminada',etapa:3,userId,observacion:`Dictamen consolidado confirmado: ${recommendation}`});
          message='Dictamen consolidado confirmado. La recomendación informa al Consejo; no es resolución CIE.';
          break;
        }
        case 'request-reconsideration': {
          if(prev!=='rechazo_aval'||propuesta.id_coordinador!==userId)throw new HttpError(409,'Solo la coordinación puede solicitar reconsideración de su aval rechazado');
          const texto=str(payload.texto);if(!texto)throw new HttpError(400,'Justifique la solicitud de reconsideración');
          await client.query('INSERT INTO reconsideracion_aval(id_propuesta,id_solicitante,motivo) VALUES($1,$2,$3)',[id,userId,texto]);
          message='Reconsideración solicitada al Consejo; el rechazo continúa vigente.';break;
        }
        case 'council-reconsider': {
          if(prev!=='rechazo_aval')throw new HttpError(409,'Solo puede iniciar otro ciclo desde un aval rechazado');
          const texto=str(payload.texto);if(!texto)throw new HttpError(400,'Fundamente la autorización de un nuevo ciclo');
          const request=(await client.query('SELECT * FROM reconsideracion_aval WHERE id_propuesta=$1 AND fecha_autorizacion IS NULL',[id])).rows[0];
          if(!request)throw new HttpError(409,'Falta solicitud de la coordinación');
          const aval=(await client.query('SELECT * FROM aval_consejo WHERE id_propuesta=$1',[id])).rows[0];
          await client.query(`INSERT INTO auditoria_operacion(id_usuario,accion,entidad,id_entidad,motivo,datos) VALUES($1,'reconsiderar','aval_consejo',$2,$3,$4::jsonb)`,[userId,id,texto,JSON.stringify({aval,solicitud:request})]);
          await client.query('UPDATE reconsideracion_aval SET id_autorizador=$2,fundamento=$3,fecha_autorizacion=NOW() WHERE id_reconsideracion=$1',[request.id_reconsideracion,userId,texto]);
          await client.query('DELETE FROM aval_consejo WHERE id_propuesta=$1',[id]);
          await client.query(`INSERT INTO revision_expediente(id_propuesta,etapa,ciclo,id_revisor,resultado,fecha_inicio) SELECT $1,'consejo',COALESCE(MAX(ciclo),0)+1,$2,'en_revision',NOW() FROM revision_expediente WHERE id_propuesta=$1 AND etapa='consejo'`,[id,userId]);
          await advanceEstado(client,{idPropuesta:id,estadoAnterior:prev,estadoNuevo:'dictaminada',etapa:3,userId,observacion:'Nuevo ciclo de Consejo autorizado: '+texto});
          message='Nuevo ciclo del Consejo iniciado; la decisión anterior se conserva en auditoría.';break;
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
            estadoNuevo: aprueba ? "avalada" : "rechazo_aval",
            etapa: aprueba ? 4 : 3,
            userId,
            observacion: aprueba
              ? `Aval aprobado (${oficio})`
              : `Aval rechazado (${oficio}): ${texto.slice(0, 200)}`,
          });
          if(!aprueba){
            await client.query("INSERT INTO notificacion(id_usuario_destino,id_propuesta,titulo,mensaje,leida,fecha_hora) VALUES($1,$2,'Aval rechazado por el Consejo',$3,false,NOW())",[propuesta.id_coordinador,id,texto]);
            await client.query("INSERT INTO comunicacion_institucional(id_propuesta,tipo,id_emisor,id_destinatario,confirmada,fecha_envio,mensaje) VALUES($1,'rechazo_aval',$2,$3,true,NOW(),$4)",[id,userId,propuesta.id_coordinador,texto]);
          }
          message = aprueba
            ? "Aval aprobado y número de oficio registrado."
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
          const fundamento=str(payload.texto)||str(payload.fundamento);
          if(!fundamento)throw new HttpError(400,'El fundamento de la resolución es obligatorio');
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
