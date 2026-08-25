import api from "./api";

export interface Deposito {
  id: string;
  nombre: string;
  direccion: string | null;
  active: boolean;
  esPrincipal: boolean;
}

export interface DepositoPayload {
  nombre: string;
  direccion?: string;
  esPrincipal?: boolean;
}

export const DepositoService = {
  async getPaginated(page: number, size: number) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/depositos", {
      params: { empresaId, page, size }
    });

    return res.data;
  },

  async getActivos(): Promise<Deposito[]> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/depositos/activos", {
      params: { empresaId }
    });

    return res.data;
  },

  async create(data: DepositoPayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/depositos", { ...data, empresaId });

    return res.data;
  },

  async update(id: string, data: DepositoPayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.put(`/depositos/${id}`, { ...data, empresaId });

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/depositos/${id}`, {
      params: { empresaId }
    });

    return res.data;
  }
};
