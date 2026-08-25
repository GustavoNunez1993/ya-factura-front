import api from "./api";

export interface StockItem {
  id: string;
  productoId: string;
  productoDescripcion: string;
  depositoId: string;
  depositoNombre: string;
  stockActualUnitario: number;
  stockActualCaja: number;
  ultimaActualizacion: string;
  vencimiento: string | null;
  lote: string | null;
}

export interface StockIngresoPayload {
  productoId: string;
  depositoId: string;
  cantidadUnitario: number;
  cantidadCaja?: number;
  vencimiento?: string | null;
  lote?: string | null;
}

export interface StockIngresoLoteItem {
  productoId: string;
  depositoId: string;
  cantidadUnitario: number;
  cantidadCaja?: number;
  vencimiento?: string | null;
  lote?: string | null;
}

export interface StockIngresoLotePayload {
  items: StockIngresoLoteItem[];
}

export interface StockAjustePayload {
  stockActualUnitario: number;
  stockActualCaja?: number;
}

export interface StockTransferenciaPayload {
  depositoDestinoId: string;
  cantidadUnitario: number;
  cantidadCaja?: number;
  motivo: string;
}

export interface StockTransferenciaResolucionPayload {
  observacion?: string | null;
}

export interface StockTransferencia {
  id: string;
  productoDescripcion: string;
  depositoOrigenNombre: string;
  depositoDestinoNombre: string;
  cantidadUnitario: number;
  cantidadCaja: number;
  vencimiento: string | null;
  lote: string | null;
  motivo: string;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  solicitadoPorNombre: string | null;
  aprobadoPorNombre: string | null;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  observacionResolucion: string | null;
}

export const StockService = {
  async getPaginated(page: number, size: number, productoId?: string, depositoId?: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/stock", {
      params: { empresaId, page, size, productoId, depositoId }
    });

    return res.data;
  },

  async getPorVencer(dias: number = 15): Promise<StockItem[]> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/stock/por-vencer", {
      params: { empresaId, dias }
    });

    return res.data;
  },

  async registrarIngreso(data: StockIngresoPayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/stock/ingresos", { ...data, empresaId });

    return res.data;
  },

  async registrarIngresoLote(data: StockIngresoLotePayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/stock/ingresos/lote", { ...data, empresaId });

    return res.data;
  },

  async ajustar(id: string, data: StockAjustePayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.put(`/stock/${id}/ajuste`, data, {
      params: { empresaId }
    });

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/stock/${id}`, {
      params: { empresaId }
    });

    return res.data;
  },

  async transferir(id: string, data: StockTransferenciaPayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post(`/stock/${id}/transferencia`, data, {
      params: { empresaId }
    });

    return res.data;
  },

  async getPaginatedTransferencias(page: number, size: number, estado?: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/stock/transferencias", {
      params: { empresaId, page, size, estado }
    });

    return res.data;
  },

  async aprobarTransferencia(id: string, data: StockTransferenciaResolucionPayload = {}) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post(`/stock/transferencias/${id}/aprobar`, data, {
      params: { empresaId }
    });

    return res.data;
  },

  async rechazarTransferencia(id: string, data: StockTransferenciaResolucionPayload = {}) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post(`/stock/transferencias/${id}/rechazar`, data, {
      params: { empresaId }
    });

    return res.data;
  }
};
