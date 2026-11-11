import type { ReactNode } from 'react';
export function FilterGroup({ title, children, active = false, onClear }: {
    title: string;
    children: ReactNode;
    active?: boolean;
    onClear: () => void;
}) { return <details className="filter-group" open><summary>{title}{active && <span className="badge">Aplicado</span>}</summary><div className="stack-md"><div>{children}</div><button className="btn btn-ghost" type="button" disabled={!active} onClick={onClear}>Limpiar {title.toLowerCase()}</button></div></details>; }
