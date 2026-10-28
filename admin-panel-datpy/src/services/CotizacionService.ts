import api from "./api";

export interface Cotizacion {
  codigoMoneda: string;
  /** `null` cuando todavía no se cargó una cotización para esta moneda (PYG siempre es 1). */
  valor: number | null;
  /** `null` para PYG, que no tiene fila propia. */
  fecha: string | null;
}

/** Una carga de cotización. `usuario` es null en el registro inicial migrado (no se sabía quién la cargó). */
export interface CotizacionHistorial {
  codigoMoneda: string;
  valor: number;
  /** yyyy-MM-dd: día al que corresponde la cotización. */
  fecha: string;
  /** yyyy-MM-ddTHH:mm:ss, hora local del servidor: cuándo se cargó. */
  fechaHora: string;
  usuario: string | null;
}

const BASE_URL = "/cotizaciones";

/** Las cotizaciones son por empresa: cada una carga y usa su propio tipo de cambio. */
const empresaId = () => localStorage.getItem("empresaId");

export const CotizacionService = {
  async getAll(): Promise<Cotizacion[]> {
    const res = await api.get(BASE_URL, { params: { empresaId: empresaId() } });
    return res.data ?? [];
  },

  /**
   * Registra la cotización de `fecha` (yyyy-MM-dd, por defecto hoy). Devuelve la vigente: si
   * `fecha` es anterior a la vigente, sólo se agrega al historial y la vigente no cambia.
   */
  async actualizar(codigoMoneda: string, valor: number, fecha?: string): Promise<Cotizacion> {
    const res = await api.put(`${BASE_URL}/${codigoMoneda}`, { valor, fecha }, { params: { empresaId: empresaId() } });
    return res.data;
  },

  /** Cotizaciones con fecha entre `desde` y `hasta` (yyyy-MM-dd), la más reciente primero. Sin fechas: últimos 3 meses. */
  async historial(codigoMoneda: string, desde?: string, hasta?: string): Promise<CotizacionHistorial[]> {
    const res = await api.get(`${BASE_URL}/${codigoMoneda}/historial`, {
      params: { empresaId: empresaId(), desde, hasta }
    });
    return res.data ?? [];
  }
};
