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
  urlRecepcion: string | null;
  urlConsultaLote: string | null;
  urlConsultaDe: string | null;
  urlEventos: string | null;
}

export interface FirmadorAmbientePayload {
  ambiente: "TEST" | "PRODUCCION";
  habilitado: boolean;
  urlRecepcion?: string;
  urlConsultaLote?: string;
  urlConsultaDe?: string;
  urlEventos?: string;
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
