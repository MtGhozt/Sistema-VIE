import type { WizardStepBag } from "./wizardTypes";
import { FormInput } from "../ProposalFieldControls";
import {
  FINANCING_TYPES,
} from "../../data/formWizardIan";
import { formatCRC } from "../../data/proposalView";
import { formatMoneyInput, moneyToNumber, parseMoneyInput } from "../../data/moneyFormat";

export function Step07(ctx: WizardStepBag) {
  const {
    form,
    patch,
    BUDGET_YEARS,
  } = ctx;
  const annualTotals = BUDGET_YEARS.map((_, index) =>
    form.financiamiento.reduce(
      (total, source) =>
        total +
        moneyToNumber([source.anio1, source.anio2, source.anio3][index] || 0),
      0,
    ),
  );
  const budgetTotals = form.presupuestoAnual.reduce(
    (totals, row, index) => ({
      operativo: totals.operativo + moneyToNumber(row.operativo || 0),
      duraderos:
        totals.duraderos +
        (index === 0 ? moneyToNumber(row.duraderos || 0) : 0),
    }),
    { operativo: 0, duraderos: 0 },
  );
  return (
    <div className="stack-xl">
      <section className="stack-md" aria-labelledby="annual-budget-heading">
        <div>
          <h3 id="annual-budget-heading">Presupuesto solicitado por año</h3>
          <p className="field-hint">
            El desglose de cada partida se adjunta en el archivo Excel de
            presupuesto. Los bienes duraderos se formulan únicamente para el
            primer año.
          </p>
        </div>
        <div className="table-wrap">
          <table className="data-table" aria-label="Presupuesto solicitado por año">
            <thead>
              <tr>
                <th scope="col">Año</th>
                <th scope="col">Presupuesto operativo</th>
                <th scope="col">Bienes duraderos</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {form.presupuestoAnual.map((row, index) => (
                <tr key={row.anio}>
                  <th scope="row">{row.anio}</th>
                  <td>
                    <label className="sr-only" htmlFor={`budget-operativo-${row.anio}`}>
                      Presupuesto operativo {row.anio}
                    </label>
                    <FormInput
                      id={`budget-operativo-${row.anio}`} aria-label={`Presupuesto operativo ${row.anio}`}
                      className="input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={formatMoneyInput(row.operativo || "0")}
                      onChange={(event) =>
                        patch({
                          presupuestoAnual: form.presupuestoAnual.map(
                            (budget) =>
                              budget.anio === row.anio
                                ? {
                                    ...budget,
                                    operativo:
                                      parseMoneyInput(event.target.value) ||
                                      "0",
                                  }
                                : budget,
                          ),
                        })
                      }
                    />
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`budget-durable-${row.anio}`}>
                      Presupuesto de bienes duraderos {row.anio}
                    </label>
                    <FormInput
                      id={`budget-durable-${row.anio}`} aria-label={`Presupuesto de bienes duraderos ${row.anio}`}
                      className="input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={
                        index === 0
                          ? formatMoneyInput(row.duraderos || "0")
                          : "0"
                      }
                      disabled={index > 0}
                      onChange={(event) =>
                        patch({
                          presupuestoAnual: form.presupuestoAnual.map(
                            (budget) =>
                              budget.anio === row.anio
                                ? {
                                    ...budget,
                                    duraderos:
                                      parseMoneyInput(event.target.value) ||
                                      "0",
                                  }
                                : budget,
                          ),
                        })
                      }
                    />
                  </td>
                  <td>
                    {formatCRC(
                      moneyToNumber(row.operativo || 0) +
                        (index === 0
                          ? moneyToNumber(row.duraderos || 0)
                          : 0),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td>{formatCRC(budgetTotals.operativo)}</td>
                <td>{formatCRC(budgetTotals.duraderos)}</td>
                <td>
                  {formatCRC(
                    budgetTotals.operativo + budgetTotals.duraderos,
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="stack-md" aria-labelledby="financing-heading">
        <div>
          <h3 id="financing-heading">
            Financiamiento externo, contrapartida y cofinanciamiento
          </h3>
          <p className="field-hint">
            Completá la fuente, los montos por año y el oficio de respaldo
            junto con la entidad emisora. El detalle del destino por partida
            se consigna en el Excel adjunto.
          </p>
        </div>
        <div className="table-wrap">
          <table className="data-table" aria-label="Financiamiento externo, contrapartida y cofinanciamiento">
            <thead>
              <tr>
                <th scope="col">Desglose</th>
                {BUDGET_YEARS.map((year) => (
                  <th scope="col" key={year}>
                    Año {year}
                  </th>
                ))}
                <th scope="col">Número de oficio / entidad emisora</th>
              </tr>
            </thead>
            <tbody>
              {form.financiamiento.map((source, sourceIndex) => (
                <tr key={source.tipo}>
                  <th scope="row">
                    {FINANCING_TYPES[sourceIndex].label}
                  </th>
                  {(["anio1", "anio2", "anio3"] as const).map(
                    (yearKey, index) => (
                      <td key={yearKey}>
                        <label
                          className="sr-only"
                          htmlFor={`financing-${source.tipo}-${yearKey}`}
                        >
                          {FINANCING_TYPES[sourceIndex].label}, año{" "}
                          {BUDGET_YEARS[index]}
                        </label>
                        <FormInput
                          id={`financing-${source.tipo}-${yearKey}`}
                          className="input"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={formatMoneyInput(source[yearKey] || "0")}
                          onChange={(event) =>
                            patch({
                              financiamiento: form.financiamiento.map(
                                (item) =>
                                  item.tipo === source.tipo
                                    ? {
                                        ...item,
                                        [yearKey]:
                                          parseMoneyInput(
                                            event.target.value,
                                          ) || "0",
                                      }
                                    : item,
                              ),
                            })
                          }
                        />
                      </td>
                    ),
                  )}
                  <td>
                    <label
                      className="sr-only"
                      htmlFor={`financing-oficio-${source.tipo}`}
                    >
                      Oficio y entidad emisora:{" "}
                      {FINANCING_TYPES[sourceIndex].label}
                    </label>
                    <FormInput
                      id={`financing-oficio-${source.tipo}`} aria-label={`Oficio y entidad emisora: ${source.tipo}`}
                      className="input"
                      maxLength={60}
                      value={source.oficio}
                      onChange={(event) =>
                        patch({
                          financiamiento: form.financiamiento.map((item) =>
                            item.tipo === source.tipo
                              ? { ...item, oficio: event.target.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                {annualTotals.map((total, index) => (
                  <td key={BUDGET_YEARS[index]}>{formatCRC(total)}</td>
                ))}
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
