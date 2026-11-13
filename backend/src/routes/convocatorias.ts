import {HttpError} from "../middleware/HttpError.js";
import { saveHitos } from "../convocatoriaHitos.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Router, type Response } from "express";
import { query, transaction } from "../db.js";
import { requireDemoAuth, requirePublisher } from "../middleware/demoAuth.js";

export const convocatoriasRouter = Router();

const ESTADOS = new Set(["borrador", "activa", "cerrada", "finalizada"]);
const MAX_PRESUPUESTO = 999_999_999_999.99;

type PresupuestoResult = {valid:true;value:number}|{valid:false;error:string};
function parsePresupuesto(value:unknown):PresupuestoResult {
 const fail=(error:string):PresupuestoResult=>({valid:false,error});
 if(value===undefined||value===null||typeof value==='string'&&!value.trim())return fail('Presupuesto indefinido: indique 0 o un monto mayor que 0.');
 if(typeof value!=='number'&&typeof value!=='string')return fail('El presupuesto debe ser numérico; use coma o punto para los decimales.');
 const text=String(value).trim().replace(',','.');
 if(typeof value==='string'&&!/^-?\d+(?:\.\d+)?$/.test(text))return fail('El presupuesto debe ser numérico; use coma o punto para los decimales.');
 const parsed=Number(text);
 if(!Number.isFinite(parsed))return fail('El presupuesto debe ser un número finito.');
 if(parsed<0)return fail('El presupuesto no puede ser negativo. Indique 0 o un monto mayor que 0.');
 if(parsed>MAX_PRESUPUESTO)return fail('El presupuesto no puede superar ₡999 999 999 999,99.');
 if((typeof value==='string'&&(text.split('.')[1]?.length??0)>2)||Number(parsed.toFixed(2))!==parsed)return fail('El presupuesto admite como máximo dos decimales.');
 return {valid:true,value:parsed};
}
function sendInvalidPresupuesto(res:Response,error:string){res.status(400).json({error});}
function todayCR(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=(t:string)=>parts.find(p=>p.type===t)!.value;return `${get('year')}-${get('month')}-${get('day')}`;}
function validarVigencia(start:string,end:string,originalOpening?:string){
 const today=todayCR();
 if(start<today&&start!==originalOpening)throw new HttpError(400,`La apertura no puede estar en el pasado. Indique ${today.split('-').reverse().join('/')} o una fecha posterior.`);
 if(end<today)throw new HttpError(400,'La convocatoria está vencida: el cierre debe ser hoy o una fecha posterior.');
}

type ConvocatoriaRow = {
  id_convocatoria: number;
  nombre: string;
  descripcion: string | null;
  fecha_apertura: string | Date;
  fecha_cierre: string | Date;
  presupuesto_estimado: string | null;
  estado: string;
  id_publicada_por: number | null;
  fecha_publicacion: string | null;
  propuestas_count: string | number;
};

type HitoRow = {
  id_hito: number;
  id_convocatoria: number;
  nombre: string;
  responsable: string;
  fecha_inicio: string | Date;
  fecha_fin: string | Date;
  orden: number;
};

