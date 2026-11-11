import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import { AdministracionPage } from "./pages/AdministracionPage";
import { ConvocatoriasPage } from "./pages/ConvocatoriasPage";
import { EvaluacionesPage } from "./pages/EvaluacionesPage";
import {
  HistoricoDetallePage,
  HistoricoPage,
} from "./pages/HistoricoPage";
import { InicioPage } from "./pages/InicioPage";
import { LoginPage } from "./pages/LoginPage";
import { NotificacionesPage } from "./pages/NotificacionesPage";
import { PropuestaDetallePage } from "./pages/PropuestaDetallePage";
import { PropuestaNuevaPage } from "./pages/PropuestaNuevaPage";
import { PropuestasPage } from "./pages/PropuestasPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (session?.role !== "admin") return <section className="card"><h1>Acceso restringido</h1><p role="alert">La administración requiere el rol Super Administrador.</p></section>;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/convocatorias" element={<ConvocatoriasPage />} />
        <Route path="/convocatorias/nueva" element={<ConvocatoriasPage />} />
        <Route path="/convocatorias/:id" element={<ConvocatoriasPage />} />
        <Route path="/convocatorias/:id/editar" element={<ConvocatoriasPage />} />
        <Route path="/propuestas" element={<PropuestasPage />} />
        <Route path="/propuestas/nueva" element={<PropuestaNuevaPage />} />
        <Route path="/propuestas/:id" element={<PropuestaDetallePage />} />
        <Route path="/evaluaciones" element={<EvaluacionesPage />} />
        <Route path="/historico" element={<HistoricoPage />} />
        <Route path="/historico/:codigo" element={<HistoricoDetallePage />} />
        <Route path="/notificaciones" element={<NotificacionesPage />} />
        <Route path="/administracion" element={<RequireAdmin><AdministracionPage /></RequireAdmin>} />
      </Route>
      <Route path="/" element={<Navigate to="/inicio" replace />} />
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}
