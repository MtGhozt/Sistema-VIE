import type { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";
export async function savePresupuesto(id: number, body: Record<string, unknown>, execute: typeof query) {
  if (body.presupuesto !== undefined) {
    if (!Array.isArray(body.presupuesto)) throw new HttpError(400,"Presupuesto inválido");
    const years = new Set<number>();
    const start = await execute<{ fecha_inicio: string | null }>("SELECT fecha_inicio FROM propuesta WHERE id_propuesta=$1",[id]);
    const first = Number(String(body.fechaInicio || start.rows[0]?.fecha_inicio || '').slice(0,4)) || Math.min(...body.presupuesto.map(r=>Number(r.anio)));
    await execute("DELETE FROM propuesta_presupuesto_anual WHERE id_propuesta=$1",[id]);
    for (const r of body.presupuesto) {
      const year=Number(r.anio), op=Number(r.operativo), dur=Number(r.duraderos);
      if (!Number.isInteger(year) || years.has(year) || !Number.isFinite(op) || !Number.isFinite(dur) || op<0 || dur<0) throw new HttpError(400,"Año repetido o montos inválidos");
      if (dur>0 && year!==first) throw new HttpError(400,"Los bienes duraderos deben formularse para el primer año de ejecución");
      years.add(year);
      await execute("INSERT INTO propuesta_presupuesto_anual(id_propuesta,anio,monto_operativo,monto_bienes_duraderos,monto_total) VALUES($1,$2,$3,$4,$3::numeric+$4::numeric)",[id,year,op,dur]);
    }
  }
  if (body.fuentes !== undefined) {
    if (!Array.isArray(body.fuentes)) throw new HttpError(400,"Fuentes inválidas");
    await execute("DELETE FROM propuesta_financiamiento WHERE id_propuesta=$1",[id]);
    for (const r of body.fuentes) {
      if (!['externo','contrapartida','cofinanciamiento'].includes(r.tipo) || !Number.isInteger(Number(r.anio)) || !Number.isFinite(Number(r.monto)) || Number(r.monto)<0) throw new HttpError(400,"Fuente o monto inválido");
      await execute("INSERT INTO propuesta_financiamiento(id_propuesta,tipo,anio,monto,numero_oficio) VALUES($1,$2,$3,$4,$5)",[id,r.tipo,r.anio,r.monto,r.oficio||null]);
    }
  }
}
export async function loadPresupuesto(id: number, execute: typeof query) {
  const [p,f]=await Promise.all([
    execute("SELECT anio,monto_operativo::float AS operativo,monto_bienes_duraderos::float AS duraderos FROM propuesta_presupuesto_anual WHERE id_propuesta=$1 ORDER BY anio",[id]),
    execute("SELECT tipo,anio,monto::float,numero_oficio AS oficio FROM propuesta_financiamiento WHERE id_propuesta=$1 ORDER BY id_financiamiento",[id]),
  ]);
  return { presupuesto:p.rows, fuentes:f.rows };
}
