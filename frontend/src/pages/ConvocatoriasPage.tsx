import {DateField} from "../components/DateField";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createConvocatoria, deleteConvocatoria, fetchConvocatoria, fetchConvocatorias, patchConvocatoria, type Convocatoria, type ConvocatoriaDetalle } from '../api/convocatorias';
import { useAuth } from '../auth/AuthContext';
import { SimpleModal } from '../components/evaluation/SimpleModal';
import { FilterGroup } from '../components/FilterGroup';
import { closingSoon, dateFromInput, dateLabel, emptyDraft, estadoLabel, fromDetail, newActivity, validateDraft, type ConvDraft, type FieldIssue } from '../data/convocatoriaUi';
type Action = 'publicar' | 'cerrar' | 'reactivar' | 'eliminar';
const actionText: Record<Action, string> = { publicar: 'Publicar convocatoria', cerrar: 'Cerrar convocatoria', reactivar: 'Reactivar convocatoria', eliminar: 'Eliminar borrador' };
const confirmations: Record<Action, string> = { publicar: 'La convocatoria será visible como publicada. Verifique sus fechas y cronograma antes de confirmar.', cerrar: 'Se cerrará la convocatoria. Sus propuestas y su historial se conservan.', reactivar: 'La convocatoria volverá al estado publicada con las fechas de recepción registradas.', eliminar: 'Se eliminarán este borrador y su cronograma. Esta acción no se puede deshacer. No se eliminan convocatorias con propuestas asociadas.' };
function focusField(id: string) { const node = document.getElementById(id); const details = node?.closest('details'); if (details)
    details.open = true; node?.focus(); node?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
function Field({ id, label, error, children }: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) { return <div className="field"><label className="field-label" htmlFor={id}>{label}</label>{children}{error && <p id={id + '-error'} className="field-error-text">{error}</p>}</div>; }
export function ConvocatoriasPage() {
    const { session } = useAuth();
    const canPublish = session?.role === 'vie_publicacion' || session?.role === 'admin';
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [search, setSearch] = useSearchParams();
    const mode = location.pathname.endsWith('/nueva') ? 'create' : location.pathname.endsWith('/editar') ? 'edit' : id ? 'detail' : 'list';
    const [rows, setRows] = useState<Convocatoria[]>([]), [detail, setDetail] = useState<ConvocatoriaDetalle | null>(null), [form, setForm] = useState<ConvDraft>(emptyDraft), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [issues, setIssues] = useState<FieldIssue[]>([]), [attempted, setAttempted] = useState(false), [action, setAction] = useState<Action | null>(null);
    const summary = useRef<HTMLDivElement>(null);
    const notice = (location.state as {
        notice?: string;
    } | null)?.notice;
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        setIssues([]);
        setAttempted(false);
        setAction(null);
        setDetail(null);
        if (mode === 'create') {
            setForm(emptyDraft());
            setLoading(false);
            return () => { active = false; };
        }
        const load = async () => { try {
            if (mode === 'list') {
                const data = await fetchConvocatorias();
                if (active)
                    setRows(data);
            }
            else {
                const data = await fetchConvocatoria(Number(id));
                if (active) {
                    setDetail(data);
                    setForm(fromDetail(data));
                }
            }
        }
        catch (e) {
            if (active)
                setError(e instanceof Error ? e.message : 'No se pudo cargar la convocatoria.');
        }
        finally {
            if (active)
                setLoading(false);
        } };
        void load();
        return () => { active = false; };
    }, [mode, id]);
    function patch(partial: Partial<ConvDraft>) { const next = { ...form, ...partial }; setForm(next); if (attempted)
        setIssues(validateDraft(next)); }
    function validate(draft = form) { const errors = validateDraft(draft); setIssues(errors); setAttempted(true); if (errors.length)
        requestAnimationFrame(() => { if (mode === 'create' || mode === 'edit')
            focusField(errors[0].field);
        else
            summary.current?.focus(); }); return !errors.length; }
    function control(id: string) { return { id, 'aria-invalid': issues.some(e => e.field === id) || undefined, 'aria-describedby': [id==='presupuesto'?'presupuesto-hint':'',issues.some(e=>e.field===id)?id+'-error':''].filter(Boolean).join(' ')||undefined, className: 'input' }; }
    function input(id: string, label: string, value: string, onChange: (s: string) => void, opts: {
        multiline?: boolean;
        date?: boolean;
        money?: boolean;
        maxLength?: number;
        min?:string;
        max?:string;
    } = {}) { const err = issues.find(e => e.field === id)?.message; if(opts.date)return <DateField id={id} label={label} value={dateFromInput(value)??''} onChange={iso=>onChange(iso?dateLabel(iso):'')} min={opts.min} max={opts.max} error={err} calendarButton disabled={busy}/>; return <Field id={id} label={label} error={err}>{opts.multiline ? <textarea {...control(id)} rows={4} value={value} onChange={e => onChange(e.target.value)}/> : <input {...control(id)} type="text" inputMode={opts.date ? 'numeric' : opts.money ? 'decimal' : undefined} placeholder={opts.date ? 'DD-MM-AAAA' : undefined} maxLength={opts.maxLength} value={value} onChange={e => onChange(e.target.value)}/>}</Field>; }
    async function save(e: FormEvent) { e.preventDefault(); if (!validate())
        return; setBusy(true); setError(''); try {
        const payload = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, fechaApertura: dateFromInput(form.apertura)!, fechaCierre: dateFromInput(form.cierre)!, presupuestoEstimado: form.presupuesto.trim() === '' ? null : Number(form.presupuesto.replace(',', '.')), hitos: form.hitos.map(h => ({ id: h.id, nombre: h.nombre.trim(), responsable: h.responsable.trim(), fechaInicio: dateFromInput(h.inicio)!, fechaFin: dateFromInput(h.fin)! })) };
        const saved = mode === 'edit' ? await patchConvocatoria(Number(id), payload) : await createConvocatoria({ ...payload, estado: 'borrador' });
        const notice = mode === 'edit' ? 'Los cambios del borrador se guardaron correctamente.' : 'El borrador de convocatoria se guardó correctamente.';
        navigate(`/convocatorias/${saved.id}`, { state: { notice } });
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo guardar el borrador.');
    }
    finally {
        setBusy(false);
    } }
    function ask(next: Action) { setError(''); if ((next === 'publicar' || next === 'reactivar') && detail && !validate(fromDetail(detail)))
        return; setAction(next); }
    async function confirm() { if (!detail || !action || busy)
        return; setBusy(true); setError(''); try {
        if (action === 'eliminar') {
            await deleteConvocatoria(detail.id);
            navigate('/convocatorias', { state: { notice: 'El borrador se eliminó correctamente.' } });
        }
        else {
            const estado = action === 'cerrar' ? 'cerrada' : 'activa';
            await patchConvocatoria(detail.id, { estado });
            setDetail(await fetchConvocatoria(detail.id));
            navigate(`/convocatorias/${detail.id}`, { replace: true, state: { notice: action === 'cerrar' ? 'La convocatoria se cerró correctamente.' : action === 'reactivar' ? 'La convocatoria se reactivó correctamente.' : 'La convocatoria se publicó correctamente.' } });
        }
        setAction(null);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo completar la acción.');
    }
    finally {
        setBusy(false);
    } }
    const [query, setQuery] = useState(search.get('q') ?? '');
    const [status, setStatus] = useState(search.get('estado') ?? 'todas');
    useEffect(() => { setQuery(search.get('q') ?? ''); setStatus(search.get('estado') ?? 'todas'); }, [search]);
    function filter(key: string, value: string) { const q = key === 'q' ? value : query; const st = key === 'estado' ? value : status; setQuery(q); setStatus(st || 'todas'); const p = new URLSearchParams(); if (q)
        p.set('q', q); if (st && st !== 'todas')
        p.set('estado', st); setSearch(p, { replace: true }); }
    const filtered = rows.filter(c => (!query || `${c.nombre} ${c.descripcion ?? ''}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))) && (status === 'todas' || status === 'proximas' && closingSoon(c) || status === 'cerrada' && ['cerrada', 'finalizada'].includes(c.estado) || c.estado === status));
    if ((mode === 'create' || mode === 'edit') && !canPublish)
        return <section className="card"><h1>Acceso restringido</h1><p role="alert">La edición de convocatorias requiere VIE Publicación o Super Administrador.</p><Link to="/convocatorias">Volver a convocatorias</Link></section>;
    const editingAllowed = mode !== 'edit' || detail?.estado === 'borrador';
    return <div className="convocatorias-workspace">
  <nav className="breadcrumbs" aria-label="Ubicación"><Link to="/inicio">Inicio</Link><span>/</span>{mode === 'list' ? <span>Convocatorias</span> : <><Link to="/convocatorias">Convocatorias</Link><span>/</span><span>{mode === 'create' ? 'Nueva convocatoria' : mode === 'edit' ? 'Editar borrador' : 'Revisar convocatoria'}</span></>}</nav>
  <header className="page-header"><div><p className="eyebrow">Gestión de convocatorias</p><h1>{mode === 'list' ? 'Convocatorias' : mode === 'create' ? 'Nueva convocatoria' : mode === 'edit' ? 'Editar borrador' : detail?.nombre ?? 'Revisar convocatoria'}</h1><p>{mode === 'list' ? 'Consulte las convocatorias y aplique cada filtro por separado.' : mode === 'detail' ? 'Revise las fechas, responsables y actividades antes de realizar una acción.' : 'Complete los datos y el cronograma. Puede escribir las fechas por día, mes y año o seleccionarlas en el calendario.'}</p></div>{mode === 'list' && canPublish && <Link className="btn btn-primary" to="/convocatorias/nueva">Nueva convocatoria</Link>}</header>
  {notice && <div className="feedback-success" role="status">{notice}</div>}
  {error && !action && <div role="alert" className="feedback-error">{error}</div>}
  {issues.length > 0 && <div ref={summary} tabIndex={-1} role="alert" className="feedback-error"><h2>Revise los campos indicados antes de continuar</h2><ul>{issues.map(e => <li key={e.field}>{mode === 'detail' ? <span>{e.label}: {e.message}</span> : <button type="button" onClick={() => focusField(e.field)}>{e.label}: {e.message}</button>}</li>)}</ul>{mode === 'detail' && detail?.estado === 'borrador' && <Link to={`/convocatorias/${id}/editar`}>Corregir el borrador</Link>}</div>}
  {loading ? <p role="status">Cargando convocatorias…</p> : <>
   {(mode === 'create' || mode === 'edit') && (editingAllowed ? <form className="card stack-xl convocatoria-form" noValidate onSubmit={save} aria-label="Datos de la convocatoria"><fieldset disabled={busy}><legend>Datos de la convocatoria</legend><div className="form-grid two-col">{input('nombre', 'Nombre', form.nombre, v => patch({ nombre: v }))}{input('presupuesto', 'Presupuesto estimado (₡)', form.presupuesto, v => patch({ presupuesto: v }), { money: true })}<p id="presupuesto-hint" className="field-hint" style={{gridColumn:"1 / -1"}}>Monto total previsto para esta convocatoria. Si lo deja vacío, se guarda como «No definido»; escribir 0 significa ₡0.</p>{input('apertura', 'Apertura (día/mes/año)', form.apertura, v => patch({ apertura: v }), { date: true })}{input('cierre', 'Cierre de recepción (día/mes/año)', form.cierre, v => patch({ cierre: v }), { date: true, min:dateFromInput(form.apertura)??undefined })}</div>{input('descripcion', 'Descripción (opcional)', form.descripcion, v => patch({ descripcion: v }), { multiline: true })}</fieldset>
    <details className="convocatoria-schedule-editor" open><summary>Cronograma de actividades</summary><p>Las actividades deben quedar entre la apertura y el cierre de recepción de esta convocatoria.</p>{form.hitos.map((h, i) => <fieldset disabled={busy} className="schedule-edit-card" key={h.key}><legend>Actividad {i + 1}</legend><div className="form-grid two-col">{input(`actividad-${h.key}-nombre`, 'Actividad', h.nombre, v => patch({ hitos: form.hitos.map(x => x.key === h.key ? { ...x, nombre: v } : x) }))}{input(`actividad-${h.key}-responsable`, 'Responsable', h.responsable, v => patch({ hitos: form.hitos.map(x => x.key === h.key ? { ...x, responsable: v } : x) }))}{input(`actividad-${h.key}-inicio`, 'Fecha de inicio (día/mes/año)', h.inicio, v => patch({ hitos: form.hitos.map(x => x.key === h.key ? { ...x, inicio: v } : x) }), { date: true, min:dateFromInput(form.apertura)??undefined, max:dateFromInput(form.cierre)??undefined })}{input(`actividad-${h.key}-fin`, 'Fecha de fin (día/mes/año)', h.fin, v => patch({ hitos: form.hitos.map(x => x.key === h.key ? { ...x, fin: v } : x) }), { date: true, min:dateFromInput(h.inicio)??dateFromInput(form.apertura)??undefined, max:dateFromInput(form.cierre)??undefined })}</div><button className="btn btn-ghost" type="button" disabled={form.hitos.length === 1} onClick={() => patch({ hitos: form.hitos.filter(x => x.key !== h.key) })}>Quitar actividad {i + 1}</button></fieldset>)}<button className="btn btn-secondary" disabled={busy} type="button" onClick={() => patch({ hitos: [...form.hitos, newActivity()] })}>Agregar actividad</button></details>
    <div className="page-actions"><Link className="btn btn-secondary" to={mode === 'edit' ? `/convocatorias/${id}` : '/convocatorias'}>Cancelar</Link><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Guardar borrador'}</button></div></form> : <section className="card"><p role="alert">Solo se pueden editar convocatorias en borrador.</p><Link to={`/convocatorias/${id}`}>Revisar convocatoria</Link></section>)}
   {mode === 'list' && <><div className="independent-filters" aria-label="Filtros de convocatorias"><FilterGroup title="Buscar convocatoria" active={Boolean(query)} onClear={() => filter('q', '')}><label className="field" htmlFor="conv-search">Nombre o descripción</label><input className="input" id="conv-search" value={query} onChange={e => filter('q', e.target.value)}/></FilterGroup><FilterGroup title="Estado de convocatoria" active={status !== 'todas'} onClear={() => filter('estado', 'todas')}><fieldset><legend className="sr-only">Estado de convocatoria</legend><ul className="filter-options">{[['todas', 'Todas'], ['activa', 'Publicadas'], ['borrador', 'Borradores'], ['proximas', 'Próximas a cerrar (30 días)'], ['cerrada', 'Cerradas y finalizadas']].map(([v, label]) => <li key={v}><label><input type="radio" name="conv-state" value={v} checked={status === v} onChange={() => filter('estado', v)}/>{label}</label></li>)}</ul></fieldset></FilterGroup></div>
   <section className="card convocatoria-list"><p role="status">{filtered.length} {filtered.length === 1 ? 'convocatoria encontrada' : 'convocatorias encontradas'}</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Convocatoria</th><th>Apertura</th><th>Cierre de recepción</th><th>Estado</th><th>Propuestas</th><th>Revisión</th></tr></thead><tbody>{filtered.map(c => <tr key={c.id}><td className="table-primary"><strong>{c.nombre}</strong><span>{c.descripcion?.slice(0, 120)}</span></td><td><time dateTime={c.fechaApertura}>{dateLabel(c.fechaApertura)}</time></td><td><time dateTime={c.fechaCierre}>{dateLabel(c.fechaCierre)}</time></td><td><span className={`conv-state conv-state-${c.estado}`}>{estadoLabel(c.estado)}</span></td><td>{c.propuestasCount}</td><td><Link to={`/convocatorias/${c.id}`} className="btn btn-secondary" aria-label={`Revisar ${c.nombre}`}>Revisar</Link></td></tr>)}</tbody></table></div>{filtered.length === 0 && <p className="empty-state">No hay convocatorias que coincidan con estos filtros.</p>}</section></>}
   {mode === 'detail' && detail && <><section className="card stack-md convocatoria-review" aria-label="Revisión de convocatoria"><span className={`conv-state conv-state-${detail.estado}`}>{estadoLabel(detail.estado)}</span><h2>Datos de la convocatoria</h2><p>{detail.descripcion || 'Sin descripción registrada.'}</p><dl className="convocation-facts"><div><dt>Apertura</dt><dd><time dateTime={detail.fechaApertura}>{dateLabel(detail.fechaApertura)}</time></dd></div><div><dt>Cierre de recepción</dt><dd><time dateTime={detail.fechaCierre}>{dateLabel(detail.fechaCierre)}</time></dd></div><div><dt>Presupuesto estimado</dt><dd>{detail.presupuestoEstimado === null ? 'No definido' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(detail.presupuestoEstimado)}</dd></div><div><dt>Propuestas asociadas</dt><dd>{detail.propuestasCount}</dd></div></dl>{canPublish && <div className="page-actions">{detail.estado === 'borrador' && <><Link className="btn btn-secondary" to={`/convocatorias/${id}/editar`}>Editar borrador</Link><button type="button" className="btn btn-primary" onClick={() => ask('publicar')}>Publicar</button><button type="button" className="btn btn-danger" disabled={detail.propuestasCount > 0} onClick={() => ask('eliminar')}>Eliminar borrador</button>{detail.propuestasCount > 0 && <p>No se puede eliminar: hay propuestas asociadas.</p>}</>}{detail.estado === 'activa' && <button type="button" className="btn btn-danger" onClick={() => ask('cerrar')}>Cerrar convocatoria</button>}{detail.estado === 'cerrada' && <button type="button" className="btn btn-secondary" onClick={() => ask('reactivar')}>Reactivar</button>}</div>}</section>
   <section className="card convocatoria-review"><h2>Cronograma y responsables</h2><ol className="review-schedule">{detail.hitos.map((h, i) => <li key={h.id}><h3>{i + 1}. {h.nombre}</h3><p><strong>Responsable:</strong> {h.responsable}</p><dl><div><dt>Inicio</dt><dd><time dateTime={h.fechaInicio}>{dateLabel(h.fechaInicio)}</time></dd></div><div><dt>Fin</dt><dd><time dateTime={h.fechaFin}>{dateLabel(h.fechaFin)}</time></dd></div></dl></li>)}</ol>{detail.hitos.length === 0 && <p>No hay actividades registradas.</p>}</section></>}
  </>}
  <SimpleModal open={Boolean(action)} title={action ? actionText[action] : ''} onClose={() => { if (!busy) {
        setAction(null);
        setError('');
    } }} footer={<><button className="btn btn-secondary" type="button" disabled={busy} onClick={() => { setAction(null); setError(''); }}>Cancelar</button><button className={`btn ${action === 'eliminar' ? 'btn-danger' : 'btn-primary'}`} disabled={busy} type="button" onClick={() => void confirm()}>{busy ? 'Procesando…' : 'Confirmar'}</button></>}><p>{detail?.nombre}</p><p>{action && confirmations[action]}</p>{error && <p role="alert" className="feedback-error">{error}</p>}</SimpleModal>
 </div>;
}
