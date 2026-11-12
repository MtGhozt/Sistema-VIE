import {useContext,useId,type InputHTMLAttributes,type SelectHTMLAttributes,type TextareaHTMLAttributes} from 'react';
import {WordBudget} from './WordBudget';
import {countWords,FIELD_WORD_LIMITS} from '../data/textLimits';
import {ProposalReadOnly,ProposalFieldErrors} from "./ProposalFieldContext";
function useError(label:unknown,id?:string){const generated=useId();const errors=useContext(ProposalFieldErrors);return {id:id??generated,error:typeof label==='string'?errors[label]:undefined};}
export function FormInput(props:InputHTMLAttributes<HTMLInputElement>){const readonly=useContext(ProposalReadOnly);const {id,error}=useError(props['aria-label'],props.id);return <><input {...props} readOnly={readonly||props.readOnly} disabled={props.disabled||(readonly&&["radio","checkbox"].includes(props.type??""))} id={id} aria-invalid={Boolean(error)||props['aria-invalid']} aria-describedby={[props['aria-describedby'],error?`${id}-error`:''].filter(Boolean).join(' ')||undefined}/>{error&&<span id={`${id}-error`} className="field-error-text">{error}</span>}</>;}
export function FormSelect(props:SelectHTMLAttributes<HTMLSelectElement>){const readonly=useContext(ProposalReadOnly);const {id,error}=useError(props['aria-label'],props.id);return <><select {...props} disabled={readonly||props.disabled} id={id} aria-invalid={Boolean(error)||props['aria-invalid']} aria-describedby={error?`${id}-error`:props['aria-describedby']}/>{error&&<span id={`${id}-error`} className="field-error-text">{error}</span>}</>;}
export function LimitedTextarea(props:TextareaHTMLAttributes<HTMLTextAreaElement>){
 const readonly=useContext(ProposalReadOnly);const {id,error}=useError(props['aria-label'],props.id);const hint=props['aria-describedby']??'';
 const key=hint.includes('wb-resumen')?'resumen':hint.includes('wb-abstract')?'abstract':hint.includes('wb-problema')?'problema':hint.includes('wb-objetivo-general')?'objetivoGeneral':hint.includes('wb-obj-')?'objetivoEspecifico':hint.includes('wb-estado-arte')?'estadoArte':hint.includes('wb-metodologia')?'metodologia':hint.includes('wb-referencias')?'referencias':null;
 const maxWords=key?FIELD_WORD_LIMITS[key]:undefined;const maxLength=props.maxLength??20000;const ownCounter=!key;
 return <><textarea {...props} readOnly={readonly||props.readOnly} id={id} maxLength={maxLength} aria-invalid={Boolean(error)||props['aria-invalid']} aria-describedby={[hint,ownCounter?`${id}-budget`:'',error?`${id}-error`:''].filter(Boolean).join(' ')||undefined}
 onChange={e=>{if(maxWords&&countWords(e.target.value)>maxWords)return;props.onChange?.(e);}}/>
 {ownCounter&&<WordBudget id={`${id}-budget`} value={String(props.value??'')} maxWords={maxLength} unit="caracteres"/>}
 {error&&<span id={`${id}-error`} className="field-error-text">{error}</span>}</>;
}
