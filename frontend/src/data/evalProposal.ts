import type { EvaluacionBandejaItem } from "../api/evaluaciones";
import type { DemoProposal } from "./demo";

/**
 * Adapta un expediente de la API (CU3/CU4) al shape `DemoProposal` que
 * consumen CaseFile / EvaluationRolePanels (paridad con el HTML).
 */
export function bandejaToDemoProposal(
  item: EvaluacionBandejaItem,
): DemoProposal {
  return {
    id: item.codigo,
    titulo: item.titulo,
    convocatoria: item.convocatoria,
    investigadora: item.investigadora,
    escuela: item.escuela,
    modalidad: item.modalidadLabel,
    estado: item.estadoLabel,
    etapa: Math.min(Math.max(item.etapaFlujo, 0), 6),
    piRequired: item.piRequired,
    presupuesto: "—",
    resumen: item.resumen ?? "",
    abstract: item.abstractEn ?? "",
    palabras: [],
    keywords: [],
    teamTec: [
      {
        nombre: item.investigadora,
        instancia: item.escuela,
        rol: "Coordinador",
        horas: "—",
      },
    ],
    teamExternal: [],
    documentos: [
      ...(item.oficioPI
        ? [{ nombre: `Dictamen PI ${item.oficioPI}`, estado: "Registrado" }]
        : []),
      ...(item.oficioComite
        ? [
            {
              nombre: `Oficio Comité ${item.oficioComite}`,
              estado: "Registrado",
            },
          ]
        : []),
      ...(item.oficioAval
        ? [{ nombre: `Aval Consejo ${item.oficioAval}`, estado: "Registrado" }]
        : []),
      ...(item.resolucion
        ? [
            {
              nombre: `Resolución ${item.resolucion}`,
              estado: "Registrado",
            },
          ]
        : []),
    ],
    evaluacionComite: item.evaluacionComite ?? undefined,
    oficioComite: item.oficioComite ?? undefined,
    oficioPI: item.oficioPI ?? undefined,
    oficioAval: item.oficioAval ?? undefined,
    resolucion: item.resolucion ?? undefined,
  };
}
