import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(
  path.join(root, "docs/prototipo-html-referencia/Fondos-VIE-Prototipo.html"),
  "utf8",
);

function sliceAround(needle, before = 0, after = 8000) {
  const i = html.indexOf(needle);
  if (i < 0) return null;
  return html.slice(Math.max(0, i - before), i + after);
}

const out = path.join(root, "docs/prototipo-html-referencia/analisis/extract-runtime");
fs.mkdirSync(out, { recursive: true });

// Role list object-ish
const rolesChunk = sliceAround('id:"vie_publicacion",label:"VIE', 0, 2500);
fs.writeFileSync(path.join(out, "roles-chunk.txt"), rolesChunk ?? "NOT FOUND");

const fsChunk = sliceAround("Fs={vie_publicacion:{eyebrow:", 0, 6000);
fs.writeFileSync(path.join(out, "home-summaries.txt"), fsChunk ?? "NOT FOUND");

const navChunk = sliceAround("rp=[", 0, 3000);
fs.writeFileSync(path.join(out, "nav-rp.txt"), navChunk ?? "NOT FOUND");

const navAlt = sliceAround('to:"/inicio"', 0, 4000);
fs.writeFileSync(path.join(out, "nav-inicio.txt"), navAlt ?? "NOT FOUND");

const personas = sliceAround('$s={investigador:["María', 0, 2000);
fs.writeFileSync(path.join(out, "personas.txt"), personas ?? "NOT FOUND");

const routesMap = sliceAround("vie_publicacion:[\"/inicio\"", 0, 2500);
fs.writeFileSync(path.join(out, "routes-by-role.txt"), routesMap ?? "NOT FOUND");

// CSS login classes
const css = fs.readFileSync(path.join(root, "frontend/src/styles/prototipo.css"), "utf8");
const loginBits = [];
for (const cls of [
  "login-page",
  "login-brand",
  "login-form",
  "login-card",
  "login-panel",
  "brand-panel",
  "role-select",
  "tec-",
  "--tec",
  "--primary",
  ":root",
]) {
  const idx = css.indexOf(cls);
  if (idx >= 0) loginBits.push(`\n===== ${cls} @${idx} =====\n` + css.slice(idx, idx + 1200));
}
fs.writeFileSync(path.join(out, "css-login.txt"), loginBits.join("\n") || "none");

// Find JSX-ish strings for login
const loginJsx = sliceAround("Ingresá con tu rol", 500, 2000)
  || sliceAround("Seleccionar rol", 500, 2000)
  || sliceAround("login-page", 200, 2000);
fs.writeFileSync(path.join(out, "login-jsx.txt"), loginJsx ?? "NOT FOUND");

console.log("done", {
  roles: !!rolesChunk,
  fs: !!fsChunk,
  nav: !!navChunk || !!navAlt,
  personas: !!personas,
  routes: !!routesMap,
  loginCss: loginBits.length,
});
