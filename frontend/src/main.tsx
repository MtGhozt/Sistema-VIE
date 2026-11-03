import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ContrastProvider } from "./a11y/ContrastContext";
import { AuthProvider } from "./auth/AuthContext";
import { NotificationsProvider } from "./notifications/NotificationsContext";
import { ToastProvider } from "./components/toast/ToastContext";
import { ToastHost } from "./components/toast/ToastHost";
import App from "./App";
import "./styles/prototipo.css";
import "./styles/brand-overrides.css";
import "./index.css";
// Última capa: correcciones de accesibilidad (WCAG). Debe ir al final para ganar la cascada.
import "./styles/a11y.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ContrastProvider>
        <AuthProvider>
          <NotificationsProvider>
            <ToastProvider>
              <App />
              <ToastHost />
            </ToastProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ContrastProvider>
    </BrowserRouter>
  </StrictMode>,
);
