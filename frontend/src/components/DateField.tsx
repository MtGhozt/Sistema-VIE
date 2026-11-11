import {useId,useRef} from "react";
import { formatDateEsCR, DATE_YEAR_MAX, DATE_YEAR_MIN } from "../data/dateRules";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  error?:string;
  calendarButton?:boolean;
};

/**
 * Fecha con valor ISO (yyyy-mm-dd) y pista visible en día/mes/año (es-CR).
 * El control nativo respeta el locale del navegador; la pista fija el criterio.
 */
export function DateField({
  id,
  label,
  value,
  onChange,
  min = `${DATE_YEAR_MIN}-01-01`,
  max = `${DATE_YEAR_MAX}-12-31`,
  disabled = false,
  required = false,
  error,
  calendarButton=false,
}: Props) {
  const generatedId=useId();
  const controlId=id??generatedId;
  const calendar=useRef<HTMLInputElement>(null);
  const shown = value ? formatDateEsCR(value) : "";
  return (
    <label className="field" htmlFor={controlId}>
      <span className="field-label">{label}</span>
      <div className="date-control">
      <input
        ref={calendar}
        id={controlId}
        aria-invalid={Boolean(error)}
        aria-describedby={`${controlId}-hint${error?` ${controlId}-error`:""}`}
        lang="es-CR"
        aria-label={label}
        type="date"
        className="input"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
      {calendarButton&&<button type="button" className="btn btn-secondary" disabled={disabled} aria-label={`Abrir calendario: ${label}`} onClick={()=>{const input=calendar.current;if(!input)return;input.focus();try{input.showPicker?.();}catch{/* El control nativo conserva su selector de calendario. */}}}>Calendario</button>}
      </div>
      <span id={controlId+'-hint'} className="field-hint date-field-hint">
        {shown
          ? `Seleccionado: ${shown} (día/mes/año)`
          : `Formato: día/mes/año · años ${DATE_YEAR_MIN}–${DATE_YEAR_MAX}`}
      </span>
      {error&&<span id={controlId+'-error'} className="field-error-text">{error}</span>}
    </label>
  );
}
