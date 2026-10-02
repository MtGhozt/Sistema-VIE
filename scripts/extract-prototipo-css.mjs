import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const htmlPath = path.join(
  root,
  "docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html",
);
const outDir = path.join(root, "frontend/src/styles");
const outPath = path.join(outDir, "prototipo.css");

const html = fs.readFileSync(htmlPath, "utf8");
const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
const blocks = [];
let m;
while ((m = styleRe.exec(html)) !== null) {
  blocks.push(m[1].trim());
}

fs.mkdirSync(outDir, { recursive: true });
const banner = `/* Extraído de docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html — no editar a mano sin sincronizar con el prototipo */\n\n`;
fs.writeFileSync(outPath, banner + blocks.join("\n\n/* ===== next style block ===== */\n\n"), "utf8");
console.log(JSON.stringify({ blocks: blocks.length, bytes: fs.statSync(outPath).size, outPath }));