function asDateOnly(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
async function lockDraft(id:number,execute:typeof query){
 const found=await execute<{estado:string}>('SELECT estado FROM convocatoria WHERE id_convocatoria=$1 FOR UPDATE',[id]);
 if(!found.rows[0])throw new HttpError(404,'Convocatoria no encontrada');
 if(found.rows[0].estado!=='borrador')throw new HttpError(409,'Solo se edita el cronograma de una convocatoria en borrador');
}

/** Regla vigente: las actividades pertenecen al período de su convocatoria. */
async function validarCronograma(id:number,execute:typeof query){
 const result=await execute<ConvocatoriaRow>('SELECT * FROM convocatoria WHERE id_convocatoria=$1',[id]);const c=result.rows[0];
 if(!c)throw new HttpError(404,'Convocatoria no encontrada');
 const start=asDateOnly(c.fecha_apertura),end=asDateOnly(c.fecha_cierre);
 const activities=await execute<HitoRow>('SELECT * FROM convocatoria_hito WHERE id_convocatoria=$1 ORDER BY orden,id_hito',[id]);
 if(!activities.rows.length)throw new HttpError(400,'Agregue al menos una actividad con nombre, responsable y fechas.');
 for(const [i,h] of activities.rows.entries()){
  const a=asDateOnly(h.fecha_inicio),b=asDateOnly(h.fecha_fin);
  if(!h.nombre.trim()||!h.responsable.trim()||!validDate(a)||!validDate(b)||b<a)throw new HttpError(400,`Actividad ${i+1}: necesita nombre, responsable y fechas coherentes.`);
  if(a<start||b<start)throw new HttpError(400,`Actividad ${i+1}: no puede comenzar ni terminar antes de la apertura de la convocatoria (${start.split('-').reverse().join('/')}).`);
  if(a>end||b>end)throw new HttpError(400,`Actividad ${i+1}: no puede comenzar ni terminar después del cierre de la convocatoria (${end.split('-').reverse().join('/')}).`);
 }
}

/** Verificar el registro efectivo dentro de la transacción antes de publicarlo. */
async function validarPublicacion(id:number,execute:typeof query){
 const result=await execute<ConvocatoriaRow>('SELECT * FROM convocatoria WHERE id_convocatoria=$1',[id]);const c=result.rows[0];
 if(!c?.nombre.trim()||c.nombre.length>200)throw new HttpError(400,'Antes de publicar, revise el nombre de la convocatoria (de 1 a 200 caracteres).');
 const start=asDateOnly(c.fecha_apertura),end=asDateOnly(c.fecha_cierre);
 if(!validDate(start)||!validDate(end)||end<start)throw new HttpError(400,'Antes de publicar, corrija la apertura y el cierre de recepción. El cierre no puede ser anterior a la apertura.');
 validarVigencia(start,end,start);
 const budget=parsePresupuesto(c.presupuesto_estimado);if(!budget.valid)throw new HttpError(400,budget.error);
 await validarCronograma(id,execute);
}

function mapConvocatoria(row: ConvocatoriaRow) {
  return {
    id: row.id_convocatoria,
    nombre: row.nombre,
    descripcion: row.descripcion,
    fechaApertura: asDateOnly(row.fecha_apertura),
    fechaCierre: asDateOnly(row.fecha_cierre),
    presupuestoEstimado: row.presupuesto_estimado
      ? Number(row.presupuesto_estimado)
      : null,
    estado: row.estado,
    idPublicadaPor: row.id_publicada_por,
    fechaPublicacion: row.fecha_publicacion,
    propuestasCount: Number(row.propuestas_count ?? 0),
  };
}

function mapHito(row: HitoRow) {
  return {
    id: row.id_hito,
    idConvocatoria: row.id_convocatoria,
    nombre: row.nombre,
    responsable: row.responsable,
    fechaInicio: asDateOnly(row.fecha_inicio),
    fechaFin: asDateOnly(row.fecha_fin),
    orden: row.orden,
  };
}

const LIST_SQL = `
  SELECT c.*,
    (SELECT COUNT(*)::int FROM propuesta p WHERE p.id_convocatoria = c.id_convocatoria) AS propuestas_count
  FROM convocatoria c
  WHERE ($1::boolean OR c.estado<>'borrador')
  ORDER BY c.fecha_apertura DESC, c.id_convocatoria DESC
`;

/** Listado — cualquier sesión demo. */
convocatoriasRouter.get(
  "/convocatorias",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const result = await query<ConvocatoriaRow>(LIST_SQL,[["vie_publicacion","admin"].includes(req.demoAuth!.role??"")]);
    res.json(result.rows.map(mapConvocatoria));
  }),
);

