import type { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";
const TIPOS_HORA = new Set(["VIE", "VIE-Centros", "CONS", "REC", "DOC", "VIESA"]);
export async function saveEquipo(id: number, raw: unknown, execute: typeof query) {
  const memberIds=new Map<string,number>();
  if (raw === undefined) {const rows=await execute<{id_participante:number}>("SELECT id_participante FROM propuesta_participante WHERE id_propuesta=$1",[id]);for(const p of rows.rows)memberIds.set(`participante-${p.id_participante}`,p.id_participante);return memberIds;}
  if (!Array.isArray(raw)) throw new HttpError(400, "Equipo inválido");
  const retained: number[] = [];
  for (const row of raw) {
    if (!row || !["funcionario_tec", "externo"].includes(row.tipo)) throw new HttpError(400, "Tipo de participante inválido");
    let nombre = String(row.nombre ?? "").trim(), instancia = String(row.instancia ?? "").trim();
    const userId = row.idUsuario ? Number(row.idUsuario) : null;
    if (userId) {
      const user = await execute<{ nombre: string; escuela: string }>("SELECT u.nombre_completo AS nombre, e.nombre AS escuela FROM usuario u LEFT JOIN escuela e ON e.id_escuela=u.id_escuela WHERE u.id_usuario=$1 AND u.activo=true", [userId]);
      if (!user.rows[0] || row.tipo !== "funcionario_tec") throw new HttpError(400, "Persona TEC inválida");
      nombre = user.rows[0].nombre; instancia = user.rows[0].escuela ?? instancia;
    }
    if(nombre.length>150||instancia.length>200)throw new HttpError(400,'Nombre o institución excede el límite de 150/200 caracteres.');
    validarNombramiento(row.periodo);
    if(row.iniciales!==undefined&&(typeof row.iniciales!=='string'||row.iniciales.length>10))throw new HttpError(400,'Las iniciales admiten hasta 10 caracteres.');
    if (!nombre) throw new HttpError(400, "Cada participante requiere un nombre");
    const values = [nombre, row.orcid || null, instancia || null, row.rol || null, row.periodo || null, row.tipo, userId];
    let participant: number;
    if (row.id) {
      const updated = await execute<{ id_participante: number }>(`UPDATE propuesta_participante SET nombre_completo=$1,orcid=$2,instancia_o_institucion=$3,rol_en_proyecto=$4,periodo_nombramiento=$5,tipo=$6,id_usuario=$7 WHERE id_participante=$8 AND id_propuesta=$9 RETURNING id_participante`, [...values, row.id, id]);
      if (!updated.rows[0]) throw new HttpError(400, "Participante ajeno a la propuesta");
      participant = updated.rows[0].id_participante;
    } else {
      const inserted = await execute<{ id_participante: number }>(`INSERT INTO propuesta_participante(nombre_completo,orcid,instancia_o_institucion,rol_en_proyecto,periodo_nombramiento,tipo,id_usuario,id_propuesta) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_participante`, [...values, id]);
      participant = inserted.rows[0].id_participante;
    }
    await execute("UPDATE propuesta_participante SET titular_cons=$2 WHERE id_participante=$1",[participant,String(row.titularCons??'').trim().slice(0,150)||null]);
    if(row.clienteId){if(typeof row.clienteId!=="string"||memberIds.has(row.clienteId))throw new HttpError(400,"Identificador de equipo repetido o inválido");memberIds.set(row.clienteId,participant);}
    memberIds.set(`participante-${participant}`,participant);
    retained.push(participant);
    if (!Array.isArray(row.horas)) throw new HttpError(400, "Horas inválidas");
    const kinds = new Set<string>();
    await execute("DELETE FROM propuesta_participante_hora WHERE id_participante=$1", [participant]);
    for (const h of row.horas) {
      if (!TIPOS_HORA.has(h.tipo) || kinds.has(h.tipo) || !Number.isInteger(Number(h.cantidad)) || Number(h.cantidad) < 0) throw new HttpError(400, "Tipo/cantidad de horas inválidos o repetidos: indique horas enteras no negativas");
      kinds.add(h.tipo);
      await execute("INSERT INTO propuesta_participante_hora(id_participante,tipo_hora,cantidad_horas) VALUES($1,$2,$3)", [participant,h.tipo,h.cantidad]);
    }
  }
  const removed = await execute<{ id_participante: number }>("SELECT id_participante FROM propuesta_participante WHERE id_propuesta=$1 AND NOT(id_participante=ANY($2::int[]))", [id,retained]);
  for (const p of removed.rows) {
    const used = await execute("SELECT 1 FROM actividad_participante WHERE id_participante=$1", [p.id_participante]);
    if (used.rowCount) throw new HttpError(409, "Quite primero la asignación de actividades de la persona que desea eliminar");
    await execute("DELETE FROM propuesta_participante_hora WHERE id_participante=$1", [p.id_participante]);
    await execute("DELETE FROM propuesta_participante WHERE id_participante=$1", [p.id_participante]);
  }
  return memberIds;
}
export async function loadEquipo(id: number, execute: typeof query) {
  const result = await execute<{id:number;idUsuario:number|null;nombre:string;orcid:string|null;instancia:string|null;rol:string|null;periodo:string|null;tipo:string;titularCons:string|null;horas:{tipo:string;cantidad:number}[]}>(`SELECT p.id_participante AS id, p.id_usuario AS "idUsuario",p.nombre_completo AS nombre,p.orcid,p.instancia_o_institucion AS instancia,p.rol_en_proyecto AS rol,p.periodo_nombramiento AS periodo,p.tipo,p.titular_cons AS "titularCons",
    COALESCE((SELECT json_agg(json_build_object('tipo',h.tipo_hora,'cantidad',h.cantidad_horas::float) ORDER BY h.tipo_hora) FROM propuesta_participante_hora h WHERE h.id_participante=p.id_participante),'[]') AS horas
    FROM propuesta_participante p WHERE p.id_propuesta=$1 ORDER BY p.id_participante`, [id]);
  const metadata=await execute<{equipo:{teamTec?:Record<string,unknown>[];teamExternal?:Record<string,unknown>[]} | null}>("SELECT formulario_detalle->'formularioEquipo' AS equipo FROM propuesta WHERE id_propuesta=$1",[id]);
  const extra=metadata.rows[0]?.equipo;
  const snapshots=[...(Array.isArray(extra?.teamTec)?extra.teamTec:[]),...(Array.isArray(extra?.teamExternal)?extra.teamExternal:[])];
  return result.rows.map(p=>{
    const stable=snapshots.find(m=>Number(m.participantId)===p.id||m.id===`participante-${p.id}`);
    const sameName=snapshots.filter(m=>m.nombre===p.nombre);
    return {...p,iniciales:String(stable?.iniciales??(sameName.length===1?sameName[0].iniciales:'')??'')};
  });
}

/** El borrador admite ausencia de período; al avanzar/enviar debe estar completo. */
export function validarNombramiento(value:unknown,required=false){
 const period=String(value??'').trim();
 if(!period&&!required)return;
 if(!period.includes(' / ')&&!required)return; // Texto histórico: se conserva hasta su actualización.
 const dates=period.split(' / ').map(v=>{const m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?`${m[3]}-${m[2]}-${m[1]}`:'';});
 const [a,b]=dates;
 if(dates.length!==2||!a||!b||[a,b].some(v=>v<'2000-01-01'||v>'2100-12-31'||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)||b<a)throw new HttpError(400,'Período de nombramiento: indique inicio y fin reales en DD/MM/YYYY, con año entre 2000 y 2100 y fin igual o posterior al inicio.');
}
