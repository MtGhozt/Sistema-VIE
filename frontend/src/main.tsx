import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ContrastProvider } from "./a11y/ContrastContext";
import { ThemeProvider } from "./a11y/ThemeContext";
import { FontSizeProvider } from "./a11y/FontSizeContext";
import { AuthProvider } from "./auth/AuthContext";
import { NotificationsProvider } from "./notifications/NotificationsContext";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { ToastProvider } from "./components/toast/ToastContext";
import { ToastHost } from "./components/toast/ToastHost";
import { router } from "./App";
import "./styles/prototipo.css";
import "./styles/brand-overrides.css";
import "./index.css";
// Última capa: correcciones de accesibilidad (WCAG). Debe ir al final para ganar la cascada.
import "./styles/a11y.css";
import "./styles/reading.css";
import "./styles/correcciones-finales.css";
import "./styles/theme-dark.css";
import "./styles/ux-extensions.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ContrastProvider>
        <FontSizeProvider>
          <AuthProvider>
            <NotificationsProvider>
              <ToastProvider>
                <ConfirmProvider>
                  <RouterProvider router={router} />
                  <ToastHost />
                </ConfirmProvider>
              </ToastProvider>
            </NotificationsProvider>
          </AuthProvider>
        </FontSizeProvider>
      </ContrastProvider>
    </ThemeProvider>
  </StrictMode>,
);
