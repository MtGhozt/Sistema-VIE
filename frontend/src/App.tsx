import type { ReactNode } from "react";
import {
  Navigate,
  Outlet,
  createBrowserRouter,
} from "react-router-dom";
import { RouteAnnouncer } from "./a11y/RouteAnnouncer";
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
  if (session?.role !== "admin")
    return (
      <section className="card">
        <h1>Acceso restringido</h1>
        <p role="alert">
          La administración requiere el rol Super Administrador.
        </p>
      </section>
    );
  return children;
}

function RootLayout() {
  return (
    <>
      <RouteAnnouncer />
      <Outlet />
    </>
  );
}

function AuthenticatedLayout() {
  return (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: "/inicio", element: <InicioPage /> },
          { path: "/convocatorias", element: <ConvocatoriasPage /> },
          { path: "/convocatorias/nueva", element: <ConvocatoriasPage /> },
          { path: "/convocatorias/:id", element: <ConvocatoriasPage /> },
          {
            path: "/convocatorias/:id/editar",
            element: <ConvocatoriasPage />,
          },
          { path: "/propuestas", element: <PropuestasPage /> },
          { path: "/propuestas/nueva", element: <PropuestaNuevaPage /> },
          { path: "/propuestas/:id", element: <PropuestaDetallePage /> },
          { path: "/evaluaciones", element: <EvaluacionesPage /> },
          { path: "/historico", element: <HistoricoPage /> },
          { path: "/historico/:codigo", element: <HistoricoDetallePage /> },
          { path: "/notificaciones", element: <NotificacionesPage /> },
          {
            path: "/administracion",
            element: (
              <RequireAdmin>
                <AdministracionPage />
              </RequireAdmin>
            ),
          },
        ],
      },
      { path: "/", element: <Navigate to="/inicio" replace /> },
      { path: "*", element: <Navigate to="/inicio" replace /> },
    ],
  },
]);
