/** Editor de ítems del formulario; los requisitos se validan también en el servidor. */
export function EditableRows<T extends object>({ title, rows, fields, blank, onChange }: {
  title: string; rows: T[]; fields: { key: keyof T; label: string; type?: "number"; options?: string[]; optionLabels?:Record<string,string> }[];
  blank: () => T; onChange: (rows: T[]) => void;
}) {
  return <div className="stack-md"><h3>{title}</h3>
    {rows.map((row,index)=><fieldset className="card stack-md" key={index}><legend>{title} · {index+1}</legend>
      <div className="form-grid two-col">{fields.map(f=><label key={String(f.key)} className="field"><span className="field-label">{f.label}</span>
        {f.options ? <select className="input" value={String(row[f.key]??'')} onChange={e=>onChange(rows.map((r,i)=>i===index?{...r,[f.key]:e.target.value}:r))}>{f.options.map(o=><option key={o} value={o}>{f.optionLabels?.[o]??o}</option>)}</select>
        : <input className="input" type={f.type??'text'} step={f.type==='number'?'any':undefined} value={(row[f.key]??'') as string|number} onChange={e=>onChange(rows.map((r,i)=>i===index?{...r,[f.key]:f.type==='number'?Number(e.target.value):e.target.value}:r))}/>}
      </label>)}</div>
      <button type="button" className="btn btn-secondary" aria-label={`Quitar ${title} ${index + 1}`} onClick={()=>onChange(rows.filter((_,i)=>i!==index))}>Quitar ítem</button>
    </fieldset>)}
    <button type="button" className="btn btn-secondary" onClick={()=>onChange([...rows,blank()])}>Agregar ítem · {title}</button>
  </div>;
}
