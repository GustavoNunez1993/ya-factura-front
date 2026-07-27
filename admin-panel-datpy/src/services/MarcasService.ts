import api from "./api";

export const MarcaService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/marcas", {
      params: {
        empresaId,
        page,
        size,
        search
      }
    });

    return res.data;
  },

  async getAll() {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/marcas/MarcasfindAll", {
      params: { empresaId }
    });

    return res.data ?? [];
  },

  async getAllPaginated(page: number, size: number) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/marcas/empresa/paginado", {
      params: {
        empresaId,
        page,
        size
      }
    });

    return res.data;
  },

  async getById(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(`/marcas/${id}`, {
      params: { empresaId }
    });

    return res.data;
  },

  async create(data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/marcas", data, {
      params: { empresaId }
    });

    return res.data;
  },

  async update(id: string, data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.put(`/marcas/${id}`, data, {
      params: { empresaId }
    });

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/marcas/${id}`, {
      params: { empresaId }
    });

    return res.data;
  }
};