import type { Convocatoria, ConvocatoriaDetalle } from '../api/convocatorias';
export function dateLabel(iso: string | null | undefined) { const m = iso?.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : '—'; }
export function dateFromInput(text: string) { const m = text.trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/); if (!m)
    return null; const iso = `${m[3]}-${m[2]}-${m[1]}`; const d = new Date(iso + 'T12:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : null; }
export function todayCR(date = new Date()) { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date); const get = (t: string) => parts.find(p => p.type === t)?.value; return `${get('year')}-${get('month')}-${get('day')}`; }
export function closingSoon(c: Convocatoria, date = new Date()) { const start = todayCR(date); const end = new Date(start + 'T12:00:00Z'); end.setUTCDate(end.getUTCDate() + 30); return c.estado === 'activa' && c.fechaCierre >= start && c.fechaCierre <= end.toISOString().slice(0, 10); }
export function timestampLabel(value: string) { const date = new Date(value); if (!Number.isFinite(date.getTime()))
    return 'Fecha no disponible'; const p = new Intl.DateTimeFormat('es-CR', { timeZone: 'America/Costa_Rica', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date); const get = (t: string) => p.find(v => v.type === t)?.value; return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}`; }
export const estadoLabel = (s: string) => ({ borrador: 'Borrador', activa: 'Publicada', cerrada: 'Cerrada', finalizada: 'Finalizada' }[s] ?? s);
export type ScheduleDraft = {
    id?: number;
    key: string;
    nombre: string;
    responsable: string;
    inicio: string;
    fin: string;
};
export type ConvDraft = {
    nombre: string;
    descripcion: string;
    apertura: string;
    cierre: string;
    presupuesto: string;
    hitos: ScheduleDraft[];
};
export type FieldIssue = {
    field: string;
    label: string;
    message: string;
};
export const newActivity = (): ScheduleDraft => ({ key: crypto.randomUUID(), nombre: '', responsable: '', inicio: '', fin: '' });
export const emptyDraft = (): ConvDraft => ({ nombre: '', descripcion: '', apertura: '', cierre: '', presupuesto: '', hitos: [newActivity()] });
export function fromDetail(d: ConvocatoriaDetalle): ConvDraft { return { nombre: d.nombre, descripcion: d.descripcion ?? '', apertura: dateLabel(d.fechaApertura), cierre: dateLabel(d.fechaCierre), presupuesto: d.presupuestoEstimado === null ? '' : String(d.presupuestoEstimado), hitos: d.hitos.map(h => ({ id: h.id, key: crypto.randomUUID(), nombre: h.nombre, responsable: h.responsable, inicio: dateLabel(h.fechaInicio), fin: dateLabel(h.fechaFin) })) }; }
export function validateDraft(f: ConvDraft) {
    const issues: FieldIssue[] = [];
    const add = (field: string, label: string, message: string) => { if(!issues.some(issue=>issue.field===field))issues.push({ field, label, message }); };
    if (!f.nombre.trim())
        add('nombre', 'Nombre', 'Escriba el nombre de la convocatoria.');
    else if (f.nombre.trim().length > 200)
        add('nombre', 'Nombre', 'El nombre admite hasta 200 caracteres.');
    function date(field: string, label: string, value: string) { const iso = dateFromInput(value); if (!iso)
        add(field, label, `Indique ${label.toLowerCase()} con una fecha real en formato DD-MM-AAAA.`);
    else if (iso < '2000-01-01' || iso > '2100-12-31')
        add(field, label, 'El año debe estar entre 2000 y 2100.'); return iso; }
    const start = date('apertura', 'Apertura', f.apertura), end = date('cierre', 'Cierre', f.cierre);
    if (start && end && end < start)
        add('cierre', 'Cierre', 'El cierre de recepción no puede ser anterior a la apertura.');
    if (f.presupuesto !== '' && (!/^\d+(?:[.,]\d{1,2})?$/.test(f.presupuesto.trim()) || Number(f.presupuesto.replace(',', '.')) > 999999999999.99))
        add('presupuesto', 'Presupuesto estimado', 'Indique un monto no negativo, con máximo dos decimales y hasta ₡999 999 999 999,99.');
    f.hitos.forEach((h, i) => { const prefix = `actividad-${h.key}`; if (!h.nombre.trim())
        add(prefix + '-nombre', `Actividad ${i + 1}`, 'Escriba el nombre de esta actividad.');
    else if (h.nombre.length > 200)
        add(prefix + '-nombre', `Actividad ${i + 1}`, 'La actividad admite hasta 200 caracteres.'); if (!h.responsable.trim())
        add(prefix + '-responsable', `Responsable de actividad ${i + 1}`, 'Indique quién es responsable de esta actividad.');
    else if (h.responsable.length > 120)
        add(prefix + '-responsable', `Responsable de actividad ${i + 1}`, 'El responsable admite hasta 120 caracteres.'); const a = date(prefix + '-inicio', `Inicio de actividad ${i + 1}`, h.inicio), b = date(prefix + '-fin', `Fin de actividad ${i + 1}`, h.fin); if (a && b && b < a)
        add(prefix + '-fin', `Fin de actividad ${i + 1}`, 'El fin de la actividad no puede ser anterior a su inicio.');
      for(const [field,label,value] of [[prefix+'-inicio',`Inicio de actividad ${i+1}`,a],[prefix+'-fin',`Fin de actividad ${i+1}`,b]]){
        if(value&&start&&value<start)add(field!,label!,`La actividad no puede comenzar ni terminar antes de la apertura (${dateLabel(start)}).`);
        if(value&&end&&value>end)add(field!,label!,`La actividad no puede comenzar ni terminar después del cierre de la convocatoria (${dateLabel(end)}).`);
      }
    });
    return issues;
}
