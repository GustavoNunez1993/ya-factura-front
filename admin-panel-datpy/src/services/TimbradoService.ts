import api from "./api";

/** Timbrado otorgado por la SET. Los puntos de expedición lo eligen; la numeración vive en cada punto. */
export interface Timbrado {
  id: string;
  numeroTimbrado: string;
  /** yyyy-MM-dd: viaja en el XML como dFeIniT. */
  fechaInicioVigencia: string;
  activo: boolean;
  /** Cantidad de puntos de expedición que emiten con este timbrado. */
  puntosExpedicion: number;
}

export interface TimbradoPayload {
  empresaId?: string;
  numeroTimbrado?: string;
  fechaInicioVigencia: string;
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

  /** Sólo la fecha de inicio de vigencia: el número no se edita. */
  async actualizar(id: string, payload: TimbradoPayload): Promise<Timbrado> {
    const res = await api.put(`/timbrados/${id}`, payload);
    return res.data;
  },

  async cambiarEstado(id: string, activo: boolean): Promise<Timbrado> {
    const res = await api.patch(`/timbrados/${id}/${activo ? "activar" : "desactivar"}`);
    return res.data;
  }
};
