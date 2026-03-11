import api from "./api";

export const SubFamiliaService = {

  async getPaginated(page: number, size: number, search: string = "") {

    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/sub-familias", {
      params: {
        empresaId,
        page,
        size,
        search
      }
    });

    return res.data;
  },

  async create(data: any) {

    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post(
      "/sub-familias",
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
      `/sub-familias/${id}`,
      data,
      {
        params: { empresaId }
      }
    );

    return res.data;
  },

  async remove(id: string) {

    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(
      `/sub-familias/${id}`,
      {
        params: { empresaId }
      }
    );

    return res.data;
  }

};