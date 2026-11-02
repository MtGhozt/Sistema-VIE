const labels:Record<string,string>={rechazo_aval:"Aval rechazado",en_subsanacion:"En subsanación",borrador:"Borrador",enviada:"Enviada",en_evaluacion:"En evaluación",dictaminada:"Dictaminada",avalada:"Avalada",aprobada:"Aprobada",rechazada:"Rechazada"};
export function labelEstado(value:string){return labels[value]??value;}
export const STAGE_LABELS=["Redacción","Vinculación / envío","Comité Técnico","Consejo de Escuela","Verificación VIE","CIE","Resolución"];
