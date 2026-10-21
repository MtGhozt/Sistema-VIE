import type { ImgHTMLAttributes } from "react";

type Props = {
  /** `blanco` sobre azul/oscuro; `azul` sobre fondos claros */
  variant?: "blanco" | "azul";
  /** `full` = TEC | nombre; `wordmark` = solo TEC */
  mark?: "full" | "wordmark";
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

const SRC = {
  full: {
    azul: "/brand/logotec-azul.png",
    blanco: "/brand/logotec-blanco.png",
  },
  wordmark: {
    azul: "/brand/tec-wordmark-azul.png",
    blanco: "/brand/tec-wordmark-blanco.png",
  },
} as const;

/**
 * Logo institucional TEC.
 *
 * Assets generados desde el Manual de Identidad (docs/manual-identidad-tec/)
 * con `pnpm brand` → PNGs en frontend/public/brand/.
 */
export function TecLogo({
  variant = "blanco",
  mark = "full",
  className = "",
  ...rest
}: Props) {
  return (
    <img
      src={SRC[mark][variant]}
      alt="TEC · Tecnológico de Costa Rica"
      className={`tec-logo-oficial ${className}`.trim()}
      width={mark === "full" ? 240 : 96}
      height={mark === "full" ? 47 : 38}
      decoding="async"
      {...rest}
    />
  );
}
