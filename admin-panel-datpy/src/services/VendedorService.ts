import api from "./api";
import type { Cargo } from "./CargoService";

export interface Vendedor {
  id?: string;
  codigo?: string | null;
  nombre: string;
  celular?: string | null;
  direccion?: string | null;
  email?: string | null;
  cargo?: Cargo | null;
  cargoId?: string | null;
  active?: boolean;
}

const BASE_URL = "/vendedores";

export const VendedorService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(BASE_URL, {
      params: { empresaId, page, size, search }
    });

    return res.data;
  },

  async getAll(): Promise<Vendedor[]> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(`${BASE_URL}/findAll`, {
      params: { empresaId }
    });

    return res.data ?? [];
  },

  async create(data: Vendedor): Promise<Vendedor> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post(BASE_URL, data, {
      params: { empresaId }
    });

    return res.data;
  },

  async update(id: string, data: Vendedor): Promise<Vendedor> {
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
