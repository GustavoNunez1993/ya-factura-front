import api from "./api";

export const EmpresaService = {
  async obtenerActual() {
    const empresaId = localStorage.getItem("empresaId");
    const res = await api.get(`/empresas/${empresaId}`);
    return res.data;
  },

  async actualizar(id: string, payload: Record<string, unknown>) {
    const res = await api.put(`/empresas/${id}`, payload);
    return res.data;
  }
};
