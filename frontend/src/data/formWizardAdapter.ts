import type {FormWizardState as Form} from './formWizard';
import {DEFAULT_FORM_WIZARD_STATE as defaults,TECHNOLOGY_ACADEMIC_PRODUCTS,TECHNOLOGY_IP_ASSETS,type FormWizardState as Ian} from './formWizardIan';
import type {ParticipanteInput} from '../api/propuestas';
export const EXTRA_FIELDS=['formularioGenerales','formularioEquipo','formularioObjetivos','formularioPlan','formularioProductos','formularioResguardo','formularioDivulgacion','formularioEtica','formularioHojaRuta','formularioDeclaracion'] as const;
const sectionByStep:Record<number,string>={0:EXTRA_FIELDS[0],2:EXTRA_FIELDS[1],3:EXTRA_FIELDS[2],6:EXTRA_FIELDS[3],8:EXTRA_FIELDS[4],9:EXTRA_FIELDS[5],10:EXTRA_FIELDS[6],11:EXTRA_FIELDS[7],12:EXTRA_FIELDS[8],14:EXTRA_FIELDS[9]};
const memberKey=(p:ParticipanteInput,i:number)=>p.clienteId??(p.id?`participante-${p.id}`:`nuevo:${i}`);
export function toIan(f:Form):Ian {
 const extra=Object.assign({},...Object.values(f.detallesFormulario??{})) as Partial<Ian>;
 const base={...structuredClone(defaults),...extra};
 const objectives=[...new Set(f.actividades.map(a=>a.objetivo))];
 base.objetivosEspecificos=Array.from({length:Math.max(3,extra.objetivosEspecificos?.length??0,f.objetivosRegistrados.length)},(_,i)=>({id:`objetivo-${i}`,descripcion:extra.objetivosEspecificos?.[i]?.descripcion??f.objetivosRegistrados.find(o=>o.numero===i+1)?.descripcion??objectives[i]??''}));
 const oldTeam=[...(base.teamTec??[]),...(base.teamExternal??[])];
 const team=f.equipo.map((p,i)=>{
  const normalHours=p.horas.map(h=>({tipo:(String(h.tipo)==='DOC'?'DOC VIE':String(h.tipo)==='VIE-Centros'?'VIE-Centro':h.tipo) as Ian['teamTec'][number]['horas'][number]['tipo'],cantidad:String(h.cantidad)}));
  const snapshots=oldTeam.filter(m=>m.nombre===p.nombre);
  const snapshot=oldTeam.find(m=>m.participantId===p.id&&p.id!==undefined||m.id===memberKey(p,i))??(snapshots.length===1?snapshots[0]:undefined);
  // Preserve new empty controls without sending invalid hour types to the API.
  // A snapshot must agree with the structured values; stale snapshots never override them.
  const rawHours=snapshot&&'horas' in snapshot&&Array.isArray(snapshot.horas)?snapshot.horas.map(h=>({tipo:(String(h.tipo)==='DOC'?'DOC VIE':String(h.tipo)==='VIE-Centros'?'VIE-Centro':h.tipo) as Ian['teamTec'][number]['horas'][number]['tipo'],cantidad:h.cantidad==null?'':String(h.cantidad)})):undefined;
  const comparable=(hours:Ian['teamTec'][number]['horas'])=>JSON.stringify(hours.filter(h=>h.tipo||h.cantidad).map(h=>[h.tipo,Number(h.cantidad)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
  const horas=rawHours&&comparable(rawHours)===comparable(normalHours)?rawHours:normalHours;
  return {id:memberKey(p,i),participantId:p.id,nombre:p.nombre,iniciales:p.iniciales??snapshot?.iniciales??'',orcid:p.orcid??'',instancia:p.instancia??'',institucion:p.instancia??'',rol:(p.rol??'') as Ian['teamTec'][number]['rol'],periodo:p.periodo??'',titularCons:p.titularCons??'',horas};
 });
 const firstYear=Number(f.inicio.slice(0,4))||f.presupuesto[0]?.anio||2027;
 const years=[...new Set([...Array.from({length:3},(_,i)=>firstYear+i),...f.presupuesto.map(p=>p.anio)])].sort((a,b)=>a-b);
 return {...base,titulo:f.titulo,modalidad:f.modalidad,inicio:f.inicio,fin:f.fin,escuela:f.escuela,resumen:f.resumen,palabras:f.palabras,keywords:f.keywordsEn,abstract:f.abstract,
 ...Object.fromEntries(Array.from({length:8},(_,i)=>[`q${i+1}`,f[`q${i+1}` as keyof Form]])),q2Proyecto:f.q2Proyecto,q2Relacion:f.q2Relacion,q3Detalle:f.q3Detalle,trlEsperado:f.trlEsperado?`TRL ${f.trlEsperado}` as Ian['trlEsperado']:'',
 teamTec:team.filter((_,i)=>f.equipo[i].tipo==='funcionario_tec'),teamExternal:team.filter((_,i)=>f.equipo[i].tipo==='externo'),
 problema:f.problema,objetivoGeneral:f.objetivos,estadoArte:f.estadoArte,metodologia:f.metodologia,referencias:f.referencias,
 planAccion:f.actividades.map((a,i)=>({id:a.id!=null?`actividad-${a.id}`:`actividad-nueva-${i}`,activityId:a.id,objetivoNumero:String(Math.max(0,base.objetivosEspecificos.findIndex(o=>o.descripcion===a.objetivo))+1) as '1',actividad:a.actividad,resultadoEsperado:a.resultado,mesInicio:String(a.inicio),duracionMeses:String(a.duracion),riesgos:a.riesgos.map((r,j)=>({...r,id:`riesgo-${i}-${j}`})),participantes:a.participantes.map((id,j)=>({id:`asignacion-${i}-${j}`,teamMemberId:typeof id==='string'?id:memberKey(f.equipo.find(p=>p.id===id)??{id} as ParticipanteInput,f.equipo.findIndex(p=>p.id===id)),responsabilidad:(a.asignaciones?.find(p=>p.idParticipante===id)?.responsabilidad??a.responsabilidad) as 'Ejecuta'}))})),
 presupuestoAnual:years.map(anio=>{const p=f.presupuesto.find(p=>p.anio===anio);return {anio,operativo:String(p?.operativo??0),duraderos:String(p?.duraderos??0)};}),
 financiamiento:base.financiamiento.map(s=>({...s,...Object.fromEntries(years.slice(0,3).map((anio,i)=>[`anio${i+1}`,String(f.fuentes.find(v=>v.tipo===s.tipo&&v.anio===anio)?.monto??0)])),oficio:f.fuentes.find(v=>v.tipo===s.tipo)?.oficio??s.oficio})),
 productosAcademicos:f.compromisos.filter(p=>!['adicional','activo_pi'].includes(p.ambito)).map((p,i)=>({id:`academico-${i}`,codigoOpcion:p.codigo as 'opcion_1',cantidad:String(p.cantidad),objetivoNumero:base.productosAcademicos[i]?.objetivoNumero??''})),
 activosPI:f.compromisos.filter(p=>p.ambito==='activo_pi').map((p,i)=>({id:`activo-${i}`,codigoOpcion:p.codigo as 'activo_1',cantidad:String(p.cantidad),dictamen:p.dictamen??''})),
 productosAdicionales:f.compromisos.filter(p=>p.ambito==='adicional').map((p,i)=>({id:`adicional-${i}`,descripcion:p.descripcion})),
 divulgacion:extra.divulgacion??{...base.divulgacion,divulgacionCientifica:f.divulgacion},hojaRuta:extra.hojaRuta??{...base.hojaRuta,lineaInvestigacion:f.hojaRuta},
 aspectosEticos:{...base.aspectosEticos,entesRegulatorios:f.permisos.map(p=>p.ente),detalleAval:extra.aspectosEticos?.detalleAval??f.permisos[0]?.detalle??'',seresHumanos:f.aspectosEticos.humanos?'Sí':'No',biodiversidad:f.aspectosEticos.biodiversidad?'Sí':'No',animales:f.aspectosEticos.animales?'Sí':'No',territoriosIndigenas:f.aspectosEticos.indigenas?'Sí':'No',exencionJustificacion:f.aspectosEticos.exencion},
 resguardoProductos:{...base.resguardoProductos,depositoRepositorio:f.resguardoRepositorio?'Sí':'No',entregaRespaldoSoftware:f.resguardoTecnico?'Sí':'No'},declaracionJurada:{nombreCompleto:'',cedula:'',firma:'',...base.declaracionJurada,acepta:f.declaracion}};
}
export function applyIan(f:Form,partial:Partial<Ian>,step:number):Partial<Form> {
 const previous=toIan(f),n={...previous,...partial};const out:Partial<Form>={};
 const extras={...f.detallesFormulario};if(sectionByStep[step])extras[sectionByStep[step]]={...extras[sectionByStep[step]],...partial};out.detallesFormulario=extras;
 const direct={titulo:'titulo',modalidad:'modalidad',inicio:'inicio',fin:'fin',resumen:'resumen',palabras:'palabras',keywords:'keywordsEn',abstract:'abstract',problema:'problema',objetivoGeneral:'objetivos',estadoArte:'estadoArte',metodologia:'metodologia',referencias:'referencias',q1:'q1',q2:'q2',q3:'q3',q4:'q4',q5:'q5',q6:'q6',q7:'q7',q8:'q8',q2Proyecto:'q2Proyecto',q2Relacion:'q2Relacion',q3Detalle:'q3Detalle'} as const;
 for(const [key,target] of Object.entries(direct))if(key in partial)Object.assign(out,{[target]:n[key as keyof Ian]});
 if('trlEsperado' in partial){out.trlEsperado=Number(n.trlEsperado.replace('TRL ',''))||null;out.trlActual=out.trlEsperado;}
 if('teamTec' in partial||'teamExternal' in partial){out.equipo=[...n.teamTec.map(p=>({...p,tipo:'funcionario_tec' as const})),...n.teamExternal.map(p=>({...p,tipo:'externo' as const}))].map(p=>{const old=f.equipo.find((v,i)=>memberKey(v,i)===p.id);return {...old,id:p.participantId,clienteId:p.id,tipo:p.tipo,nombre:p.nombre,iniciales:p.iniciales,orcid:p.orcid,instancia:p.tipo==='externo'?('institucion'in p?p.institucion:''):('instancia'in p?p.instancia:''),rol:'rol'in p?p.rol:null,periodo:'periodo'in p?p.periodo:null,titularCons:'titularCons'in p?p.titularCons:null,horas:'horas'in p?p.horas.filter(h=>h.tipo||h.cantidad).map(h=>({tipo:h.tipo==='DOC VIE'?'DOC':h.tipo==='VIE-Centro'?'VIE-Centros':h.tipo,cantidad:Number(h.cantidad)})):[]};});}
 if('planAccion'in partial||'objetivosEspecificos'in partial){out.actividades=n.planAccion.map(a=>({id:a.activityId,objetivo:n.objetivosEspecificos[Number(a.objetivoNumero)-1]?.descripcion??'',actividad:a.actividad,resultado:a.resultadoEsperado,inicio:Number(a.mesInicio),duracion:Number(a.duracionMeses),responsabilidad:a.participantes[0]?.responsabilidad??'',participantes:a.participantes.map(p=>p.teamMemberId),asignaciones:a.participantes.map(p=>({idParticipante:p.teamMemberId,responsabilidad:p.responsabilidad})),riesgos:a.riesgos.map(({riesgo,mitigacion,responsable})=>({riesgo,mitigacion,responsable}))}));}
 if('presupuestoAnual'in partial)out.presupuesto=n.presupuestoAnual.filter(p=>p.operativo||p.duraderos).map(p=>({anio:p.anio,operativo:Number(p.operativo||0),duraderos:Number(p.duraderos||0)}));
 if('financiamiento'in partial)out.fuentes=n.financiamiento.flatMap(s=>n.presupuestoAnual.map((p,i)=>({tipo:s.tipo,anio:p.anio,monto:Number(s[`anio${i+1}` as 'anio1']||0),oficio:s.oficio||null}))).filter(p=>p.monto>0);
 if('productosAcademicos'in partial||'activosPI'in partial||'productosAdicionales'in partial)out.compromisos=[...n.productosAcademicos.map(p=>({ambito:n.modalidad==='Desarrollo tecnológico'?'desarrollo_tecnologico':'basica_aplicada',codigo:p.codigoOpcion,descripcion:TECHNOLOGY_ACADEMIC_PRODUCTS.find(o=>o.value===p.codigoOpcion)?.label??'',cantidad:Number(p.cantidad),dictamen:null})),...n.activosPI.map(p=>({ambito:'activo_pi',codigo:p.codigoOpcion,descripcion:TECHNOLOGY_IP_ASSETS.find(o=>o.value===p.codigoOpcion)?.label??'',cantidad:Number(p.cantidad),dictamen:p.dictamen})),...n.productosAdicionales.map((p,i)=>({ambito:'adicional',codigo:`adicional_${i+1}`,descripcion:p.descripcion,cantidad:1,dictamen:null}))];
 if('resguardoProductos'in partial){out.resguardoRepositorio=n.resguardoProductos.depositoRepositorio==='Sí';out.resguardoTecnico=n.resguardoProductos.entregaRespaldoSoftware==='Sí';}
 if('declaracionJurada'in partial)out.declaracion=n.declaracionJurada.acepta;
 if('divulgacion'in partial)out.divulgacion=Object.entries(n.divulgacion).map(([k,v])=>`${k}: ${v}`).join('\n');
 if('hojaRuta'in partial)out.hojaRuta=Object.entries(n.hojaRuta).map(([k,v])=>`${k}: ${v}`).join('\n');
 if('aspectosEticos'in partial){const e=n.aspectosEticos;out.aspectosEticos={humanos:e.seresHumanos==='Sí',biodiversidad:e.biodiversidad==='Sí',animales:e.animales==='Sí',indigenas:e.territoriosIndigenas==='Sí',exencion:e.exencionJustificacion};out.permisos=e.entesRegulatorios.map(ente=>({ente,detalle:ente==='otro'?e.otroEnte:e.detalleAval,estado:f.permisos.find(p=>p.ente===ente)?.estado??'pendiente'}));}
 return out;
}
