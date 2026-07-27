import api from "./api";

export const CiudadesService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const res = await api.get("/ciudades", {
      params: {
        page,
        size,
        search
      }
    });

    return res.data;
  },

  async getAll() {
    const res = await api.get("/ciudades", {
      params: {
        page: 0,
        size: 1000,
        search: ""
      }
    });

    return res.data?.content ?? [];
  },

  async getByDistritoId(distritoId: string) {
    const res = await api.get(`/ciudades/distrito/${distritoId}`);
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get(`/ciudades/${id}`);
    return res.data;
  },

  async create(data: any) {
    const res = await api.post("/ciudades", data);
    return res.data;
  },

  async update(id: string, data: any) {
    const res = await api.put(`/ciudades/${id}`, data);
    return res.data;
  },

  async remove(id: string) {
    const res = await api.delete(`/ciudades/${id}`);
    return res.data;
  }
};