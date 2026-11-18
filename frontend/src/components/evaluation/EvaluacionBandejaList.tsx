import type { BandejaEntry } from "../../pages/evaluacionesTypes";

type Props = {
  entries: BandejaEntry[];
  selectedKey: string;
  disabled?: boolean;
  onSelect: (entry: BandejaEntry) => void;
};

function formatFecha(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function EvaluacionBandejaList({
  entries,
  selectedKey,
  disabled,
  onSelect,
}: Props) {
  if (entries.length === 0) return null;

  return (
    <section className="card eval-bandeja-list" aria-labelledby="eval-bandeja-heading">
      <div className="section-title">
        <div>
          <h2 id="eval-bandeja-heading">Bandeja de expedientes</h2>
          <p>
            {entries.length === 1
              ? "1 expediente disponible para su rol."
              : `${entries.length} expedientes disponibles para su rol.`}{" "}
            Seleccione uno para continuar.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table eval-bandeja-table">
          <caption className="sr-only">
            Expedientes pendientes o asignados en esta bandeja
          </caption>
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Título</th>
              <th scope="col">Escuela</th>
              <th scope="col">Estado</th>
              <th scope="col">Envío</th>
              <th scope="col">
                <span className="sr-only">Acción</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const active = entry.key === selectedKey;
              const item = entry.api;
              return (
                <tr
                  key={entry.key}
                  className={active ? "eval-bandeja-row is-selected" : "eval-bandeja-row"}
                  aria-current={active ? "true" : undefined}
                >
                  <td>
                    <strong>{entry.key}</strong>
                  </td>
                  <td className="table-primary">
                    <strong>{entry.demo.titulo}</strong>
                    {item?.investigadora ? (
                      <span>{item.investigadora}</span>
                    ) : null}
                  </td>
                  <td>{item?.escuela ?? entry.demo.escuela ?? "—"}</td>
                  <td>
                    <span className="badge badge-primary">
                      {item?.estadoLabel ?? entry.demo.estado}
                    </span>
                  </td>
                  <td>{formatFecha(item?.fechaEnvio ?? null)}</td>
                  <td>
                    <button
                      type="button"
                      className={active ? "btn btn-primary" : "btn btn-secondary"}
                      disabled={disabled}
                      aria-pressed={active}
                      onClick={() => onSelect(entry)}
                    >
                      {active ? "Seleccionado" : "Abrir"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="eval-bandeja-cards" aria-label="Expedientes de la bandeja">
        {entries.map((entry) => {
          const active = entry.key === selectedKey;
          const item = entry.api;
          return (
            <li key={`card-${entry.key}`}>
              <button
                type="button"
                className={
                  active
                    ? "eval-bandeja-card is-selected"
                    : "eval-bandeja-card"
                }
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onSelect(entry)}
              >
                <span className="eval-bandeja-card-code">{entry.key}</span>
                <strong>{entry.demo.titulo}</strong>
                <span>
                  {item?.estadoLabel ?? entry.demo.estado ?? "Sin estado"}
                  {" · "}
                  {item?.escuela ?? entry.demo.escuela ?? "Sin escuela"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
