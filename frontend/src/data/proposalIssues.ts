import {getFormStepStatus,type FormWizardState,FORM_WIZARD_STEPS} from './formWizardIan';
import {activityFitsProject,isValidProjectDateRange} from './dateRules';
import {dateFromInput} from './convocatoriaUi';
import {countWords,FIELD_WORD_LIMITS} from './textLimits';
export type ProposalIssue={step:number;label:string;message:string};
export function proposalIssues(step:number,f:FormWizardState,hasConvocatoria:boolean,draft=false):ProposalIssue[]{
 const out:ProposalIssue[]=[];
 const add=(label:string,message:string)=>out.push({step,label,message});
 const required=(label:string,value:string|null|undefined)=>{if(!draft&&!(value??'').trim())add(label,'Complete este campo antes de continuar.');};
 const narrative=(label:string,value:string|null|undefined,limit:number)=>{const text=value??'';required(label,text);if(countWords(text)>limit)add(label,`Contiene ${countWords(text)} palabras; admite como máximo ${limit}.`);};
 if(step===0){
  if(!f.titulo.trim())add('Nombre del proyecto','Escriba el nombre del proyecto antes de guardar.');if(f.titulo.length>500)add('Nombre del proyecto','El nombre admite hasta 500 caracteres.');
  required('Modalidad',f.modalidad);
  if(!hasConvocatoria)add('Convocatoria','Seleccione una convocatoria publicada y vigente.');
  for(const [label,value] of [['Fecha de inicio (día/mes/año)',f.inicio],['Fecha de finalización (día/mes/año)',f.fin]])if((!draft||value)&&!isValidProjectDateRange(value,value))add(label,'Indique una fecha real DD/MM/YYYY, con año entre 2000 y 2100.');
  if(f.inicio&&f.fin&&f.fin<f.inicio)add('Fecha de finalización (día/mes/año)','La finalización no puede ser anterior al inicio.');
  if(!draft&&getFormStepStatus(step,f,hasConvocatoria)!=='Completa'){
   for(const [key,value] of Object.entries(f).filter(([k])=>/^q[1-9]$/.test(k)))if(value==='')add(`Pregunta ${key.slice(1)}`,'Seleccione No o Sí y complete los datos que correspondan.');
   if(f.q1==='Sí'){required('Entidad',f.q1Entidad);required('Estado de la gestión',f.q1Estado);required('¿Existe compromiso de contrapartida institucional?',f.q1Contrapartida);}
   if(f.q2==='Sí'){required('Nombre del proyecto relacionado',f.q2Proyecto);required('Tipo de relación',f.q2Relacion);}
   if(f.q3==='Sí')required('Problema y documento de referencia',f.q3Detalle);
   if(f.q4==='Sí')required('Ámbito del instrumento a gestionar',f.q4Ambito);
   if(f.q5==='Sí')required('Nombre completo del convenio',f.q5Convenio);
   if(f.q6!==''&&f.q6!=='No'){required('Nombre de la persona candidata',f.q6Persona);required('Programa y grado académico a obtener',f.q6Programa);required('Universidad que acredita el grado',f.q6Universidad);}
   if(f.q7==='Sí')required('Tipo de información y fuente de la restricción',f.q7Detalle);
   if(f.q8==='Sí')required('Número de oficio del dictamen del Centro de Vinculación',f.q8Oficio);
   if(f.q9==='Sí')required('Tipo de innovación predominante',f.q9Tipo);
   if(f.modalidad==='Desarrollo tecnológico')required('Nivel de madurez tecnológica (TRL) esperado',f.trlEsperado);
  }
 }
 if(step===1){narrative(`Resumen (español · máximo ${FIELD_WORD_LIMITS.resumen} palabras)`,f.resumen,FIELD_WORD_LIMITS.resumen);narrative(`Abstract (English · max. ${FIELD_WORD_LIMITS.abstract} words)`,f.abstract,FIELD_WORD_LIMITS.abstract);const terms=f.palabras.split(',').map(s=>s.trim()).filter(Boolean);if((!draft||terms.length)&& (terms.length<4||terms.length>6))add('Palabras clave',`Se requieren entre 4 y 6 términos separados por comas; hay ${terms.length}.`);const en=f.keywords.split(',').map(s=>s.trim()).filter(Boolean);if(en.length&&(en.length<4||en.length>6))add('Keywords EN (opcionales)',`Indique entre 4 y 6 términos en inglés separados por comas; hay ${en.length}. También puede dejar el campo vacío.`);}
 if(step===2){
  if(!draft&&!f.teamTec.length)add('Equipo TEC','Agregue al menos una persona investigadora TEC.');
  f.teamTec.forEach((m,i)=>{for(const [label,value] of [['Nombre y apellidos',m.nombre],['ID ORCID',m.orcid],['Instancia académica',m.instancia],['Condición o rol',m.rol]])required(`${label}, persona TEC ${i+1}`,value);
   if(m.orcid&&!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(m.orcid))add(`ID ORCID, persona TEC ${i+1}`,'Use el formato ORCID 0000-0000-0000-0000 (último carácter puede ser X).');
   const [a,b]=m.periodo.split(' / ');if((!draft||m.periodo)&&(!dateFromInput(a??'')||!dateFromInput(b??'')||!isValidProjectDateRange(dateFromInput(a??'')??'',dateFromInput(b??'')??''))){add(`Inicio de nombramiento, persona TEC ${i+1}`,'Complete inicio y fin del nombramiento en DD/MM/YYYY; fin no puede ser anterior a inicio.');add(`Fin de nombramiento, persona TEC ${i+1}`,'Revise el período de nombramiento.');}
   m.horas.forEach((h,j)=>{required(`Tipo de horas ${j+1}, persona TEC ${i+1}`,h.tipo);if(h.cantidad!==''&&(!Number.isInteger(Number(h.cantidad))||Number(h.cantidad)<0)||!draft&&h.cantidad==='')add(`Cantidad de horas ${j+1}, persona TEC ${i+1}`,'Indique horas enteras, cero o mayores; no se admiten negativos ni decimales.');});
   if(m.horas.some(h=>h.tipo==='CONS'&&Number(h.cantidad)>0))required(`Titular de horas CONS, persona TEC ${i+1}`,m.titularCons??'');
  });
  f.teamExternal.forEach((m,i)=>{required(`Nombre completo, colaborador externo ${i+1}`,m.nombre);required(`ID ORCID, colaborador externo ${i+1}`,m.orcid);required(`Institución o empresa, colaborador externo ${i+1}`,m.institucion);});
 }
 if(step===3){narrative('Planteamiento del problema',f.problema,FIELD_WORD_LIMITS.problema);narrative('Objetivo general',f.objetivoGeneral,FIELD_WORD_LIMITS.objetivoGeneral);f.objetivosEspecificos.slice(0,3).forEach((o,i)=>narrative(`Objetivo específico ${i+1}`,o.descripcion,FIELD_WORD_LIMITS.objetivoEspecifico));}
 if(step===4)narrative('Estado del arte',f.estadoArte,FIELD_WORD_LIMITS.estadoArte);
 if(step===5)narrative('Metodología',f.metodologia,FIELD_WORD_LIMITS.metodologia);
 if(step===6){if(!draft&&!f.planAccion.length)add('Plan de acción','Agregue una actividad, participantes y al menos un riesgo.');f.planAccion.forEach((a,i)=>{
  required(`Descripción de la actividad ${i+1}`,a.actividad);required(`Resultado esperado, actividad ${i+1}`,a.resultadoEsperado);required(`Objetivo asociado, actividad ${i+1}`,a.objetivoNumero);
  if((!draft||a.mesInicio||a.duracionMeses)&&!activityFitsProject(Number(a.mesInicio),Number(a.duracionMeses),f.inicio,f.fin))add(`Duración en meses, actividad ${i+1}`,'La actividad debe caber en las fechas del proyecto. Inicio: mes correlativo entero; duración positiva en meses (días ÷ 30, admite decimales).');
  if(!draft&&(!a.participantes.length||a.participantes.some(p=>!p.teamMemberId||!p.responsabilidad)))add(`Participantes de actividad ${i+1}`,'Asigne una persona del equipo y su responsabilidad.');
  if(!draft&&!a.riesgos.length)add(`Riesgos de actividad ${i+1}`,'Registre al menos un riesgo por actividad.');
  a.riesgos.forEach((r,j)=>{required(`Riesgo identificado, riesgo ${j+1} de la actividad ${i+1}`,r.riesgo);required(`Medidas de mitigación, riesgo ${j+1} de la actividad ${i+1}`,r.mitigacion);required(`Responsable de la gestión del riesgo ${j+1} de la actividad ${i+1}`,r.responsable);});
 });}
 if(step===7){
  const validMoney=(value:string)=>!value.trim()||/^\d+(?:\.\d{1,2})?$/.test(value.trim())&&Number(value)<=999999999999.99;
  f.presupuestoAnual.forEach((r,i)=>{if(!validMoney(r.operativo))add(`Presupuesto operativo ${r.anio}`,'Indique un monto no negativo, máximo dos decimales y hasta ₡999 999 999 999,99.');if(!validMoney(r.duraderos)||i>0&&Number(r.duraderos)>0)add(`Presupuesto de bienes duraderos ${r.anio}`,'Revise el monto: no negativo, hasta dos decimales y solo en el primer año.');});
  f.financiamiento.forEach(source=>{if([source.anio1,source.anio2,source.anio3].some(v=>Number(v)>0))required(`Oficio y entidad emisora: ${source.tipo}`,source.oficio);});
 }
 if(step===11&&!draft){const e=f.aspectosEticos;const values=[e.seresHumanos,e.biodiversidad,e.animales,e.territoriosIndigenas];if(values.every(v=>v==='No'))required('Justificación de exención ética',e.exencionJustificacion);if(values.includes('Sí')){required('Nombre o número del comité/ente y estado del trámite del aval',e.detalleAval);if(e.entesRegulatorios.includes('otro'))required('Especifique el otro ente',e.otroEnte);if(e.territoriosIndigenas==='Sí')required('Consulta previa y consentimiento libre e informado',e.consultaConsentimiento);}}
 if(step===10)for(const [key,label] of Object.entries({divulgacionCientifica:'Divulgación científica o técnica',canalesInstitucionales:'Canales institucionales',eventosSocializacion:'Eventos de socialización',mediosMasivos:'Medios masivos'}))required(label,f.divulgacion[key as keyof typeof f.divulgacion]);
 if(step===12)for(const [key,label] of Object.entries({lineaInvestigacion:'Nombre de la línea de investigación',objetivoEstrategico:'Objetivo estratégico de largo plazo',duracionTotal:'Duración total estimada del proceso',fases:'Fases o proyectos (pasados, presente y futuros)',productosIntermedios:'Productos intermedios por fase'}))required(label,f.hojaRuta[key as keyof typeof f.hojaRuta]);
 if(step===13)narrative('Referencias',f.referencias,FIELD_WORD_LIMITS.referencias);
 if(step===14){required('Nombre completo de la persona coordinadora',f.declaracionJurada.nombreCompleto);if((!draft||f.declaracionJurada.cedula)&&!/^[1-9]-\d{4}-\d{4}$/.test(f.declaracionJurada.cedula))add('Número de cédula','Use el formato nacional X-XXXX-XXXX: nueve dígitos; el primero no puede ser cero.');if((!draft||f.declaracionJurada.firma)&&f.declaracionJurada.firma!==f.declaracionJurada.nombreCompleto)add('Firma de la persona investigadora coordinadora','La firma escrita debe coincidir con el nombre completo.');if(!draft&&!f.declaracionJurada.acepta)add('Declaración jurada','Marque la aceptación de la declaración jurada.');}
 // El estado existente contiene las precondiciones oficiales de productos, presupuesto y ética.
 if(!draft&&step<15&&!out.length&&getFormStepStatus(step,f,hasConvocatoria)!=='Completa')add(FORM_WIZARD_STEPS[step],({0:'Complete los detalles de las preguntas respondidas afirmativamente y el TRL cuando corresponda.',2:'Complete el equipo, tipos de horas y períodos de nombramiento.',7:'Complete el presupuesto anual y los oficios de las fuentes con aportes. Duraderos: solo primer año.',8:'Revise las opciones de productos y cantidades mínimas según modalidad y horas.',9:'Acepte los compromisos de resguardo aplicables.',11:'Responda las cuatro preguntas y complete la exención o los entes, avales y consentimiento aplicables.'} as Record<number,string>)[step]??'Complete los campos obligatorios de esta sección.');
 return out;
}
