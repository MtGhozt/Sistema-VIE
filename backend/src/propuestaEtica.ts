import type { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";
export async function saveEtica(id: number, body: Record<string, unknown>, execute: typeof query) {
  if (body.aspectosEticos !== undefined) {
    const value = body.aspectosEticos as Record<string, unknown>;
    if (!value || ['humanos','biodiversidad','animales','indigenas'].some(k=>typeof value[k] !== 'boolean')) throw new HttpError(400,"Declaración ética inválida");
    if(String(value.exencion??'').length>5000)throw new HttpError(400,'Justificación de exención ética: máximo 5000 caracteres.');
    await execute(`INSERT INTO aspecto_etico(id_propuesta,involucra_humanos,involucra_biodiversidad,involucra_animales,involucra_pueblos_indigenas,justificacion_exencion)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id_propuesta) DO UPDATE SET involucra_humanos=EXCLUDED.involucra_humanos,involucra_biodiversidad=EXCLUDED.involucra_biodiversidad,involucra_animales=EXCLUDED.involucra_animales,involucra_pueblos_indigenas=EXCLUDED.involucra_pueblos_indigenas,justificacion_exencion=EXCLUDED.justificacion_exencion`,
      [id,value.humanos,value.biodiversidad,value.animales,value.indigenas,String(value.exencion??'')]);
  }
  if (body.permisos !== undefined) {
    if (!Array.isArray(body.permisos)) throw new HttpError(400,"Permisos inválidos");
    await execute("DELETE FROM permiso_etico WHERE id_propuesta=$1",[id]);
    for (const r of body.permisos) {
      if (!String(r.ente??'').trim() || !String(r.estado??'').trim()) throw new HttpError(400,"Indique el ente y estado del permiso");
      if(String(r.detalle??'').length>5000)throw new HttpError(400,'Detalle del aval ético: máximo 5000 caracteres.');
      await execute("INSERT INTO permiso_etico(id_propuesta,ente,detalle,estado_tramite) VALUES($1,$2,$3,$4)",[id,r.ente,r.detalle??'',r.estado]);
    }
  }
}
export async function loadEtica(id: number, execute: typeof query) {
  const [value,permits] = await Promise.all([
    execute("SELECT involucra_humanos AS humanos,involucra_biodiversidad AS biodiversidad,involucra_animales AS animales,involucra_pueblos_indigenas AS indigenas,COALESCE(justificacion_exencion,'') AS exencion FROM aspecto_etico WHERE id_propuesta=$1",[id]),
    execute("SELECT ente,detalle,estado_tramite AS estado FROM permiso_etico WHERE id_propuesta=$1 ORDER BY id_permiso",[id]),
  ]);
  return { aspectosEticos:value.rows[0]??null, permisos:permits.rows };
}
