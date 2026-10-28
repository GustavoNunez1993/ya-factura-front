/**
 * Moneda de un comprobante a partir del monedaId que guarda el back (1 PYG, 2 USD, 3 BRL, 4 EUR,
 * el mismo mapeo que usa el XML SIFEN). Sin dato, guaraníes.
 */
const CODIGOS: Record<number, string> = { 1: "PYG", 2: "USD", 3: "BRL", 4: "EUR" };

export const codigoMoneda = (monedaId?: number | null) => CODIGOS[monedaId ?? 1] ?? "PYG";

const PREFIJOS: Record<string, string> = { PYG: "Gs. ", USD: "US$ ", BRL: "R$ ", EUR: "€ " };

/** Prefijo para campos de monto (InputNumber prefix). */
export const prefijoMoneda = (moneda?: string | number | null) =>
  PREFIJOS[typeof moneda === "number" || moneda == null ? codigoMoneda(moneda as number | null) : moneda] ?? "";

/** Guaraníes sin decimales; monedas extranjeras con 2. */
export const decimalesMoneda = (codigo = "PYG") => (codigo === "PYG" ? 0 : 2);

/** Monto con el símbolo y los decimales de su moneda (código ISO o monedaId del comprobante). */
export const formatMonto = (value: number | null | undefined, moneda?: string | number | null) => {
  const codigo = typeof moneda === "number" || moneda == null ? codigoMoneda(moneda as number | null) : moneda;
  const decimales = decimalesMoneda(codigo);
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: codigo,
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(value || 0);
};
