import {apiJson} from './client';
import type {HistoricoItem} from './historico';
export type EstadoPi='pendiente'|'en_revision'|'emitido'|'no_requerido';
export const estadosPi: {valor:EstadoPi;label:string;indicador:string}[]=[
 {valor:'pendiente',label:'Pendiente de dictamen',indicador:'Pendientes de dictamen'},
 {valor:'en_revision',label:'En revisión de PI',indicador:'En revisión'},
 {valor:'emitido',label:'Dictamen emitido',indicador:'Dictámenes emitidos'},
 {valor:'no_requerido',label:'PI no requerido certificado',indicador:'No requeridos'},
];
export type ResumenVinculacion={conteos:Record<EstadoPi,number>;pendientes:HistoricoItem[];criterio:string};
export const fetchResumenVinculacion=()=>apiJson<ResumenVinculacion>('/api/vinculacion/resumen');
