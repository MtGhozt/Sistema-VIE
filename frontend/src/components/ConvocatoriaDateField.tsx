import {ProposalFieldErrors} from './ProposalFieldContext';
import {useRef,useContext} from 'react';
import {dateFromInput} from '../data/convocatoriaUi';

/** Texto en orden fijo DD/MM/YYYY; el calendario solo intercambia valores ISO. */
export function ConvocatoriaDateField({id,label,value,onChange,min='2000-01-01',max='2100-12-31',error,disabled=false}: {
  id:string;label:string;value:string;onChange:(value:string)=>void;
  min?:string;max?:string;error?:string;disabled?:boolean;
}) {
  const fieldErrors=useContext(ProposalFieldErrors);error=error??fieldErrors[label];
  const calendar=useRef<HTMLInputElement>(null);
  const iso=dateFromInput(value)??'';
  return <div className="field">
    <label className="field-label" htmlFor={id}>{label}</label>
    <div className="date-control">
      <input id={id} className="input" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" maxLength={10}
        value={value.replaceAll('-','/')} disabled={disabled} aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint${error?` ${id}-error`:''}`}
        onChange={e=>{const digits=e.target.value.replace(/\D/g,'').slice(0,8);onChange([digits.slice(0,2),digits.slice(2,4),digits.slice(4)].filter(Boolean).join('/'));}}/>
      <div className="calendar-picker-control">
        <button className="btn btn-secondary" type="button" disabled={disabled} aria-label={`Abrir calendario: ${label}`} onClick={()=>{try{calendar.current?.showPicker();}catch{calendar.current?.focus();}}}>Calendario</button>
        <input ref={calendar} className="calendar-picker-native" type="date" aria-label={`Seleccionar fecha en calendario: ${label}`} tabIndex={-1}
          value={iso} min={min} max={max} disabled={disabled}
          onChange={e=>{const selected=e.target.value;onChange(selected?selected.split('-').reverse().join('/'):'');}}/>
      </div>
    </div>
    <span id={`${id}-hint`} className="field-hint date-field-hint">{iso?`Seleccionado: ${iso.split('-').reverse().join('/')} (día/mes/año)`:'Formato: DD/MM/YYYY · día/mes/año'}</span>
    {error&&<span id={`${id}-error`} className="field-error-text">{error}</span>}
  </div>;
}
