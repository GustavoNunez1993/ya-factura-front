import api from "./api";

export const VarianteProductoService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/variantes-producto", {
      params: {
        empresaId,
        page,
        size,
        search
      }
    });

    return {
      ...res.data,
      content: res.data.content ?? []
    };
  },

  async getAll() {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/variantes-producto/findAll", {
      params: { empresaId }
    });

    return res.data ?? [];
  },

  async getById(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(`/variantes-producto/${id}`, {
      params: { empresaId }
    });

    return res.data;
  },

  async create(data: { productoId: string; colorId: string; talleId: string }) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/variantes-producto", data, {
      params: { empresaId }
    });

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/variantes-producto/${id}`, {
      params: { empresaId }
    });

    return res.data;
  }
};
