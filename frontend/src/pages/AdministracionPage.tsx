import { ROLES } from "../data/roles";

export function AdministracionPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Super Administrador</p>
          <h1>Administración del sistema</h1>
          <p>
            Gestione elementos transversales y supervise la configuración de
            todos los roles (prototipo local).
          </p>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="card admin-tabs">
          <button type="button" className="active">
            Roles y permisos
          </button>
          <button type="button">Usuarios</button>
          <button type="button">Catálogos</button>
          <button type="button">Formularios</button>
        </aside>

        <section className="card admin-content">
          <div className="section-title">
            <div>
              <h2>Roles y permisos</h2>
              <p>
                Permisos alineados con el desglose institucional del Análisis de
                Personas.
              </p>
            </div>
          </div>
          <div className="role-permission-list">
            {ROLES.map((r) => (
              <div key={r.id}>
                <div>
                  <strong>{r.label}</strong>
                  <span>{r.id}</span>
                </div>
                <span className="badge badge-primary">{r.short}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
