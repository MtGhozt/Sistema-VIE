/** Formato de montos con espacios de miles (como el TOTAL CRC). */

export function parseMoneyInput(raw: string): string {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  if (!normalized) return "";
  const match = normalized.match(/^(\d+)(?:\.(\d{0,2}))?/);
  if (!match) return "";
  const intPart = match[1].replace(/^0+(?=\d)/, "") || "0";
  if (match[2] !== undefined) return `${intPart}.${match[2]}`;
  if (normalized.endsWith(".")) return `${intPart}.`;
  return intPart;
}

export function formatMoneyInput(value: string): string {
  const cleaned = parseMoneyInput(value);
  if (!cleaned) return "";
  const negative = cleaned.startsWith("-");
  const abs = negative ? cleaned.slice(1) : cleaned;
  const [intPart, decPart] = abs.split(".");
  const spaced = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const withDec =
    decPart !== undefined ? `${spaced}.${decPart}` : spaced;
  return negative ? `-${withDec}` : withDec;
}

export function moneyToNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null || value === "") return 0;
  const n = Number(parseMoneyInput(String(value)));
  return Number.isFinite(n) ? n : 0;
}

export function isValidMoneyString(value: string): boolean {
  const v = parseMoneyInput(value);
  if (!v || v.endsWith(".")) return false;
  return /^\d+(?:\.\d{1,2})?$/.test(v) && Number(v) <= 999999999999.99;
}
