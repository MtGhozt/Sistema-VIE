/**
 * Genera los assets de marca TEC del frontend a partir del Manual de Identidad
 * Institucional que vive DENTRO del repo:
 *
 *   docs/manual-identidad-tec/logotec.pdf     p1 = logo completo (TEC | Tecnológico de Costa Rica)
 *   docs/manual-identidad-tec/firmatec-1.pdf  isotipo "TEC"
 *   docs/manual-identidad-tec/firmatec-2.pdf  rótulo "Tecnológico de Costa Rica"
 *
 * Los PDF son vectoriales, así que se renderizan con pdfjs a alta resolución y se
 * recortan por tinta. No hay capturas de pantalla ni rutas absolutas: cualquier
 * compañero puede regenerar los PNG con `pnpm brand`.
 *
 * Uso:  pnpm brand
 */
import fs from "fs";
import path from "path";
import * as napiCanvas from "@napi-rs/canvas";

// pdfjs-dist necesita Path2D/DOMMatrix en Node. El build "legacy" intenta
// polyfill-earlos con require() (que no existe en ESM), así que los polyfilleamos
// nosotros ANTES de importar pdfjs; si no, el render sale completamente vacío.
globalThis.Path2D ??= napiCanvas.Path2D;
globalThis.DOMMatrix ??= napiCanvas.DOMMatrix;
globalThis.ImageData ??= napiCanvas.ImageData;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "frontend/public/brand");

/** Escala de render (px por punto PDF). 4x da margen para pantallas HiDPI. */
const SCALE = 4;
/** Ancho máximo del PNG final en px (evita assets de varios MB). */
const MAX_WIDTH = 1200;

/** Colores oficiales del Manual de Identidad (cap. 2 "Colores Corporativos"). */
const TEC_ROJO = { r: 0xef, g: 0x33, b: 0x40 };

const SOURCES = {
  logo: { pdf: "docs/manual-identidad-tec/logotec.pdf", page: 1 },
  wordmark: { pdf: "docs/manual-identidad-tec/firmatec-1.pdf", page: 1 },
  nombre: { pdf: "docs/manual-identidad-tec/firmatec-2.pdf", page: 1 },
};

/**
 * Convierte una imagen con fondo blanco opaco en PNG con fondo transparente,
 * recuperando el color real de la tinta y su alpha (des-multiplicar el blanco).
 *
 * El manual solo usa dos tintas: azul #002855 (0,40,85) y rojo #EF3340 (239,51,64).
 * En ambas, el canal con menor valor es el que define la mezcla con el blanco:
 *   - azul: r = 255(1-a)  -> a = (255 - r) / 255
 *   - rojo: g = 255 - 204a -> a = (255 - g) / 204
 * Y se distinguen porque en el azul r < g y en el rojo r > g.
 */
function toTransparent(canvas) {
  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    const esRojo = r >= g;
    const k = esRojo ? 204 : 255;
    const min = esRojo ? g : r;

    const alpha = Math.min(1, Math.max(0, (255 - min) / k));
    if (alpha <= 0) {
      d[i + 3] = 0;
      continue;
    }

    const resto = 255 * (1 - alpha);
    d[i] = Math.min(255, Math.max(0, Math.round((r - resto) / alpha)));
    d[i + 1] = Math.min(255, Math.max(0, Math.round((g - resto) / alpha)));
    d[i + 2] = Math.min(255, Math.max(0, Math.round((b - resto) / alpha)));
    d[i + 3] = Math.round(alpha * 255);
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Recorta el canvas a la caja envolvente de la tinta (alpha > 0). */
function trim(canvas) {
  const ctx = canvas.getContext("2d");
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error("La página renderizada quedó vacía");

  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const out = napiCanvas.createCanvas(w, h);
  const octx = out.getContext("2d");
  octx.clearRect(0, 0, w, h);
  octx.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
  return out;
}

/** Reduce la imagen si excede MAX_WIDTH, manteniendo la proporción. */
function fitWidth(canvas, maxWidth = MAX_WIDTH) {
  if (canvas.width <= maxWidth) return canvas;
  const h = Math.round((canvas.height * maxWidth) / canvas.width);
  const out = napiCanvas.createCanvas(maxWidth, h);
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.quality = "best";
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, maxWidth, h);
  return out;
}

/**
 * Versión vaciada (blanco) del logo. El manual (cap. 2, "Marca de la institución")
 * exige que la línea roja se mantenga roja incluso sobre fondos oscuros.
 * Devuelve un canvas nuevo: el original no se toca.
 */
function toWhite(canvas) {
  const out = napiCanvas.createCanvas(canvas.width, canvas.height);
  const octx = out.getContext("2d");
  octx.drawImage(canvas, 0, 0);
  const img = octx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const esRojo = d[i] > d[i + 1] + 30;
    if (esRojo) {
      d[i] = TEC_ROJO.r;
      d[i + 1] = TEC_ROJO.g;
      d[i + 2] = TEC_ROJO.b;
    } else {
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

/**
 * Recorta el separador rojo (línea vertical) del lockup oficial, para tener un
 * asset consistente con la altura real del logo.
 */
function extractSeparator(canvas) {
  const ctx = canvas.getContext("2d");
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let x0 = width;
  let x1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 0 && data[i] > data[i + 1] + 30) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
      }
    }
  }
  if (x1 < 0) throw new Error("No se encontró la línea roja del separador");
  const out = napiCanvas.createCanvas(x1 - x0 + 1, height);
  const octx = out.getContext("2d");
  octx.drawImage(canvas, x0, 0, x1 - x0 + 1, height, 0, 0, x1 - x0 + 1, height);
  return out;
}

/** Renderiza una página del PDF y devuelve el canvas con la tinta recortada. */
async function renderInk({ pdf, page: pageNum }) {
  const pdfPath = path.join(root, pdf);
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`No existe el PDF fuente: ${pdf}`);
  }
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({
    data,
    disableWorker: true,
    useSystemFonts: true,
  }).promise;
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale: SCALE });
  const canvas = napiCanvas.createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height),
  );
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return fitWidth(trim(toTransparent(canvas)));
}

function write(canvas, name) {
  const dest = path.join(outDir, name);
  fs.writeFileSync(dest, canvas.toBuffer("image/png"));
  console.log(`  ${name.padEnd(26)} ${canvas.width} x ${canvas.height}`);
  return dest;
}

fs.mkdirSync(outDir, { recursive: true });
console.log("Generando assets de marca desde docs/manual-identidad-tec/ …");

const logo = await renderInk(SOURCES.logo);
write(logo, "logotec-azul.png");
write(toWhite(logo), "logotec-blanco.png");
write(extractSeparator(logo), "tec-separador-rojo.png");

const wordmark = await renderInk(SOURCES.wordmark);
write(wordmark, "tec-wordmark-azul.png");
write(toWhite(wordmark), "tec-wordmark-blanco.png");

const nombre = await renderInk(SOURCES.nombre);
write(nombre, "tec-nombre-azul.png");
write(toWhite(nombre), "tec-nombre-blanco.png");

console.log("Listo.");
