import api from "./api";

export interface CondicionVenta {
  id: string;
  tipoOperacion: number;
  descripcion: string;
  tipoCondicionCredito: number | null;
  cantidadCuotas: number | null;
  intervaloDias: number | null;
  tieneCuotaInicial: boolean;
  montoCuotaInicial: number | null;
  predeterminada: boolean;
  active: boolean;
}

export interface CondicionVentaPayload {
  tipoOperacion: number;
  descripcion: string;
  tipoCondicionCredito?: number | null;
  cantidadCuotas?: number | null;
  intervaloDias?: number | null;
  tieneCuotaInicial?: boolean;
  montoCuotaInicial?: number | null;
  predeterminada?: boolean;
}

export const CondicionVentaService = {
  async getPaginated(page: number, size: number) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/condiciones-venta", {
      params: { empresaId, page, size }
    });

    return res.data;
  },

  async getActivas(): Promise<CondicionVenta[]> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/condiciones-venta/activas", {
      params: { empresaId }
    });

    return res.data;
  },

  async create(data: CondicionVentaPayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/condiciones-venta", { ...data, empresaId });

    return res.data;
  },

  async update(id: string, data: CondicionVentaPayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.put(`/condiciones-venta/${id}`, { ...data, empresaId });

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/condiciones-venta/${id}`, {
      params: { empresaId }
    });

    return res.data;
  }
};
