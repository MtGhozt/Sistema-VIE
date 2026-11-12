import {HttpError} from './middleware/HttpError.js';
/** Topes técnicos del prototipo; solo resumen=500 es un tope literal de palabras oficial. */
export function validarTextosPropuesta(body:Record<string,unknown>){
 const words:Record<string,number>={resumen:500,abstractEn:500,problema:500,objetivoGeneral:200,estadoArte:1000,metodologia:500,referencias:1000};
 for(const [key,max] of Object.entries(words))if(typeof body[key]==='string'&&String(body[key]).trim().split(/\s+/u).filter(Boolean).length>max)throw new HttpError(400,`${key}: supera el límite del formulario de ${max} palabras.`);
 for(const key of ['hojaRuta','divulgacion'])if(typeof body[key]==='string'&&String(body[key]).length>30000)throw new HttpError(400,`${key}: supera el límite de 30000 caracteres para el conjunto de la sección.`);
}
export function horizonteProyecto(start:string,end:string){
 const a=Date.parse(start+'T12:00:00Z'),b=Date.parse(end+'T12:00:00Z');
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)return 0;
 return Math.min(36,Number((((b-a)/86400000+1)/30).toFixed(2)));
}
