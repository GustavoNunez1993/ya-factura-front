import api from "./api";

export interface Banco {
  id?: string;
  codigo?: string | null;
  descripcion: string;
  active?: boolean;
}

const BASE_URL = "/bancos";

export const BancoService = {
  async getAll(): Promise<Banco[]> {
    const res = await api.get(BASE_URL);
    return res.data ?? [];
  },

  async getById(id: string): Promise<Banco> {
    const res = await api.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  async create(data: Banco): Promise<Banco> {
    const res = await api.post(BASE_URL, data);
    return res.data;
  },

  async update(id: string, data: Banco): Promise<Banco> {
    const res = await api.put(`${BASE_URL}/${id}`, data);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  }
};
