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
}: Props) {
  const shown = value ? formatDateEsCR(value) : "";
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <input
        id={id}
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
      <span className="field-hint date-field-hint">
        {shown
          ? `Seleccionado: ${shown} (día/mes/año)`
          : `Formato: día/mes/año · años ${DATE_YEAR_MIN}–${DATE_YEAR_MAX}`}
      </span>
    </label>
  );
}
