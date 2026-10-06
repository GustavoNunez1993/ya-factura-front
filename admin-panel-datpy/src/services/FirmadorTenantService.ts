import api from "./api";

export interface FirmadorTenant {
  id: string;
  codigo: string;
  razonSocial: string;
  nombreFantasia: string | null;
  ruc: string;
  dv: string | null;
  email: string | null;
  telefono: string | null;
  estado: string;
}

export interface FirmadorTenantPayload {
  codigo: string;
  razonSocial: string;
  nombreFantasia?: string;
  ruc: string;
  dv?: string;
  email?: string;
  telefono?: string;
}

export interface FirmadorAmbiente {
  id: string;
  tenantId: string;
  ambiente: "TEST" | "PRODUCCION";
  habilitado: boolean;
  /** URLs fijas de la SET para el ambiente (informativas, no se configuran). */
  urlRecepcion: string | null;
  urlConsultaLote: string | null;
  urlConsultaDe: string | null;
  urlEventos: string | null;
  /** Identificador del CSC entregado por la SET (4 dígitos). El CSC en sí nunca se devuelve. */
  idCsc: string | null;
  /** true si el ambiente ya tiene un CSC cargado. */
  cscConfigurado: boolean;
}

export interface FirmadorAmbientePayload {
  ambiente: "TEST" | "PRODUCCION";
  habilitado: boolean;
  /** Código de Seguridad del Contribuyente (secreto de la SET) para el hash del QR. En update, si va vacío no se toca. */
  csc?: string;
  /** Identificador del CSC (4 dígitos). */
  idCsc?: string;
}

export interface FirmadorCertificado {
  id: string;
  tenantId: string;
  alias: string;
  ruc: string;
  subjectDn: string;
  validFrom: string;
  validTo: string;
  predeterminado: boolean;
  estado: string;
}

export const FirmadorTenantService = {
  async listar(page: number = 0, size: number = 50) {
    const res = await api.get("/firmador/tenants", { params: { page, size } });
    return res.data;
  },

  async crear(payload: FirmadorTenantPayload): Promise<FirmadorTenant> {
    const res = await api.post("/firmador/tenants", payload);
    return res.data;
  },

  async listarAmbientes(tenantId: string): Promise<FirmadorAmbiente[]> {
    const res = await api.get(`/firmador/tenants/${tenantId}/ambientes`);
    return res.data;
  },

  async crearAmbiente(tenantId: string, payload: FirmadorAmbientePayload): Promise<FirmadorAmbiente> {
    const res = await api.post(`/firmador/tenants/${tenantId}/ambientes`, payload);
    return res.data;
  },

  async actualizarAmbiente(
    tenantId: string,
    ambienteId: string,
    payload: Omit<FirmadorAmbientePayload, "ambiente">
  ): Promise<FirmadorAmbiente> {
    const res = await api.put(`/firmador/tenants/${tenantId}/ambientes/${ambienteId}`, payload);
    return res.data;
  },

  async listarCertificados(tenantId: string, page: number = 0, size: number = 50) {
    const res = await api.get(`/firmador/tenants/${tenantId}/certificados`, { params: { page, size } });
    return res.data;
  },

  async subirCertificado(
    tenantId: string,
    metadata: { alias: string; ruc: string; passwordSecretReference: string; predeterminado: boolean },
    password: string,
    file: File
  ): Promise<FirmadorCertificado> {
    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("password", password);
    formData.append("file", file);

    const res = await api.post(`/firmador/tenants/${tenantId}/certificados`, formData);
    return res.data;
  },

  async marcarCertificadoPredeterminado(tenantId: string, certificadoId: string): Promise<FirmadorCertificado> {
    const res = await api.post(`/firmador/tenants/${tenantId}/certificados/${certificadoId}/predeterminado`);
    return res.data;
  }
};
