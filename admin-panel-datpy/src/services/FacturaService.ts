import api from "./api";

export interface FacturaListadoFiltros {
  fechaDesde?: string;
  fechaHasta?: string;
  condicionVenta?: string;
  rucCliente?: string;
}

export const FacturaService = {
  async create(data: any) {
    const res = await api.post("/facturas", data);
    return res.data;
  },

  async getPaginated(
    page: number,
    size: number,
    search: string = "",
    filtros: FacturaListadoFiltros = {}
  ) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/facturas", {
      params: {
        empresaId,
        page,
        size,
        search,
        fechaDesde: filtros.fechaDesde || undefined,
        fechaHasta: filtros.fechaHasta || undefined,
        condicionVenta: filtros.condicionVenta || undefined,
        rucCliente: filtros.rucCliente || undefined
      }
    });

    return res.data;
  },

  async getById(id: string) {
    const res = await api.get(`/facturas/${id}`);
    return res.data;
  }
};
