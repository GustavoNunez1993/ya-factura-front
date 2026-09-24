import api from "./api";

export interface CajaAperturaCierrePayload {
  empresaId: string | null;
  fechaApertura: string;
  montoApertura: number;
  nroCaja: number;
  estado: "ABIERTA";
  usuarioAperturaId?: string | number | null;
}

export interface CajaAperturaCierreFiltros {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
}

export interface LineaMonto {
  forma: string;
  monto: number;
}

export interface ComprobantesPorTipo {
  /** iTiDE: 1 FE · 4 AFE · 5 NCE · 6 NDE · 7 NRE. */
  tipo: number;
  emitidos: number;
  anulados: number;
  total: number;
}

/** Arqueo de una apertura de caja (GET /caja/{id}/resumen y respuesta del cierre). */
export interface CajaResumen {
  aperturaId: string;
  nroCaja: number;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: string;
  montoApertura: number;
  ventasPorForma: LineaMonto[];
  cobrosCuentaCorriente: LineaMonto[];
  egresosPorForma: LineaMonto[];
  totalVentas: number;
  totalCobros: number;
  totalEgresos: number;
  efectivoEsperado: number;
  montoCierre: number | null;
  diferencia: number | null;
  observacionCierre: string | null;
  comprobantes: ComprobantesPorTipo[];
}

export const CajaAperturaCierreService = {
  async getPaginated(
    page: number,
    size: number,
    search: string = "",
    filtros: CajaAperturaCierreFiltros = {}
  ) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/caja", {
      params: {
        empresaId,
        page,
        size,
        search,
        fechaDesde: filtros.fechaDesde || undefined,
        fechaHasta: filtros.fechaHasta || undefined,
        estado: filtros.estado || undefined
      }
    });

    return res.data;
  },

  async getCajaAbierta(nroCaja: number) {
    // Con empresaId el back busca la caja de ESTA empresa (el nroCaja solo no alcanza).
    const empresaId = localStorage.getItem("empresaId") || undefined;
    const res = await api.get(`/caja/abierta/${nroCaja}`, { params: { empresaId } });
    return res.data;
  },

  async getResumen(aperturaId: string): Promise<CajaResumen> {
    const empresaId = localStorage.getItem("empresaId") || undefined;
    const res = await api.get(`/caja/${aperturaId}/resumen`, { params: { empresaId } });
    return res.data;
  },

  /** Cierra la caja con el efectivo contado. Después no se puede emitir contra ella. */
  async cerrar(aperturaId: string, montoCierre: number, observacion?: string, usuarioCierreId?: string): Promise<CajaResumen> {
    const res = await api.post(`/caja/${aperturaId}/cierre`, {
      empresaId: localStorage.getItem("empresaId"),
      montoCierre,
      observacion,
      usuarioCierreId
    });
    return res.data;
  },

  async getMovimientos(aperturaId: string) {
    const res = await api.get(`/caja/${aperturaId}/movimientos`);
    return res.data;
  },

  async registrarMovimientos(nroCaja: number, data: any) {
    const res = await api.post(`/caja/${nroCaja}/movimientos`, data);
    return res.data;
  },

  async create(data: CajaAperturaCierrePayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/caja", {
      ...data,
      empresaId
    });

    return res.data;
  }
};
