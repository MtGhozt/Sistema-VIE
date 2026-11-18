import { labelEstado } from "../../data/proposalStates";

export type ChartPoint = { label: string; value: number };

const PALETTE = [
  "#002F6C",
  "#0B6E99",
  "#1B7A4E",
  "#B7791F",
  "#EF3340",
  "#4d8fd6",
  "#6a5acd",
  "#2a9d8f",
];

function niceLabel(label: string) {
  const mapped = labelEstado(label);
  if (mapped !== label) return mapped;
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [y, m] = label.split("-");
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${months[Number(m) - 1] ?? m} ${y}`;
  }
  return label.replace(/_/g, " ");
}

function maxValue(series: ChartPoint[]) {
  return Math.max(1, ...series.map((p) => p.value));
}

function EmptyChart() {
  return <p className="field-hint chart-empty">Sin datos para graficar.</p>;
}

export function BarChart({ series, title }: { series: ChartPoint[]; title: string }) {
  const max = maxValue(series);
  if (!series.length) return <EmptyChart />;
  return (
    <div className="chart-panel" role="img" aria-label={title}>
      <ul className="bar-chart">
        {series.map((p) => (
          <li key={p.label}>
            <span className="bar-chart-label" title={niceLabel(p.label)}>
              {niceLabel(p.label)}
            </span>
            <span className="bar-chart-track">
              <span
                className="bar-chart-fill"
                style={{ width: `${(p.value / max) * 100}%` }}
              />
            </span>
            <span className="bar-chart-value">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras verticales para series temporales (mejor que un puntito de línea). */
export function ColumnChart({ series, title }: { series: ChartPoint[]; title: string }) {
  if (!series.length) return <EmptyChart />;
  const max = maxValue(series);
  return (
    <div className="chart-panel" role="img" aria-label={title}>
      <div className="column-chart">
        {series.map((p) => (
          <div className="column-chart-item" key={p.label}>
            <span className="column-chart-value">{p.value}</span>
            <span className="column-chart-bar-wrap">
              <span
                className="column-chart-bar"
                style={{ height: `${Math.max(8, (p.value / max) * 100)}%` }}
              />
            </span>
            <span className="column-chart-label">{niceLabel(p.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ series, title }: { series: ChartPoint[]; title: string }) {
  if (!series.length) return <EmptyChart />;
  const total = series.reduce((a, b) => a + b.value, 0) || 1;
  let angle = 0;
  const slices = series.map((p, i) => {
    const start = angle;
    const sweep = (p.value / total) * 360;
    angle += sweep;
    return {
      ...p,
      start,
      sweep,
      color: PALETTE[i % PALETTE.length],
      pct: Math.round((p.value / total) * 100),
    };
  });

  function donutArc(startDeg: number, sweepDeg: number) {
    const outer = 40;
    const inner = 24;
    const cx = 50;
    const cy = 50;
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const ox1 = cx + outer * Math.cos(toRad(startDeg));
    const oy1 = cy + outer * Math.sin(toRad(startDeg));
    const ox2 = cx + outer * Math.cos(toRad(startDeg + sweepDeg));
    const oy2 = cy + outer * Math.sin(toRad(startDeg + sweepDeg));
    const ix1 = cx + inner * Math.cos(toRad(startDeg + sweepDeg));
    const iy1 = cy + inner * Math.sin(toRad(startDeg + sweepDeg));
    const ix2 = cx + inner * Math.cos(toRad(startDeg));
    const iy2 = cy + inner * Math.sin(toRad(startDeg));
    const large = sweepDeg > 180 ? 1 : 0;
    if (sweepDeg >= 359.9) {
      return [
        `M ${cx} ${cy - outer}`,
        `A ${outer} ${outer} 0 1 1 ${cx - 0.01} ${cy - outer}`,
        `L ${cx - 0.01} ${cy - inner}`,
        `A ${inner} ${inner} 0 1 0 ${cx} ${cy - inner}`,
        "Z",
      ].join(" ");
    }
    return [
      `M ${ox1} ${oy1}`,
      `A ${outer} ${outer} 0 ${large} 1 ${ox2} ${oy2}`,
      `L ${ix1} ${iy1}`,
      `A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");
  }

  return (
    <div className="chart-panel donut-chart-wrap" role="img" aria-label={title}>
      <div className="donut-visual">
        <svg viewBox="0 0 100 100" className="donut-chart" aria-hidden>
          {slices.map((s) => (
            <path key={s.label} d={donutArc(s.start, Math.max(s.sweep, 0.01))} fill={s.color} />
          ))}
        </svg>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>total</span>
        </div>
      </div>
      <ul className="pie-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <span>
              <span className="pie-swatch" style={{ background: s.color }} />
              {niceLabel(s.label)}
            </span>
            <strong>
              {s.value} · {s.pct}%
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartCard({
  title,
  type,
  series,
}: {
  title: string;
  type: "bar" | "pie" | "line" | "donut" | "column";
  series: ChartPoint[];
}) {
  const resolved =
    type === "pie" || type === "donut"
      ? "donut"
      : type === "line"
        ? "column"
        : type;

  return (
    <section className="card stack-md chart-card">
      <h3>{title}</h3>
      {resolved === "donut" ? (
        <DonutChart series={series} title={title} />
      ) : resolved === "column" ? (
        <ColumnChart series={series} title={title} />
      ) : (
        <BarChart series={series} title={title} />
      )}
    </section>
  );
}
