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
}
