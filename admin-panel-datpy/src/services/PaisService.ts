import api from "./api";

export interface Departamento {
  id: string | number;
  codigo?: string;
  descripcion?: string;
}

export interface Pais {
  id: string | number;
  codigo: string;
  descripcion: string;
  departamentos?: Departamento[];
}

const BASE_URL = "/paises";

export const PaisService = {
  async getAll(): Promise<Pais[]> {
    const res = await api.get(BASE_URL);
    return res.data ?? [];
  }
};