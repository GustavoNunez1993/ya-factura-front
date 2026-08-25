import api from "./api";

export interface ActividadEconomica {
  id: string;
  codigo: string;
  descripcion: string;
}

export interface ActividadEconomicaPayload {
  empresaId: string;
  codigo: string;
  descripcion: string;
}

export const EmpresaActividadEconomicaService = {
  async listar(empresaId: string): Promise<ActividadEconomica[]> {
    const res = await api.get("/actividades-economicas", { params: { empresaId } });
    return res.data;
  },

  async crear(payload: ActividadEconomicaPayload): Promise<ActividadEconomica> {
    const res = await api.post("/actividades-economicas", payload);
    return res.data;
  },

  async eliminar(id: string) {
    const res = await api.delete(`/actividades-economicas/${id}`);
    return res.data;
  }
};
