import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "frontend/public/brand");
fs.mkdirSync(outDir, { recursive: true });

const assets =
  "C:/Users/Matias/.cursor/projects/c-Universidad-ProyectosU-IVSemestre-Diseno-Sistema-VIE/assets";

const FULL = path.join(
  assets,
  "c__Users_Matias_AppData_Roaming_Cursor_User_workspaceStorage_c57cdf1ea80cd17c5faf615310ef76e8_images_image-9b38d800-ca29-46ef-89ac-c385ee23d0aa.png",
);
const WORDMARK = path.join(
  assets,
  "c__Users_Matias_AppData_Roaming_Cursor_User_workspaceStorage_c57cdf1ea80cd17c5faf615310ef76e8_images_image-f1751366-2b6b-4868-935e-9cb21efadb2b.png",
);
const NAME = path.join(
  assets,
  "c__Users_Matias_AppData_Roaming_Cursor_User_workspaceStorage_c57cdf1ea80cd17c5faf615310ef76e8_images_image-a346675f-fd55-4f84-88c5-0a6398e5dbf0.png",
);

function isInk(r, g, b) {
  // navy logo ink or red separator
  const dark = r < 50 && g < 80 && b > 50 && b < 150;
  const red = r > 160 && g < 120 && b < 120;
  return dark || red;
}

function isRed(r, g, b) {
  return r > 160 && g < 120 && b < 120;
}

function isNearWhite(r, g, b, a = 255) {
  return a < 20 || (r > 245 && g > 245 && b > 245);
}

/** Trim to ink bounding box; transparent white bg */
async function trimToInk(srcPath, outName) {
  const img = await loadImage(srcPath);
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

  let x0 = width,
    y0 = height,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      if (isInk(r, g, b)) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  const pad = 6;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(width - 1, x1 + pad);
  y1 = Math.min(height - 1, y1 + pad);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const out = createCanvas(w, h);
  const octx = out.getContext("2d");
  octx.clearRect(0, 0, w, h);
  octx.drawImage(img, x0, y0, w, h, 0, 0, w, h);
  const id = octx.getImageData(0, 0, w, h);
  for (let i = 0; i < id.data.length; i += 4) {
    if (isNearWhite(id.data[i], id.data[i + 1], id.data[i + 2], id.data[i + 3])) {
      id.data[i + 3] = 0;
    }
  }
  octx.putImageData(id, 0, 0);
  const dest = path.join(outDir, outName);
  fs.writeFileSync(dest, out.toBuffer("image/png"));
  console.log("wrote", outName, w, "x", h);
  return dest;
}

/** Crop first (top) logo band from the 3-panel screenshot */
async function cropFullLogoTop(srcPath, outName) {
  const img = await loadImage(srcPath);
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

  const rowHits = [];
  for (let y = 0; y < height; y++) {
    let hits = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (isInk(data[i], data[i + 1], data[i + 2])) hits++;
    }
    rowHits[y] = hits > 10;
  }

  const bands = [];
  let start = null;
  for (let y = 0; y < height; y++) {
    if (rowHits[y] && start === null) start = y;
    if ((!rowHits[y] || y === height - 1) && start !== null) {
      const end = rowHits[y] ? y : y - 1;
      if (end - start > 25) bands.push([start, end]);
      start = null;
    }
  }
  console.log("bands", bands);
  if (!bands.length) throw new Error("No logo band found in full screenshot");

  const [yA, yB] = bands[0];
  // temp crop horizontal strip then trim
  const stripH = yB - yA + 1;
  const strip = createCanvas(width, stripH);
  const sctx = strip.getContext("2d");
  sctx.drawImage(img, 0, yA, width, stripH, 0, 0, width, stripH);
  const tmp = path.join(outDir, "_tmp-strip.png");
  fs.writeFileSync(tmp, strip.toBuffer("image/png"));
  await trimToInk(tmp, outName);
  fs.unlinkSync(tmp);
}

async function makeWhiteVariant(azulPath, outName) {
  const img = await loadImage(azulPath);
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, img.width, img.height);
  for (let i = 0; i < id.data.length; i += 4) {
    const a = id.data[i + 3];
    if (a < 15) {
      id.data[i + 3] = 0;
      continue;
    }
    const r = id.data[i],
      g = id.data[i + 1],
      b = id.data[i + 2];
    if (isRed(r, g, b)) {
      id.data[i] = 0xef;
      id.data[i + 1] = 0x33;
      id.data[i + 2] = 0x40;
      id.data[i + 3] = 255;
      continue;
    }
    // navy / gray ink → solid white (preserve alpha soft edges via threshold)
    if (a > 40) {
      id.data[i] = 255;
      id.data[i + 1] = 255;
      id.data[i + 2] = 255;
      id.data[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  const dest = path.join(outDir, outName);
  fs.writeFileSync(dest, c.toBuffer("image/png"));
  console.log("wrote", outName, img.width, "x", img.height);
}

await cropFullLogoTop(FULL, "logotec-azul.png");
await trimToInk(WORDMARK, "tec-wordmark-azul.png");
await trimToInk(NAME, "tec-nombre-azul.png");
await makeWhiteVariant(path.join(outDir, "logotec-azul.png"), "logotec-blanco.png");
await makeWhiteVariant(path.join(outDir, "tec-wordmark-azul.png"), "tec-wordmark-blanco.png");

console.log("done");
