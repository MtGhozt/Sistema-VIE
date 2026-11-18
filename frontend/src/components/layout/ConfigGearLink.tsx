import { Link } from "react-router-dom";
import { IconSettings } from "../icons";

/** Enlace a /configuracion con icono de tuerca. */
export function ConfigGearLink({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/configuracion"
      className={`topbar-icon config-gear-link ${className}`.trim()}
      title="Configuración"
      aria-label="Configuración"
    >
      <IconSettings size={18} />
    </Link>
  );
}
