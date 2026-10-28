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

/** moneda = ISO 4217 (PYG, USD, BRL, EUR): la caja nunca suma monedas distintas. */
export interface LineaMonto {
  forma: string;
  moneda: string;
  monto: number;
}

export interface MontoMonedaCaja {
  moneda: string;
  monto: number;
}

/** Efectivo de una moneda: contado y diferencia son null mientras la caja está abierta. */
export interface ArqueoMoneda {
  moneda: string;
  efectivoEsperado: number;
  montoContado: number | null;
  diferencia: number | null;
}

export interface ComprobantesPorTipo {
  /** iTiDE: 1 FE · 4 AFE · 5 NCE · 6 NDE · 7 NRE. */
  tipo: number;
  emitidos: number;
  anulados: number;
  /** Total de los vigentes, por moneda. */
  totales: MontoMonedaCaja[];
}

export type ModoControlCaja = "POR_FECHA" | "CAJA_ABIERTA" | "SIN_CAJA";

/** GET /caja/estado: si se puede emitir y, si no, el motivo y qué hacer (APERTURA o CIERRE). */
export interface CajaEstado {
  modo: ModoControlCaja;
  puedeEmitir: boolean;
  motivo: string | null;
  accion: "APERTURA" | "CIERRE" | null;
  aperturaId: string | null;
  fechaApertura: string | null;
}

/** Arqueo de una apertura de caja (GET /caja/{id}/resumen y respuesta del cierre). */
export interface CajaResumen {
  aperturaId: string;
  nroCaja: number;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: string;
  /** En guaraníes. */
  montoApertura: number;
  ventasPorForma: LineaMonto[];
  cobrosCuentaCorriente: LineaMonto[];
  egresosPorForma: LineaMonto[];
  totalVentas: MontoMonedaCaja[];
  totalCobros: MontoMonedaCaja[];
  totalEgresos: MontoMonedaCaja[];
  /** Guaraníes primero; después cada moneda que tuvo efectivo. */
  arqueo: ArqueoMoneda[];
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

  /** Si la empresa puede emitir según su control de caja (por fecha, con caja abierta o sin caja). */
  async getEstado(nroCaja: number): Promise<CajaEstado> {
    const res = await api.get(`/caja/estado/${nroCaja}`, { params: { empresaId: localStorage.getItem("empresaId") } });
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

  /**
   * Cierra la caja con el efectivo contado de cada moneda del arqueo ({ PYG: ..., EUR: ... }).
   * Después no se puede emitir contra ella.
   */
  async cerrar(
    aperturaId: string,
    efectivoContado: Record<string, number>,
    observacion?: string,
    usuarioCierreId?: string
  ): Promise<CajaResumen> {
    const res = await api.post(`/caja/${aperturaId}/cierre`, {
      empresaId: localStorage.getItem("empresaId"),
      montoCierre: efectivoContado.PYG,
      efectivoContado,
      observacion,
      usuarioCierreId
    });
    return res.data;
  },

  /** Anula una apertura hecha por error (sólo abierta y sin comprobantes, movimientos ni cobros). */
  async anular(aperturaId: string, motivo: string, usuarioId?: string | null): Promise<void> {
    await api.post(`/caja/${aperturaId}/anulacion`, {
      empresaId: localStorage.getItem("empresaId"),
      motivo,
      usuarioId: usuarioId ?? undefined
    });
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
