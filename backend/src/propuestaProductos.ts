import type { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";
export async function saveProductos(id:number,raw:unknown,execute:typeof query){
  if(raw===undefined)return;
  if(!Array.isArray(raw))throw new HttpError(400,"Compromisos inválidos");
  const retained:number[]=[];
  for(const r of raw){
    if(!['basica_aplicada','desarrollo_tecnologico','adicional','activo_pi'].includes(r.ambito)||!String(r.codigo??'').trim()||!String(r.descripcion??'').trim()||!Number.isInteger(Number(r.cantidad))||Number(r.cantidad)<1)throw new HttpError(400,"Indique ámbito, opción, descripción y cantidad positiva del producto");
    const values=[r.ambito,r.codigo,r.descripcion,r.cantidad,r.dictamen||null];
    if(r.id){
      const updated=await execute<{id_producto:number}>("UPDATE propuesta_producto SET ambito=$1,codigo_opcion=$2,descripcion=$3,cantidad=$4,dictamen_consecutivo=$5 WHERE id_producto=$6 AND id_propuesta=$7 RETURNING id_producto",[...values,r.id,id]);
      if(!updated.rows[0])throw new HttpError(400,"Producto ajeno a la propuesta");
      retained.push(updated.rows[0].id_producto);
    }else{
      const inserted=await execute<{id_producto:number}>("INSERT INTO propuesta_producto(ambito,codigo_opcion,descripcion,cantidad,dictamen_consecutivo,id_propuesta) VALUES($1,$2,$3,$4,$5,$6) RETURNING id_producto",[...values,id]);retained.push(inserted.rows[0].id_producto);
    }
  }
  await execute("DELETE FROM propuesta_producto WHERE id_propuesta=$1 AND NOT(id_producto=ANY($2::int[]))",[id,retained]);
}
export async function loadProductos(id:number,execute:typeof query){
  return (await execute("SELECT id_producto AS id,ambito,codigo_opcion AS codigo,descripcion,cantidad,dictamen_consecutivo AS dictamen FROM propuesta_producto WHERE id_propuesta=$1 ORDER BY id_producto",[id])).rows;
}
