import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Anuncios de navegación para lectores de pantalla (WCAG 2.4.2 / 4.1.3).
 *
 * En una SPA el lector no recibe un cambio de documento: hay que avisarle.
 * Este componente:
 *   1. Actualiza `document.title` con el <h1> de la vista (o una etiqueta
 *      conocida mientras la vista aún carga).
 *   2. Anuncia «Página: …» en una región live permanente.
 *   3. Mueve el foco al <main> en cada cambio de ruta, para que el teclado y
 *      el lector continúen desde el contenido nuevo y no desde la navegación.
 *
 * El foco inicial no se mueve: solo los cambios posteriores de ruta.
 */

const SITE_NAME = "Fondos VIE · TEC";

const ROUTE_LABELS: Record<string, string> = {
  "/login": "Iniciar sesión",
  "/inicio": "Inicio",
  "/convocatorias": "Convocatorias",
  "/propuestas": "Propuestas",
  "/propuestas/nueva": "Nueva propuesta",
  "/evaluaciones": "Evaluaciones",
  "/historico": "Histórico de propuestas",
  "/notificaciones": "Notificaciones",
  "/administracion": "Administración",
};

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function headingTitle() {
  const main = document.querySelector<HTMLElement>("main");
  const heading =
    main?.querySelector<HTMLElement>("h1") ??
    document.querySelector<HTMLElement>("h1");
  return cleanText(heading?.textContent);
}

function fallbackTitle(pathname: string) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]!;
  if (pathname.startsWith("/propuestas/")) return "Expediente de propuesta";
  if (pathname.startsWith("/historico/")) return "Expediente histórico";
  return "Fondos VIE";
}

function resolvePageTitle(pathname: string) {
  if (pathname === "/login") return ROUTE_LABELS[pathname]!;
  return headingTitle() || fallbackTitle(pathname);
}

function applyDocumentTitle(title: string) {
  const next = title === SITE_NAME ? SITE_NAME : `${title} · ${SITE_NAME}`;
  if (document.title !== next) document.title = next;
}

export function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState("");
  const previousPath = useRef(location.pathname);
  const firstRender = useRef(true);

  useEffect(() => {
    let frame = 0;
    let announceFrame = 0;
    const pathChanged = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;

    // Esperar al pintado: el <h1> de la nueva vista ya está en el DOM.
    frame = window.requestAnimationFrame(() => {
      const title = resolvePageTitle(location.pathname);
      applyDocumentTitle(title);

      if (pathChanged && !firstRender.current) {
        const main = document.querySelector<HTMLElement>("main");
        main?.focus({ preventScroll: true });

        // Vaciar primero garantiza que el lector anuncie incluso dos rutas
        // con el mismo título.
        setAnnouncement("");
        announceFrame = window.requestAnimationFrame(() => {
          setAnnouncement(`Página: ${title}`);
        });
      }

      firstRender.current = false;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(announceFrame);
    };
  }, [location.pathname]);

  // Las vistas de detalle cargan el título después de consultar la API.
  // Observar el contenido mantiene document.title sincronizado sin anunciar
  // de más; las mutaciones se agrupan en un frame para no recalcular en cada
  // tecla o render.
  useEffect(() => {
    let frame = 0;
    const sync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applyDocumentTitle(resolvePageTitle(location.pathname));
      });
    };
    // `main` persiste entre rutas del shell; si aún no existe, se observa el
    // body para no perder el primer render.
    const target = document.querySelector("main") ?? document.body;
    const observer = new MutationObserver(sync);
    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    sync();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [location.pathname]);

  return (
    <div
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </div>
  );
}
