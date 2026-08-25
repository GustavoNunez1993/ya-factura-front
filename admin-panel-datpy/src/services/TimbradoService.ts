import api from "./api";

export interface Timbrado {
  id: string;
  establecimiento: string;
  puntoExpedicion: string;
  tipoDocumento: number;
  numeroTimbrado: string;
  serieActual: string | null;
  ultimoNumeroUsado: number;
  activo: boolean;
}

export interface TimbradoPayload {
  empresaId: string;
  establecimiento: string;
  puntoExpedicion: string;
  tipoDocumento: number;
  numeroTimbrado: string;
}

export const TimbradoService = {
  async listar(empresaId: string): Promise<Timbrado[]> {
    const res = await api.get("/timbrados", { params: { empresaId } });
    return res.data;
  },

  async crear(payload: TimbradoPayload): Promise<Timbrado> {
    const res = await api.post("/timbrados", payload);
    return res.data;
  },

  async desactivar(id: string) {
    const res = await api.patch(`/timbrados/${id}/desactivar`);
    return res.data;
  }
};
