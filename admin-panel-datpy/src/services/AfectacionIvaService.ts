import api from "./api";

export const AfectacionIvaService = {
  async getAll() {
    const res = await api.get("/afectacion-iva");
    return res.data ?? [];
  }
};