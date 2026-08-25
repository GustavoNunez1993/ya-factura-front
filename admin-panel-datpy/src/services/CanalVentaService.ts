import api from "./api";

export interface CanalVenta {
  id?: string;
  codigo?: string | null;
  descripcion: string;
  active?: boolean;
}

const BASE_URL = "/canales-venta";

export const CanalVentaService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(BASE_URL, {
      params: { empresaId, page, size, search }
    });

    return res.data;
  },

  async getAll(): Promise<CanalVenta[]> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(`${BASE_URL}/findAll`, {
      params: { empresaId }
    });

    return res.data ?? [];
  },

  async create(data: CanalVenta): Promise<CanalVenta> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post(BASE_URL, data, {
      params: { empresaId }
    });

    return res.data;
  },

  async update(id: string, data: CanalVenta): Promise<CanalVenta> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.put(`${BASE_URL}/${id}`, data, {
      params: { empresaId }
    });

    return res.data;
  },

  async remove(id: string): Promise<void> {
    const empresaId = localStorage.getItem("empresaId");

    await api.delete(`${BASE_URL}/${id}`, {
      params: { empresaId }
    });
  }
};