/** Detalle + hitos. */
convocatoriasRouter.get(
  "/convocatorias/:id",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "No se pudo identificar la convocatoria solicitada." });
      return;
    }
    const result = await query<ConvocatoriaRow>(
      `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM propuesta p WHERE p.id_convocatoria = c.id_convocatoria) AS propuestas_count
      FROM convocatoria c
      WHERE c.id_convocatoria = $1
      `,
      [id],
    );
    const row = result.rows[0];
    if (!row || row.estado==='borrador'&&!["vie_publicacion","admin"].includes(req.demoAuth!.role??"")) {
      res.status(404).json({ error: "Convocatoria no encontrada" });
      return;
    }
    const hitos = await query<HitoRow>(
      `
      SELECT * FROM convocatoria_hito
      WHERE id_convocatoria = $1
      ORDER BY orden ASC, id_hito ASC
      `,
      [id],
    );
    res.json({
      ...mapConvocatoria(row),
      hitos: hitos.rows.map(mapHito),
    });
  }),
);

/** Crear borrador o publicar. */
convocatoriasRouter.post(
  "/convocatorias",
  requireDemoAuth,
  requirePublisher,
  asyncHandler(async (req, res) => {
    const nombre = String(req.body?.nombre ?? "").trim();
    const descripcion = req.body?.descripcion
      ? String(req.body.descripcion).trim()
      : null;
    const fechaApertura = String(req.body?.fechaApertura ?? "").trim();
    const fechaCierre = String(req.body?.fechaCierre ?? "").trim();
    const presupuestoResult = parsePresupuesto(req.body?.presupuestoEstimado);
    if (!presupuestoResult.valid) {
      sendInvalidPresupuesto(res, presupuestoResult.error);
      return;
    }
    const presupuesto = presupuestoResult.value;
    let estado = String(req.body?.estado ?? "borrador").trim().toLowerCase();
    if (!ESTADOS.has(estado)) estado = "borrador";

    if (!nombre || !fechaApertura || !fechaCierre) {
      res.status(400).json({
        error: "Complete el nombre, la fecha de apertura y la fecha de cierre de recepción.",
      });
      return;
    }
    if(!validDate(fechaApertura)||!validDate(fechaCierre))throw new HttpError(400,"Fechas de convocatoria inválidas");
    if (fechaCierre < fechaApertura) {
      res.status(400).json({ error: "El cierre de recepción no puede ser anterior a la apertura." });
      return;
    }

    validarVigencia(fechaApertura,fechaCierre);
    const userId = req.demoAuth!.userId!;
    const publicar = estado === "activa";

    const created=await transaction(async execute=>{
      const inserted=await execute<ConvocatoriaRow>(`INSERT INTO convocatoria(nombre,descripcion,fecha_apertura,fecha_cierre,presupuesto_estimado,estado,id_publicada_por,fecha_publicacion) VALUES($1,$2,$3::date,$4::date,$5,$6,$7,$8) RETURNING *,0::int AS propuestas_count`,[nombre,descripcion,fechaApertura,fechaCierre,presupuesto,estado,publicar?userId:null,publicar?new Date().toISOString():null]);
      await saveHitos(inserted.rows[0].id_convocatoria,req.body?.hitos,execute);
      await validarCronograma(inserted.rows[0].id_convocatoria,execute);
      if(publicar)await validarPublicacion(inserted.rows[0].id_convocatoria,execute);
      return inserted.rows[0];
    });

    const detail = await query<ConvocatoriaRow>(
      `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM propuesta p WHERE p.id_convocatoria = c.id_convocatoria) AS propuestas_count
      FROM convocatoria c WHERE c.id_convocatoria = $1
      `,
      [created.id_convocatoria],
    );
    res.status(201).json(mapConvocatoria(detail.rows[0]));
  }),
);

