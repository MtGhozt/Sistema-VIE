import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { NotificationsProvider } from "./notifications/NotificationsContext";
import { ToastProvider } from "./components/toast/ToastContext";
import { ToastHost } from "./components/toast/ToastHost";
import App from "./App";
import "./styles/prototipo.css";
import "./styles/brand-overrides.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <ToastProvider>
            <App />
            <ToastHost />
          </ToastProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
