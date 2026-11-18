import type { WizardStepBag } from "./wizardTypes";
import { FormInput, FormSelect, LimitedTextarea } from "../ProposalFieldControls";
import {
  BASIC_ACADEMIC_PRODUCTS,
  TECHNOLOGY_ACADEMIC_PRODUCTS,
  TECHNOLOGY_IP_ASSETS,
} from "../../data/formWizardIan";
import { RemoveIconButton } from "../ConfirmDialog";

export function Step08(ctx: WizardStepBag) {
  const {
    form,
    patch,
    patchAcademicProduct,
    patchTechnologyAsset,
    patchAdditionalProduct,
  } = ctx;
  const technologyProject = form.modalidad === "Desarrollo tecnológico";
  const academicOptions = technologyProject
    ? TECHNOLOGY_ACADEMIC_PRODUCTS
    : BASIC_ACADEMIC_PRODUCTS;
  const weeklyHours = form.teamTec.reduce(
    (total, member) =>
      total +
      member.horas.reduce(
        (memberTotal, hour) =>
          memberTotal + (Number(hour.cantidad) || 0),
        0,
      ),
    0,
  );
  const minimumAcademicProducts = Math.ceil(weeklyHours / 10);
  const selectedAcademicProducts = form.productosAcademicos.reduce(
    (total, product) =>
      total +
      (product.codigoOpcion ? Number(product.cantidad) || 0 : 0),
    0,
  );
  const selectedAssets = form.activosPI.reduce(
    (total, asset) =>
      total + (asset.codigoOpcion ? Number(asset.cantidad) || 0 : 0),
    0,
  );
  const minimumProductCombinations =
    weeklyHours > 0
      ? minimumAcademicProducts + (technologyProject ? 1 : 0)
      : 0;
  const commitmentRanges = [
    { min: 1, max: 10, basic: 1, technology: 2 },
    { min: 11, max: 20, basic: 2, technology: 3 },
    { min: 21, max: 30, basic: 3, technology: 4 },
  ];
  const selectedRange = commitmentRanges.find(
    (range) => weeklyHours >= range.min && weeklyHours <= range.max,
  );

  return (
    <div className="stack-xl"><p className="field-hint">La cantidad cuenta opciones completas: una unidad de la opción 2 equivale a dos artículos. Se pueden combinar o repetir opciones; los productos complementarios no sustituyen el mínimo académico.</p>
      <section className="stack-md" aria-labelledby="product-commitment-heading">
        <div>
          <h3 id="product-commitment-heading">
            {technologyProject
              ? "12.2 Compromiso para proyectos de desarrollo tecnológico"
              : "12.1 Compromiso para proyectos de investigación"}
          </h3>
          <p className="body-copy">
            Las horas semanales se calculan con las horas asignadas al equipo
            TEC en la etapa 3 (VIE, VIE-Centros, REC, CONS, DOC y VIESA).
            {technologyProject
              ? " El mínimo incluye los productos académicos y al menos un activo de propiedad industrial."
              : " El mínimo corresponde a opciones de productos académicos."}
          </p>
          <p className="field-hint">
            Total semanal: <strong>{weeklyHours}</strong> horas · mínimo de
            productos académicos:{" "}
            <strong>{minimumAcademicProducts || "—"}</strong>
            {technologyProject
              ? " · Para desarrollo tecnológico también se requiere al menos un activo de propiedad industrial."
              : ""}
          </p>
          {weeklyHours > 30 && (
            <p className="field-error" role="alert">
              El Formulario 4 solo define rangos hasta 30 horas semanales.
              Revisá las horas del equipo en la etapa 3.
            </p>
          )}
          {weeklyHours === 0 && (
            <p className="field-error" role="alert">
              Agregá las horas semanales del equipo TEC en la etapa 3 para
              determinar el mínimo de productos.
            </p>
          )}
          <div className="table-wrap">
            <table className="data-table" aria-label="Productos mínimos requeridos según horas semanales">
              <thead>
                <tr>
                  <th scope="col">Horas semanales</th>
                  <th scope="col">
                    {technologyProject
                      ? "Combinaciones mínimas"
                      : "Productos mínimos requeridos"}
                  </th>
                  <th scope="col">Selección aplicable</th>
                </tr>
              </thead>
              <tbody>
                {commitmentRanges.map((range) => {
                  const selected = range === selectedRange;
                  return (
                    <tr key={range.min}>
                      <th scope="row">
                        {range.min} a {range.max} horas
                      </th>
                      <td>
                        {technologyProject
                          ? `${range.technology} opciones (incluye al menos 1 activo de propiedad industrial)`
                          : `${range.basic} ${range.basic === 1 ? "opción" : "opciones"}`}
                      </td>
                      <td>{selected ? "X" : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="page-heading">
          <h4>Productos académicos comprometidos</h4>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              patch({
                productosAcademicos: [
                  ...form.productosAcademicos,
                  {
                    id: `producto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    codigoOpcion: "",
                    cantidad: "1",
                    objetivoNumero: "",
                  },
                ],
              })
            }
          >
            Agregar producto académico
          </button>
        </div>
        <p className="field-hint">
          Seleccioná una o varias opciones. Cada fila cuenta como una opción;
          podés repetirla con la cantidad o combinar opciones para alcanzar el
          mínimo requerido. Cada producto académico debe vincularse con uno
          de los tres objetivos específicos.
        </p>
        {form.productosAcademicos.length === 0 ? (
          <p className="empty-state">Todavía no agregaste productos académicos.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table" aria-label="Productos académicos comprometidos">
              <thead>
                <tr>
                  <th scope="col">Selección</th>
                  <th scope="col">Cantidad de opciones</th>
                  <th scope="col">Opción de producto</th>
                  <th scope="col">Objetivo específico asociado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {form.productosAcademicos.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>
                      <label
                        className="sr-only"
                        htmlFor={`academic-quantity-${product.id}`}
                      >
                        Cantidad de opciones académicas {index + 1}
                      </label>
                      <FormInput
                        id={`academic-quantity-${product.id}`}
                        className="input"
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        value={product.cantidad}
                        onChange={(event) =>
                          patchAcademicProduct(product.id, {
                            cantidad: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <label
                        className="sr-only"
                        htmlFor={`academic-option-${product.id}`}
                      >
                        Opción de producto académico {index + 1}
                      </label>
                      <FormSelect
                        id={`academic-option-${product.id}`}
                        className="input"
                        value={product.codigoOpcion}
                        onChange={(event) =>
                          patchAcademicProduct(product.id, {
                            codigoOpcion:
                              academicOptions.find(
                                (option) => option.value === event.target.value,
                              )?.value ?? "",
                          })
                        }
                      >
                        <option value="">Seleccioná una opción</option>
                        {academicOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </FormSelect>
                    </td>
                    <td>
                      <label
                        className="sr-only"
                        htmlFor={`academic-objective-${product.id}`}
                      >
                        Objetivo específico del producto {index + 1}
                      </label>
                      <FormSelect
                        id={`academic-objective-${product.id}`}
                        className="input"
                        value={product.objetivoNumero}
                        onChange={(event) =>
                          patchAcademicProduct(product.id, {
                            objetivoNumero:
                              event.target.value === "1" ||
                              event.target.value === "2" ||
                              event.target.value === "3"
                                ? event.target.value
                                : "",
                          })
                        }
                      >
                        <option value="">Seleccioná un objetivo</option>
                        {form.objetivosEspecificos
                          .slice(0, 3)
                          .map((objective, objectiveIndex) => (
                            <option
                              key={objective.id}
                              value={objectiveIndex + 1}
                            >
                              OE{objectiveIndex + 1}
                              {objective.descripcion.trim()
                                ? ` — ${objective.descripcion.trim()}`
                                : ""}
                            </option>
                          ))}
                      </FormSelect>
                    </td>
                    <td>
                      <RemoveIconButton
                        ariaLabel={`Quitar producto académico ${index + 1}`}
                        confirmWhat={`el producto académico ${index + 1}`}
                        onConfirm={() =>
                          patch({
                            productosAcademicos:
                              form.productosAcademicos.filter(
                                (item) => item.id !== product.id,
                              ),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="field-hint">
          Opciones seleccionadas: {selectedAcademicProducts} de{" "}
          {minimumAcademicProducts || "—"} requeridas.
          {technologyProject
            ? ` Compromisos mínimos totales (incluido activo industrial): ${minimumProductCombinations || "—"}; seleccionados: ${selectedAcademicProducts + selectedAssets}.`
            : ""}
        </p>
      </section>

      {technologyProject && (
        <section className="stack-md" aria-labelledby="ip-assets-heading">
          <div>
            <h3 id="ip-assets-heading">
              Activos de propiedad industrial (obligatorio)
            </h3>
            <p className="field-hint">
              Seleccioná al menos un activo y registrá el consecutivo del
              dictamen técnico del Centro de Vinculación.
            </p>
          </div>
          <div className="page-heading">
            <h4>Activos comprometidos</h4>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                patch({
                  activosPI: [
                    ...form.activosPI,
                    {
                      id: `activo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                      codigoOpcion: "",
                      cantidad: "1",
                      dictamen: "",
                    },
                  ],
                })
              }
            >
              Agregar activo
            </button>
          </div>
          {form.activosPI.length === 0 ? (
            <p className="empty-state">No has agregado activos de propiedad industrial.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table" aria-label="Activos de propiedad industrial comprometidos">
                <thead>
                  <tr>
                    <th scope="col">Selección</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Tipo de activo</th>
                    <th scope="col">Consecutivo del dictamen</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {form.activosPI.map((asset, index) => (
                    <tr key={asset.id}>
                      <td>{index + 1}</td>
                      <td>
                        <label
                          className="sr-only"
                          htmlFor={`asset-quantity-${asset.id}`}
                        >
                          Cantidad del activo {index + 1}
                        </label>
                        <FormInput
                          id={`asset-quantity-${asset.id}`}
                          className="input"
                          type="number"
                          min="1"
                          max="99"
                          step="1"
                          value={asset.cantidad}
                          onChange={(event) =>
                            patchTechnologyAsset(asset.id, {
                              cantidad: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <label
                          className="sr-only"
                          htmlFor={`asset-option-${asset.id}`}
                        >
                          Tipo de activo {index + 1}
                        </label>
                        <FormSelect
                          id={`asset-option-${asset.id}`}
                          className="input"
                          value={asset.codigoOpcion}
                          onChange={(event) =>
                            patchTechnologyAsset(asset.id, {
                              codigoOpcion:
                                TECHNOLOGY_IP_ASSETS.find(
                                  (option) =>
                                    option.value === event.target.value,
                                )?.value ?? "",
                            })
                          }
                        >
                          <option value="">Seleccioná un activo</option>
                          {TECHNOLOGY_IP_ASSETS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </FormSelect>
                      </td>
                      <td>
                        <label
                          className="sr-only"
                          htmlFor={`asset-dictamen-${asset.id}`}
                        >
                          Consecutivo del dictamen técnico {index + 1}
                        </label>
                        <FormInput
                          id={`asset-dictamen-${asset.id}`}
                          className="input"
                          maxLength={40}
                          value={asset.dictamen}
                          onChange={(event) =>
                            patchTechnologyAsset(asset.id, {
                              dictamen: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <RemoveIconButton
                          ariaLabel={`Quitar activo ${index + 1}`}
                          confirmWhat={`el activo ${index + 1}`}
                          onConfirm={() =>
                            patch({
                              activosPI: form.activosPI.filter(
                                (item) => item.id !== asset.id,
                              ),
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!technologyProject && (
        <section
          className="stack-md"
          aria-labelledby="additional-products-heading"
        >
          <div>
            <h3 id="additional-products-heading">
              Otros resultados y activos tecnológicos (complementarios)
            </h3>
            <p className="field-hint">
              Agregá hasta dos resultados adicionales, por ejemplo software,
              prototipos, bases de datos, guías técnicas o manuales. No
              sustituyen los productos académicos requeridos.
            </p>
          </div>
          {form.productosAdicionales.map((product, index) => (
            <div
              className="team-hours-row additional-product-row"
              key={product.id}
            >
              <label className="field">
                <span className="field-label">
                  Producto adicional {index + 1}
                </span>
                <LimitedTextarea
                  className="input textarea"
                  rows={2}
                  maxLength={500}
                  value={product.descripcion}
                  onChange={(event) =>
                    patchAdditionalProduct(product.id, {
                      descripcion: event.target.value,
                    })
                  }
                />
              </label>
              <RemoveIconButton
                ariaLabel={`Quitar producto adicional ${index + 1}`}
                confirmWhat={`el producto adicional ${index + 1}`}
                onConfirm={() =>
                  patch({
                    productosAdicionales: form.productosAdicionales.filter(
                      (item) => item.id !== product.id,
                    ),
                  })
                }
              />
            </div>
          ))}
          {form.productosAdicionales.length < 2 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                patch({
                  productosAdicionales: [
                    ...form.productosAdicionales,
                    {
                      id: `adicional-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                      descripcion: "",
                    },
                  ],
                })
              }
            >
              Agregar producto adicional
            </button>
          )}
        </section>
      )}
    </div>
  );
}
