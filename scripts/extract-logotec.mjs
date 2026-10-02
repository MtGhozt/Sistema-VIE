import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "frontend/public/brand");
fs.mkdirSync(outDir, { recursive: true });

async function renderPdf(pdfRel, prefix, bg) {
  const pdfPath = path.join(root, pdfRel);
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, disableWorker: true, useSystemFonts: true }).promise;
  console.log(prefix, "pages", doc.numPages);
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const scale = 4;
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const task = page.render({
      canvasContext: ctx,
      viewport,
      background: bg,
    });
    await task.promise;
    const out = path.join(outDir, `${prefix}-p${pageNum}-${bg.replace("#", "")}.png`);
    fs.writeFileSync(out, canvas.toBuffer("image/png"));
    console.log("wrote", path.basename(out), canvas.width, "x", canvas.height);

    // also dump text content for debugging
    const text = await page.getTextContent();
    const strs = text.items.map((i) => ("str" in i ? i.str : "")).filter(Boolean);
    console.log("  text:", JSON.stringify(strs.slice(0, 20)));
  }
}

await renderPdf("docs/manual-identidad-tec/logotec.pdf", "logotec", "#002F6C");
await renderPdf("docs/manual-identidad-tec/logotec.pdf", "logotec", "#FFFFFF");
await renderPdf("docs/manual-identidad-tec/firmatec-1.pdf", "firmatec1", "#FFFFFF");
await renderPdf("docs/manual-identidad-tec/firmatec-1.pdf", "firmatec1", "#002F6C");
await renderPdf("docs/manual-identidad-tec/firmatec-2.pdf", "firmatec2", "#FFFFFF");
