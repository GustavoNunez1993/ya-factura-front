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
    const res = await api.get(`/caja/abierta/${nroCaja}`);
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
