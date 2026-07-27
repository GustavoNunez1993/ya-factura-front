import api from "./api";

export const PersonaService = {
  async getPaginated(page: number, size: number, search = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/personas", {
      params: {
        empresaId,
        page,
        size,
        search
      }
    });

    return res.data;
  },

  async getById(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(`/personas/${id}`, {
      params: { empresaId }
    });

    return res.data;
  },

  async create(data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const payload = {
      ...data,
      empresaId
    };

    const res = await api.post("/personas", payload);

    return res.data;
  },

  async update(id: string, data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const payload = {
      ...data,
      empresaId
    };

    const res = await api.put(`/personas/${id}`, payload);

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/personas/${id}`, {
      params: { empresaId }
    });

    return res.data;
  }
};