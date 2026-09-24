import api from "./api";

export interface Cotizacion {
  codigoMoneda: string;
  /** `null` cuando todavía no se cargó una cotización para esta moneda (PYG siempre es 1). */
  valor: number | null;
  /** `null` para PYG, que no tiene fila propia. */
  fecha: string | null;
}

const BASE_URL = "/cotizaciones";

export const CotizacionService = {
  async getAll(): Promise<Cotizacion[]> {
    const res = await api.get(BASE_URL);
    return res.data ?? [];
  },

  async actualizar(codigoMoneda: string, valor: number): Promise<Cotizacion> {
    const res = await api.put(`${BASE_URL}/${codigoMoneda}`, { valor });
    return res.data;
  }
};
