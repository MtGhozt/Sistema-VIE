import {HttpError} from './middleware/HttpError.js';
/** Cada complemento pertenece a una sección autorizable en subsanación. */
export const camposComplementarios:Record<string,string[]>={
 formularioGenerales:['titulo','modalidad','inicio','fin','q1','q1Entidad','q1Estado','q1Contrapartida','q2','q2Proyecto','q2Relacion','q3','q3Detalle','q4','q4Ambito','q5','q5Convenio','q6','q6Persona','q6Programa','q6Universidad','q7','q7Detalle','q8','q8Oficio','q9','q9Tipo','trlEsperado'],
 formularioEquipo:['teamTec','teamExternal'],
 formularioObjetivos:['problema','objetivoGeneral','objetivosEspecificos'],
 formularioPlan:['planAccion'],formularioProductos:['productosAcademicos','activosPI','productosAdicionales'],
 formularioResguardo:['resguardoProductos'],formularioDivulgacion:['divulgacion'],
 formularioEtica:['aspectosEticos'],formularioHojaRuta:['hojaRuta'],formularioDeclaracion:['declaracionJurada'],
};
export function validarComplemento(name:string,value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify(value).length>100000)throw new HttpError(400,'Detalle de formulario inválido o demasiado extenso');
 if(Object.keys(value).some(key=>!camposComplementarios[name]?.includes(key)))throw new HttpError(400,'El campo no pertenece a esa sección del formulario');
 function visit(v:unknown,depth:number){
  if(depth>8)throw new HttpError(400,'Detalle de formulario demasiado anidado');
  if(v===null||typeof v==='boolean'||typeof v==='number')return;
  if(typeof v==='string'){if(v.length>20000)throw new HttpError(400,'Texto complementario demasiado extenso');return;}
  if(typeof v!=='object'||Object.keys(v).length>200)throw new HttpError(400,'Detalle complementario inválido');
  for(const [key,child] of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(key))throw new HttpError(400,'Clave complementaria inválida');visit(child,depth+1);}
 }
 visit(value,0);
 const raw=value as Record<string,unknown>;
 if(name==='formularioEquipo')for(const key of ['teamTec','teamExternal'])if(raw[key]!==undefined&&(!Array.isArray(raw[key])||(raw[key] as unknown[]).some(m=>!m||typeof m!=='object'||('iniciales'in m&&(typeof m.iniciales!=='string'||m.iniciales.length>10)))))throw new HttpError(400,'Equipo de investigación: registros o iniciales inválidos (máximo 10 caracteres).');
 if(name==='formularioDeclaracion'){
  const d=raw.declaracionJurada as {cedula?:string}|undefined;
  if(d?.cedula&&!/^[1-9]-\d{4}-\d{4}$/.test(d.cedula))throw new HttpError(400,'Número de cédula: use X-XXXX-XXXX, nueve dígitos y primer dígito distinto de cero.');
 }
 if(['formularioDivulgacion','formularioHojaRuta','formularioEtica'].includes(name)){
  const visitBounded=(v:unknown)=>{if(typeof v==='string'&&v.length>5000)throw new HttpError(400,'Cada campo de divulgación, hoja de ruta o ética admite hasta 5000 caracteres.');if(v&&typeof v==='object')Object.values(v).forEach(visitBounded);};visitBounded(value);
 }
 if(name==='formularioObjetivos'&&Array.isArray(raw.objetivosEspecificos)&&raw.objetivosEspecificos.some((o:{descripcion?:string})=>String(o.descripcion??'').trim().split(/\s+/u).filter(Boolean).length>120))throw new HttpError(400,'Cada objetivo específico admite hasta 120 palabras en el formulario.');
}
