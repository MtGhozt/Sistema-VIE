import { useEffect, useState } from "react";
import { fetchEstadisticas, type EstadisticasResponse } from "../api/perfil";
import { ChartCard } from "../components/charts/SimpleCharts";
import { useAuth } from "../auth/AuthContext";
import { getRole } from "../data/roles";
import { useToast } from "../components/toast/ToastContext";

export function EstadisticasPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<EstadisticasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const viewRole = session?.viewRole ?? session?.role;

  useEffect(() => {
    let active = true;
    setLoading(true);
    const view =
      session?.role === "admin" && viewRole && viewRole !== "admin"
        ? viewRole
        : undefined;
    fetchEstadisticas(view)
      .then((rows) => {
        if (active) setData(rows);
      })
      .catch((e) => {
        if (active) showToast(e instanceof Error ? e.message : "No se pudieron cargar las estadísticas", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast, viewRole, session?.role]);

  const roleLabel = viewRole ? getRole(viewRole).label : "";

  return (
    <div className="stack-lg">
      <header className="page-header">
        <div>
          <p className="eyebrow">Indicadores · {roleLabel}</p>
          <h1>Estadísticas</h1>
          <p>
            Métricas relevantes para tu perfil operativo. Los valores respetan el
            alcance de propuestas de tu rol.
          </p>
        </div>
      </header>

      {loading && (
        <section className="card">
          <p role="status">Cargando estadísticas…</p>
        </section>
      )}

      {!loading && data && (
        <>
          <h2>{data.title}</h2>
          <div className="stats-grid">
            {data.kpis.map((k) => (
              <div className="card stat-card" key={k.label}>
                <div className="stat-value">{k.value}</div>
                <div className="stat-label">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="charts-grid">
            {data.charts.map((c) => (
              <ChartCard key={c.id} title={c.title} type={c.type} series={c.series} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
