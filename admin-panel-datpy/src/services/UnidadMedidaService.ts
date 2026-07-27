import api from "./api";

export const UnidadMedidaService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/unidad-medida", {
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

  const res = await api.get("/unidad-medida/all", {
    params: { empresaId }
  });

  return res.data ?? [];
},

  async create(data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post(
      "/unidad-medida",
      data,
      {
        params: { empresaId }
      }
    );

    return res.data;
  },

  async update(id: string, data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.put(
      `/unidad-medida/${id}`,
      data,
      {
        params: { empresaId }
      }
    );

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    await api.delete(
      `/unidad-medida/${id}`,
      {
        params: { empresaId }
      }
    );
  }
};