/** Actualizar datos / estado (publicar, cerrar). */
convocatoriasRouter.patch(
  "/convocatorias/:id",
  requireDemoAuth,
  requirePublisher,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "No se pudo identificar la convocatoria solicitada." });
      return;
    }

    const existing = await query<{ estado: string }>(
      `SELECT estado FROM convocatoria WHERE id_convocatoria = $1`,
      [id],
    );
    if (!existing.rows[0]) {
      res.status(404).json({ error: "Convocatoria no encontrada" });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    const set = (col: string, val: unknown) => {
      fields.push(`${col} = $${i++}`);
      values.push(val);
    };

    if (req.body?.nombre !== undefined) {
      const nombre = String(req.body.nombre).trim();
      if (!nombre) {
        res.status(400).json({ error: "Escriba el nombre de la convocatoria." });
        return;
      }
      set("nombre", nombre);
    }
    if (req.body?.descripcion !== undefined) {
      set(
        "descripcion",
        req.body.descripcion === null
          ? null
          : String(req.body.descripcion).trim(),
      );
    }
    if (req.body?.fechaApertura !== undefined) {
      set("fecha_apertura", String(req.body.fechaApertura));
    }
    if (req.body?.fechaCierre !== undefined) {
      set("fecha_cierre", String(req.body.fechaCierre));
    }
    if (req.body?.presupuestoEstimado !== undefined) {
      const presupuestoResult = parsePresupuesto(req.body.presupuestoEstimado);
      if (!presupuestoResult.valid) {
        sendInvalidPresupuesto(res, presupuestoResult.error);
        return;
      }
      set("presupuesto_estimado", presupuestoResult.value);
    }
    if (req.body?.estado !== undefined) {
      const estado = String(req.body.estado).trim().toLowerCase();
      if (!ESTADOS.has(estado)) {
        res.status(400).json({ error: "El estado solicitado para la convocatoria no es válido." });
        return;
      }
      set("estado", estado);
      if (estado === "activa" && existing.rows[0].estado !== "activa") {
        set("id_publicada_por", req.demoAuth!.userId);
        set("fecha_publicacion", new Date().toISOString());
      }
    }

    if (fields.length === 0 && req.body?.hitos===undefined) {
      res.status(400).json({ error: "Sin campos para actualizar" });
      return;
    }

    const saved = await transaction(async(execute)=>{
    const locked=await execute<{estado:string;fecha_apertura:Date;fecha_cierre:Date}>("SELECT estado,fecha_apertura,fecha_cierre FROM convocatoria WHERE id_convocatoria=$1 FOR UPDATE",[id]);
    if(!locked.rows[0])throw new HttpError(404,'Convocatoria no encontrada');
    const opening=String(req.body.fechaApertura??asDateOnly(locked.rows[0].fecha_apertura));
    const closing=String(req.body.fechaCierre??asDateOnly(locked.rows[0].fecha_cierre));
    if(!validDate(opening)||!validDate(closing)||closing<opening)throw new HttpError(400,'Fechas de convocatoria incoherentes');
    if(locked.rows[0].estado!=='borrador'&&req.body.estado==='borrador')throw new HttpError(409,'Una convocatoria publicada no vuelve a borrador para eliminarse');
    if(locked.rows[0].estado!=='borrador'&&['nombre','descripcion','fechaApertura','fechaCierre','presupuestoEstimado','hitos'].some(k=>req.body[k]!==undefined))throw new HttpError(409,'Solo se editan los datos de convocatorias en borrador');
    if(fields.length){
    values.push(id);
    await execute(
      `UPDATE convocatoria SET ${fields.join(", ")} WHERE id_convocatoria = $${i}`,
      values,
    );

    }
    await saveHitos(id,req.body?.hitos,execute);
    if(['nombre','descripcion','fechaApertura','fechaCierre','presupuestoEstimado','hitos'].some(k=>req.body[k]!==undefined)){
     validarVigencia(opening,closing,asDateOnly(locked.rows[0].fecha_apertura));
     const effective=await execute<ConvocatoriaRow>('SELECT * FROM convocatoria WHERE id_convocatoria=$1',[id]);
     const budget=parsePresupuesto(effective.rows[0].presupuesto_estimado);if(!budget.valid)throw new HttpError(400,budget.error);
     await validarCronograma(id,execute);
    }
    if(req.body.estado==='activa')await validarPublicacion(id,execute);
    const result = await execute<ConvocatoriaRow>(
      `
      SELECT c.*,
        (SELECT COUNT(*)::int FROM propuesta p WHERE p.id_convocatoria = c.id_convocatoria) AS propuestas_count
      FROM convocatoria c WHERE c.id_convocatoria = $1
      `,
      [id],
    );
    return mapConvocatoria(result.rows[0]);
    });
    res.json(saved);
  }),
);

