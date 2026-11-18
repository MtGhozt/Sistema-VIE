import type { ReactNode } from "react";
import {
  Link,
  Navigate,
  Outlet,
  createBrowserRouter,
} from "react-router-dom";
import { RouteAnnouncer } from "./a11y/RouteAnnouncer";
import { useAuth } from "./auth/AuthContext";
import { FontSizeDock } from "./components/a11y/FontSizeDock";
import { AppShell } from "./components/layout/AppShell";
import { AdministracionPage } from "./pages/AdministracionPage";
import { ConfiguracionPage } from "./pages/ConfiguracionPage";
import { ConvocatoriasPage } from "./pages/ConvocatoriasPage";
import { EvaluacionesPage } from "./pages/EvaluacionesPage";
import {
  HistoricoDetallePage,
  HistoricoPage,
} from "./pages/HistoricoPage";
import { InicioPage } from "./pages/InicioPage";
import { LoginPage } from "./pages/LoginPage";
import { NotificacionesPage } from "./pages/NotificacionesPage";
import { PerfilPage } from "./pages/PerfilPage";
import { EstadisticasPage } from "./pages/EstadisticasPage";
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

/** Configuración accesible desde login (sin shell) o autenticado (con AppShell). */
function ConfiguracionLayout() {
  const { session } = useAuth();
  if (session) return <AppShell />;
  return (
    <div className="config-guest-shell">
      <header className="config-guest-bar">
        <Link to="/login" className="btn btn-ghost">
          Volver al inicio de sesión
        </Link>
      </header>
      <main className="content" id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <FontSizeDock />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        path: "/configuracion",
        element: <ConfiguracionLayout />,
        children: [{ index: true, element: <ConfiguracionPage /> }],
      },
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
          { path: "/estadisticas", element: <EstadisticasPage /> },
          { path: "/perfil", element: <PerfilPage /> },
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
