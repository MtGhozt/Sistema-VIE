import type { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";
const money=(v:number)=>Number.isFinite(v)&&v>=0&&v<=999999999999.99&&Number(v.toFixed(2))===v;
export async function savePresupuesto(id: number, body: Record<string, unknown>, execute: typeof query) {
  if (body.presupuesto !== undefined) {
    if (!Array.isArray(body.presupuesto)) throw new HttpError(400,"Presupuesto inválido");
    const years = new Set<number>();
    const start = await execute<{ anio: number | null }>("SELECT EXTRACT(YEAR FROM fecha_inicio)::int AS anio FROM propuesta WHERE id_propuesta=$1",[id]);
    const first = (body.fechaInicio ? Number(String(body.fechaInicio).slice(0,4)) : start.rows[0]?.anio) || Math.min(...body.presupuesto.map(r=>Number(r.anio)));
    await execute("DELETE FROM propuesta_presupuesto_anual WHERE id_propuesta=$1",[id]);
    let total = 0;
    for (const r of body.presupuesto) {
      const year=Number(r.anio), op=Number(r.operativo), dur=Number(r.duraderos);
      if (!Number.isInteger(year) || years.has(year) || !money(op)||!money(dur)) throw new HttpError(400,"Presupuesto: año repetido o montos inválidos (no se permiten valores negativos, más de dos decimales ni montos superiores a ₡999 999 999 999,99)");
      if (dur>0 && year!==first) throw new HttpError(400,"Los bienes duraderos deben formularse para el primer año de ejecución");
      years.add(year);
      total += op + dur;
      await execute("INSERT INTO propuesta_presupuesto_anual(id_propuesta,anio,monto_operativo,monto_bienes_duraderos,monto_total) VALUES($1,$2,$3,$4,$3::numeric+$4::numeric)",[id,year,op,dur]);
    }
    if (body.presupuesto.length > 0 && total <= 0) {
      throw new HttpError(400, "El presupuesto total debe ser mayor que cero. Una partida puede ser 0, pero no todas.");
    }
  }
  if (body.fuentes !== undefined) {
    if (!Array.isArray(body.fuentes)) throw new HttpError(400,"Fuentes inválidas");
    await execute("DELETE FROM propuesta_financiamiento WHERE id_propuesta=$1",[id]);
    for (const r of body.fuentes) {
      if (!['externo','contrapartida','cofinanciamiento'].includes(r.tipo) || !Number.isInteger(Number(r.anio)) || !money(Number(r.monto))) throw new HttpError(400,"Fuente o monto inválido");
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
