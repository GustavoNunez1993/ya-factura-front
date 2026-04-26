import api from "./api";

export interface Distrito {
  id: string;
  codigo: number;
  descripcion: string;
}

const BASE_URL = "/distritos";

export const DistritoService = {
  async getByDepartamentoId(departamentoId: string): Promise<Distrito[]> {
    const res = await api.get(`${BASE_URL}/departamento/${departamentoId}`);
    return res.data ?? [];
  }
};