/** Borrado de borrador: nunca elimina propuestas asociadas. */
convocatoriasRouter.delete('/convocatorias/:id',requireDemoAuth,requirePublisher,asyncHandler(async(req,res)=>{
 const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)throw new HttpError(400,'ID inválido');
 await transaction(async execute=>{
  const found=await execute<{estado:string}>('SELECT estado FROM convocatoria WHERE id_convocatoria=$1 FOR UPDATE',[id]);
  if(!found.rows[0])throw new HttpError(404,'Convocatoria no encontrada');
  if(found.rows[0].estado!=='borrador')throw new HttpError(409,'Solo se pueden eliminar convocatorias en borrador');
  if((await execute('SELECT 1 FROM propuesta WHERE id_convocatoria=$1',[id])).rowCount)throw new HttpError(409,'Hay propuestas asociadas: no se puede eliminar');
  await execute('DELETE FROM convocatoria_hito WHERE id_convocatoria=$1',[id]);
  await execute('DELETE FROM convocatoria WHERE id_convocatoria=$1',[id]);
 });res.status(204).send();
}));

/** Agregar hito. */
convocatoriasRouter.post(
  "/convocatorias/:id/hitos",
  requireDemoAuth,
  requirePublisher,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const nombre = String(req.body?.nombre ?? "").trim();
    const responsable = String(req.body?.responsable ?? "VIE").trim() || "VIE";
    const fechaInicio = String(req.body?.fechaInicio ?? "").trim();
    const fechaFin = String(req.body?.fechaFin ?? "").trim();
    if (!Number.isFinite(id) || !nombre || !fechaInicio || !fechaFin) {
      res.status(400).json({
        error: "nombre, fechaInicio y fechaFin son obligatorios",
      });
      return;
    }

    if(!validDate(fechaInicio)||!validDate(fechaFin)||fechaFin<fechaInicio)throw new HttpError(400,'Fechas de actividad incoherentes');
    const saved=await transaction(async execute=>{
    await lockDraft(id,execute);
    const max = await execute<{ m: number | null }>(
      `SELECT MAX(orden) AS m FROM convocatoria_hito WHERE id_convocatoria = $1`,
      [id],
    );
    const orden =
      req.body?.orden !== undefined
        ? Number(req.body.orden)
        : (max.rows[0]?.m ?? 0) + 1;

    const result = await execute<HitoRow>(
      `
      INSERT INTO convocatoria_hito (
        id_convocatoria, nombre, responsable, fecha_inicio, fecha_fin, orden
      ) VALUES ($1, $2, $3, $4::date, $5::date, $6)
      RETURNING *
      `,
      [id, nombre, responsable, fechaInicio, fechaFin, orden],
    );
    await validarCronograma(id,execute);
    return mapHito(result.rows[0]);
    });
    res.status(201).json(saved);
  }),
);

/** Eliminar hito. */
convocatoriasRouter.delete(
  "/convocatorias/:id/hitos/:hitoId",
  requireDemoAuth,
  requirePublisher,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const hitoId = Number(req.params.hitoId);
    const result = await transaction(async execute=>{await lockDraft(id,execute);const deleted=await execute(
      `
      DELETE FROM convocatoria_hito
      WHERE id_hito = $1 AND id_convocatoria = $2
      `,
      [hitoId, id],
    );if(deleted.rowCount)await validarCronograma(id,execute);return deleted;});
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Hito no encontrado" });
      return;
    }
    res.status(204).send();
  }),
);
