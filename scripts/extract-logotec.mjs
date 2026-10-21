/**
 * Renderiza todas las páginas de los PDFs del Manual de Identidad TEC para
 * revisión visual. Es una herramienta de inspección: los assets que usa la app
 * se generan con `pnpm brand` (scripts/build-brand-assets.mjs).
 *
 * Salida: out/brand-render/ (ignorado por git).
 *
 * Uso:  pnpm brand:preview
 */
import fs from "fs";
import path from "path";
import * as napiCanvas from "@napi-rs/canvas";

// pdfjs-dist necesita Path2D/DOMMatrix en Node; ver build-brand-assets.mjs.
globalThis.Path2D ??= napiCanvas.Path2D;
globalThis.DOMMatrix ??= napiCanvas.DOMMatrix;
globalThis.ImageData ??= napiCanvas.ImageData;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "out/brand-render");
fs.mkdirSync(outDir, { recursive: true });

const PDFS = [
  "docs/manual-identidad-tec/logotec.pdf",
  "docs/manual-identidad-tec/firmatec-1.pdf",
  "docs/manual-identidad-tec/firmatec-2.pdf",
];

async function renderPdf(pdfRel, bg) {
  const pdfPath = path.join(root, pdfRel);
  if (!fs.existsSync(pdfPath)) {
    console.warn(`  (no existe) ${pdfRel}`);
    return;
  }
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs
    .getDocument({ data, disableWorker: true, useSystemFonts: true })
    .promise;
  const prefix = path.basename(pdfRel, ".pdf");
  console.log(prefix, "páginas:", doc.numPages);

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const scale = 4;
    const viewport = page.getViewport({ scale });
    const canvas = napiCanvas.createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, background: bg }).promise;

    const out = path.join(outDir, `${prefix}-p${pageNum}.png`);
    fs.writeFileSync(out, canvas.toBuffer("image/png"));
    console.log("  wrote", path.basename(out), canvas.width, "x", canvas.height);

    const text = await page.getTextContent();
    const strs = text.items
      .map((i) => ("str" in i ? i.str : ""))
      .filter(Boolean);
    if (strs.length) console.log("  text:", JSON.stringify(strs.slice(0, 20)));
  }
}

console.log("Renderizando PDFs del manual a", outDir, "…");
for (const pdf of PDFS) {
  await renderPdf(pdf, "#FFFFFF");
}
console.log("Listo.");
