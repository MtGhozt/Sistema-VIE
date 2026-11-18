import productCodes from "../../shared/ian-product-codes.json" with { type: "json" };
import ianLimits from "../../shared/ian-field-word-limits.json" with { type: "json" };
import type { query } from "./db.js";
import { HttpError } from "./middleware/HttpError.js";

const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const LEGACY_PRODUCT_CODE = /^(opcion_|activo_|adicional_|\d)/;

function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

type ProductRow = {
  ambito: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  dictamen: string | null;
};

type MemberRow = {
  tipo: string;
  orcid: string | null;
  nombre: string;
};

/** Espejo de las reglas de productos/ORCID/oficio/narrativa mínima del wizard al enviar. */
export async function validarEnvioIan(
  id: number,
  modality: string,
  execute: typeof query,
) {
  const core = (
    await execute<{
      fecha_inicio: string | null;
      fecha_finalizacion: string | null;
      problema: string | null;
      objetivo_general: string | null;
      metodologia: string | null;
      abstract_en: string | null;
      estado_arte: string | null;
      referencias: string | null;
      hoja_ruta: string | null;
      divulgacion: string | null;
      resguardo_repositorio: boolean;
      formulario_detalle: Record<string, unknown> | null;
    }>(
      `SELECT fecha_inicio::text, fecha_finalizacion::text, problema, objetivo_general, metodologia,
              abstract_en, estado_arte, referencias, hoja_ruta, divulgacion, resguardo_repositorio,
              formulario_detalle
       FROM propuesta WHERE id_propuesta=$1`,
      [id],
    )
  ).rows[0];
  if (!core) throw new HttpError(404, "Propuesta no encontrada");
  if (!core.fecha_inicio || !core.fecha_finalizacion) {
    throw new HttpError(400, "Fechas: indique inicio y finalización del proyecto antes de enviar.");
  }
  if (core.fecha_finalizacion < core.fecha_inicio) {
    throw new HttpError(400, "Fechas: la finalización no puede ser anterior al inicio.");
  }
  for (const [label, value, max] of [
    ["Problema", core.problema, ianLimits.problema],
    ["Objetivo general", core.objetivo_general, ianLimits.objetivoGeneral],
    ["Metodología", core.metodologia, ianLimits.metodologia],
    ["Abstract EN", core.abstract_en, ianLimits.abstract],
    ["Estado del arte", core.estado_arte, ianLimits.estadoArte],
    ["Referencias", core.referencias, ianLimits.referencias],
  ] as const) {
    const text = String(value ?? "").trim();
    if (!text) {
      throw new HttpError(400, `${label}: complete este campo antes de enviar.`);
    }
    if (countWords(text) > max) {
      throw new HttpError(
        400,
        `${label}: supera el límite del formulario de ${max} palabras.`,
      );
    }
  }
  if (!core.resguardo_repositorio) {
    throw new HttpError(
      400,
      "Resguardo: acepte el depósito en repositorio institucional antes de enviar.",
    );
  }
  const plan = await execute(
    "SELECT 1 FROM actividad_plan WHERE id_propuesta=$1 LIMIT 1",
    [id],
  );
  if (!plan.rowCount) {
    throw new HttpError(
      400,
      "Plan de acción: agregue al menos una actividad antes de enviar.",
    );
  }

  const detalle = (core.formulario_detalle ?? {}) as Record<string, unknown>;
  const divulgacionDetalle = nestedSectionText(
    detalle,
    "formularioDivulgacion",
    "divulgacion",
  );
  const hojaDetalle = nestedSectionText(detalle, "formularioHojaRuta", "hojaRuta");
  if (!String(core.divulgacion ?? "").trim() && !divulgacionDetalle) {
    throw new HttpError(
      400,
      "Divulgación: complete el plan de divulgación antes de enviar.",
    );
  }
  if (!String(core.hoja_ruta ?? "").trim() && !hojaDetalle) {
    throw new HttpError(
      400,
      "Hoja de ruta: complete la hoja de ruta estratégica antes de enviar.",
    );
  }

  const budget = await execute<{ total: string }>(
    `SELECT COALESCE(SUM(monto_total),0)::text AS total
     FROM propuesta_presupuesto_anual WHERE id_propuesta=$1`,
    [id],
  );
  if (!(Number(budget.rows[0]?.total ?? 0) > 0)) {
    throw new HttpError(
      400,
      "Presupuesto: registre al menos un monto anual mayor que cero antes de enviar.",
    );
  }

  const ethics = (
    await execute<{
      humanos: boolean;
      biodiversidad: boolean;
      animales: boolean;
      indigenas: boolean;
      exencion: string | null;
    }>(
      `SELECT involucra_humanos AS humanos, involucra_biodiversidad AS biodiversidad,
              involucra_animales AS animales, involucra_pueblos_indigenas AS indigenas,
              justificacion_exencion AS exencion
       FROM aspecto_etico WHERE id_propuesta=$1`,
      [id],
    )
  ).rows[0];
  if (!ethics) {
    throw new HttpError(
      400,
      "Ética: declare los aspectos éticos del proyecto antes de enviar.",
    );
  }
  const ethicsRisk =
    ethics.humanos ||
    ethics.biodiversidad ||
    ethics.animales ||
    ethics.indigenas;
  if (!ethicsRisk && !String(ethics.exencion ?? "").trim()) {
    throw new HttpError(
      400,
      "Ética: si no hay involucramiento sensible, indique la justificación de exención.",
    );
  }
  if (ethicsRisk) {
    const permits = await execute(
      "SELECT 1 FROM permiso_etico WHERE id_propuesta=$1 LIMIT 1",
      [id],
    );
    const ethicsForm = (detalle.formularioEtica ?? {}) as Record<string, unknown>;
    const ethicsAspects = (ethicsForm.aspectosEticos ?? {}) as Record<
      string,
      unknown
    >;
    const entities = Array.isArray(ethicsAspects.entesRegulatorios)
      ? ethicsAspects.entesRegulatorios
      : [];
    if (!permits.rowCount && !entities.length) {
      throw new HttpError(
        400,
        "Ética: registre el aval o ente regulatorio cuando hay involucramiento sensible.",
      );
    }
  }

  const questions = (
    await execute<{ numero: number }>(
      `SELECT DISTINCT numero_pregunta AS numero
       FROM propuesta_pregunta_general WHERE id_propuesta=$1`,
      [id],
    )
  ).rows.map((row) => Number(row.numero));
  // q1–q8 viven en propuesta_pregunta_general; q9 (innovación) va en formulario_detalle.
  const missingQuestions = [1, 2, 3, 4, 5, 6, 7, 8].filter(
    (n) => !questions.includes(n),
  );
  if (missingQuestions.length) {
    throw new HttpError(
      400,
      `Preguntas generales: complete las preguntas ${missingQuestions.join(", ")} antes de enviar.`,
    );
  }
  const generales = (detalle.formularioGenerales ?? {}) as Record<string, unknown>;
  const q9 = String(generales.q9 ?? "").trim();
  if (q9 !== "Sí" && q9 !== "No") {
    throw new HttpError(
      400,
      "Preguntas generales: indique si el proyecto es de innovación (pregunta 9) antes de enviar.",
    );
  }
  if (q9 === "Sí" && !String(generales.q9Tipo ?? "").trim()) {
    throw new HttpError(
      400,
      "Preguntas generales: indique el tipo de innovación predominante antes de enviar.",
    );
  }

  const members = (
    await execute<MemberRow>(
      `SELECT tipo, orcid, nombre_completo AS nombre
       FROM propuesta_participante WHERE id_propuesta=$1 ORDER BY id_participante`,
      [id],
    )
  ).rows;
  if (!members.length) {
    throw new HttpError(
      400,
      "Equipo: agregue al menos una persona investigadora antes de enviar.",
    );
  }
  for (const [index, member] of members.entries()) {
    const label =
      member.tipo === "funcionario_tec"
        ? `persona TEC ${index + 1}`
        : `colaborador externo`;
    const orcid = String(member.orcid ?? "").trim();
    if (!orcid) {
      throw new HttpError(400, `ID ORCID, ${label}: complete el ORCID antes de enviar.`);
    }
    if (!ORCID_RE.test(orcid)) {
      throw new HttpError(
        400,
        `ID ORCID, ${label}: use el formato ORCID 0000-0000-0000-0000 (último carácter puede ser X).`,
      );
    }
  }

  const hoursRow = await execute<{ horas: string }>(
    `SELECT COALESCE(SUM(h.cantidad_horas),0) AS horas
     FROM propuesta_participante pp
     JOIN propuesta_participante_hora h ON h.id_participante=pp.id_participante
     WHERE pp.id_propuesta=$1 AND pp.tipo='funcionario_tec'`,
    [id],
  );
  const weeklyHours = Number(hoursRow.rows[0]?.horas ?? 0);
  if (!(weeklyHours > 0)) {
    throw new HttpError(
      400,
      "Equipo TEC: indique horas semanales mayores que cero antes de enviar.",
    );
  }
  const minimum = Math.ceil(weeklyHours / 10);
  const technology = modality === "desarrollo_tecnologico";

  const products = (
    await execute<ProductRow>(
      `SELECT ambito, codigo_opcion AS codigo, descripcion, cantidad::int AS cantidad,
              dictamen_consecutivo AS dictamen
       FROM propuesta_producto WHERE id_propuesta=$1 ORDER BY id_producto`,
      [id],
    )
  ).rows;

  const academic = products.filter((p) =>
    ["basica_aplicada", "desarrollo_tecnologico"].includes(p.ambito),
  );
  const assets = products.filter((p) => p.ambito === "activo_pi");
  const extras = products.filter((p) => p.ambito === "adicional");

  if (!academic.length) {
    throw new HttpError(
      400,
      "Productos: registre al menos un producto académico según la modalidad.",
    );
  }

  const allowedAcademic = technology
    ? productCodes.technologyAcademic
    : productCodes.basicAcademic;
  for (const product of academic) {
    assertQuantity(product.cantidad, "producto académico");
    if (
      !allowedAcademic.includes(product.codigo) &&
      !LEGACY_PRODUCT_CODE.test(product.codigo)
    ) {
      throw new HttpError(
        400,
        `Productos: la opción «${product.codigo}» no corresponde a la modalidad del proyecto.`,
      );
    }
  }
  const academicQty = academic.reduce((sum, p) => sum + Number(p.cantidad || 0), 0);
  if (academicQty < minimum) {
    throw new HttpError(
      400,
      `Productos: con ${weeklyHours} horas semanales se requieren al menos ${minimum} productos académicos.`,
    );
  }

  if (technology) {
    if (!assets.length) {
      throw new HttpError(
        400,
        "Productos: el desarrollo tecnológico requiere al menos un activo de PI.",
      );
    }
    for (const asset of assets) {
      assertQuantity(asset.cantidad, "activo de PI");
      if (
        !productCodes.technologyIpAssets.includes(asset.codigo) &&
        !LEGACY_PRODUCT_CODE.test(asset.codigo)
      ) {
        throw new HttpError(
          400,
          `Activos PI: la opción «${asset.codigo}» no está en la lista oficial del formulario.`,
        );
      }
      const dictamen = String(asset.dictamen ?? "").trim();
      if (!dictamen) {
        throw new HttpError(
          400,
          "Activos PI: indique el consecutivo de dictamen de cada activo.",
        );
      }
      if (dictamen.length > productCodes.maxDictamenLength) {
        throw new HttpError(
          400,
          `Activos PI: el dictamen admite hasta ${productCodes.maxDictamenLength} caracteres.`,
        );
      }
    }
    const assetQty = assets.reduce((sum, p) => sum + Number(p.cantidad || 0), 0);
    if (academicQty + assetQty < minimum + 1) {
      throw new HttpError(
        400,
        `Productos: en desarrollo tecnológico se requieren al menos ${minimum + 1} unidades entre académicos y activos PI.`,
      );
    }
  } else {
    if (extras.length > productCodes.maxAdicionales) {
      throw new HttpError(
        400,
        `Productos adicionales: admiten como máximo ${productCodes.maxAdicionales}.`,
      );
    }
    for (const extra of extras) {
      const text = String(extra.descripcion ?? "").trim();
      if (!text) {
        throw new HttpError(400, "Productos adicionales: complete la descripción.");
      }
      if (text.length > productCodes.maxAdicionalDescription) {
        throw new HttpError(
          400,
          `Productos adicionales: la descripción admite hasta ${productCodes.maxAdicionalDescription} caracteres.`,
        );
      }
    }
  }

  const sources = (
    await execute<{ tipo: string; monto: string; oficio: string | null }>(
      `SELECT tipo, monto::text AS monto, numero_oficio AS oficio
       FROM propuesta_financiamiento WHERE id_propuesta=$1`,
      [id],
    )
  ).rows;
  for (const source of sources) {
    if (Number(source.monto) > 0) {
      const oficio = String(source.oficio ?? "").trim();
      if (!oficio) {
        throw new HttpError(
          400,
          `Financiamiento (${source.tipo}): indique el oficio cuando hay aportes.`,
        );
      }
      if (oficio.length > productCodes.maxOficioLength) {
        throw new HttpError(
          400,
          `Financiamiento (${source.tipo}): el oficio admite hasta ${productCodes.maxOficioLength} caracteres.`,
        );
      }
    }
  }
}

function assertQuantity(value: number, label: string) {
  if (
    !Number.isInteger(Number(value)) ||
    Number(value) < 1 ||
    Number(value) > productCodes.maxQuantity
  ) {
    throw new HttpError(
      400,
      `${label}: la cantidad debe ser un entero entre 1 y ${productCodes.maxQuantity}.`,
    );
  }
}

function nestedSectionText(
  detalle: Record<string, unknown>,
  formKey: string,
  sectionKey: string,
): boolean {
  const form = (detalle[formKey] ?? {}) as Record<string, unknown>;
  const section = (form[sectionKey] ?? {}) as Record<string, unknown>;
  return Object.values(section).some((value) => String(value ?? "").trim());
}

export function validarOrcidOpcional(orcid: unknown) {
  const value = String(orcid ?? "").trim();
  if (!value) return;
  if (!ORCID_RE.test(value)) {
    throw new HttpError(
      400,
      "ID ORCID: use el formato ORCID 0000-0000-0000-0000 (último carácter puede ser X).",
    );
  }
}
