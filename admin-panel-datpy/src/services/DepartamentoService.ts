import api from "./api";

export interface Distrito {
  id: string | number;
  codigo?: string | number;
  descripcion?: string;
}

export interface Departamento {
  id: string | number;
  codigo: number;
  descripcion: string;
  distritos?: Distrito[];
}

const BASE_URL = "/departamentos";

export const DepartamentoService = {
  async getByPaisId(paisId: string): Promise<Departamento[]> {
    const res = await api.get(`${BASE_URL}/pais/${paisId}`);
    return res.data ?? [];
  }
};