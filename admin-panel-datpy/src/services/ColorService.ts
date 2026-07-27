import api from "./api";

const mapColorResponse = (color: any) => ({
  ...color,
  colorHex: color.valorHexadecimal ?? color.colorHex
});

const mapColorRequest = (data: any) => ({
  ...data,
  valorHexadecimal: data.colorHex ?? data.valorHexadecimal
});

export const ColorService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/colores", {
      params: {
        empresaId,
        page,
        size,
        search
      }
    });

    return {
      ...res.data,
      content: (res.data.content ?? []).map(mapColorResponse)
    };
  },

  async getById(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(`/colores/${id}`, {
      params: { empresaId }
    });

    return mapColorResponse(res.data);
  },

  async create(data: any) {
    const empresaId = localStorage.getItem("empresaId");
    const payload = mapColorRequest(data);

    const res = await api.post("/colores", payload, {
      params: { empresaId }
    });

    return mapColorResponse(res.data);
  },

  async update(id: string, data: any) {
    const empresaId = localStorage.getItem("empresaId");
    const payload = mapColorRequest(data);

    const res = await api.put(`/colores/${id}`, payload, {
      params: { empresaId }
    });

    return mapColorResponse(res.data);
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/colores/${id}`, {
      params: { empresaId }
    });

    return res.data;
  }
};
