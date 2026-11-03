import official from '../../../shared/rubricas-oficiales.json';
export type RubricCriterion={id:string;sectionId:string;sectionTitle:string;sectionWeight:number;label:string;weight:number;required:boolean;aiScore:number;aiReason:string;levels:Record<string,string>;requirement?:string|null};
export type RubricSection={id:string;title:string;weight:number;criteria:Omit<RubricCriterion,'id'|'sectionId'|'sectionTitle'|'sectionWeight'>[]};
export const RUBRIC_SCORE_OPTIONS=[0,6,8,10] as const;
export function getRubricSections(modality:string):RubricSection[]{return modality==='Desarrollo tecnológico'||modality==='desarrollo_tecnologico'?official.desarrollo:modality==='Fortalecimiento'||modality==='fortalecimiento'||modality==='Actividades de fortalecimiento'?official.fortalecimiento:official.general;}
export function getRubricForModalidad(modality:string,sections=getRubricSections(modality)):RubricCriterion[]{return sections.flatMap(s=>s.criteria.map((c,i)=>({...c,id:`${s.id}-${i}`,sectionId:s.id,sectionTitle:s.title,sectionWeight:s.weight})));}
