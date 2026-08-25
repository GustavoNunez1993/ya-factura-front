import api from "./api";

export const ProveedorService = {
  async getPaginated(page: number, size: number, search = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/proveedores", {
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

    const res = await api.get(`/proveedores/${id}`, {
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

    const res = await api.post("/proveedores", payload);

    return res.data;
  },

  async update(id: string, data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const payload = {
      ...data,
      empresaId
    };

    const res = await api.put(`/proveedores/${id}`, payload);

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/proveedores/${id}`, {
      params: { empresaId }
    });

    return res.data;
  }
};
