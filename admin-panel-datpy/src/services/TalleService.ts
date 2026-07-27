import api from "./api";

export const TalleService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/talles", {
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

  async getById(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(`/talles/${id}`, {
      params: { empresaId }
    });

    return res.data;
  },

  async create(data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/talles", data, {
      params: { empresaId }
    });

    return res.data;
  },

  async update(id: string, data: any) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.put(`/talles/${id}`, data, {
      params: { empresaId }
    });

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/talles/${id}`, {
      params: { empresaId }
    });

    return res.data;
  }
};
