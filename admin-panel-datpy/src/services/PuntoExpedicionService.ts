import api from "./api";

export interface NumeracionDocumento {
  id: string;
  tipoDocumento: number;
  ultimoNumeroUsado: number;
  serieActual: string | null;
}

/** Establecimiento + punto de expedición, con el timbrado que usa y la numeración de cada tipo de documento. */
export interface PuntoExpedicion {
  id: string;
  establecimiento: string;
  puntoExpedicion: string;
  descripcion: string | null;
  activo: boolean;
  timbrado: { id: string; numeroTimbrado: string; fechaInicioVigencia: string; activo: boolean };
  numeraciones: NumeracionDocumento[];
}

export interface PuntoExpedicionPayload {
  empresaId?: string;
  establecimiento?: string;
  puntoExpedicion?: string;
  timbradoId: string;
  descripcion: string;
}

/** Número probable del próximo documento (no queda reservado). dSerieNum es null sin serie. */
export interface SiguienteNumero {
  dNumDoc: string;
  dSerieNum: string | null;
}

export interface InutilizarPayload {
  numeroHasta: number;
  motivo: string;
}

export interface EventoInutilizacionResultado {
  estado: string | null;
  codigoRespuesta: string | null;
  mensajeRespuesta: string | null;
}

export const codigoPunto = (p: { establecimiento: string; puntoExpedicion: string }) =>
  `${p.establecimiento}-${p.puntoExpedicion}`;

export const PuntoExpedicionService = {
  async listar(empresaId: string): Promise<PuntoExpedicion[]> {
    const res = await api.get("/puntos-expedicion", { params: { empresaId } });
    return res.data;
  },

  /** Opciones "001-001" de los puntos desde los que hoy se puede emitir (punto y timbrado activos). */
  async opcionesActivas(empresaId: string): Promise<{ label: string; value: string }[]> {
    const puntos = await PuntoExpedicionService.listar(empresaId);
    return puntos
      .filter((p) => p.activo && p.timbrado.activo)
      .map((p) => {
        const codigo = codigoPunto(p);
        return { label: p.descripcion ? `${codigo} · ${p.descripcion}` : codigo, value: codigo };
      });
  },

  async crear(payload: PuntoExpedicionPayload): Promise<PuntoExpedicion> {
    const res = await api.post("/puntos-expedicion", payload);
    return res.data;
  },

  /** Descripción y timbrado (el timbrado sólo mientras el punto no haya emitido documentos). */
  async actualizar(id: string, payload: PuntoExpedicionPayload): Promise<PuntoExpedicion> {
    const res = await api.put(`/puntos-expedicion/${id}`, payload);
    return res.data;
  },

  async cambiarEstado(id: string, activo: boolean): Promise<PuntoExpedicion> {
    const res = await api.patch(`/puntos-expedicion/${id}/${activo ? "activar" : "desactivar"}`);
    return res.data;
  },

  async siguienteNumero(
    empresaId: string,
    establecimiento: string,
    puntoExpedicion: string,
    tipoDocumento = 1
  ): Promise<SiguienteNumero> {
    const res = await api.get("/puntos-expedicion/siguiente-numero", {
      params: { empresaId, establecimiento, puntoExpedicion, tipoDocumento }
    });
    return res.data;
  },

  async inutilizar(numeracionId: string, payload: InutilizarPayload): Promise<EventoInutilizacionResultado> {
    const res = await api.post(`/puntos-expedicion/numeraciones/${numeracionId}/inutilizar`, payload);
    return res.data;
  }
};
