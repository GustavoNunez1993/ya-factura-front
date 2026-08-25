import api from "./api";

export interface RegistrarPagoCuentaCorrienteItem {
  facturaId: string;
  montoPago: number;
}

export interface RegistrarPagoCuentaCorrienteFormaPago {
  tipoPagoId: number;
  descripcion: string;
  monto: number;
  referencia?: string | null;
}

export interface RegistrarPagoCuentaCorrientePayload {
  clienteId: string;
  items: RegistrarPagoCuentaCorrienteItem[];
  formasPago: RegistrarPagoCuentaCorrienteFormaPago[];
}

export interface FormaPagoResumen {
  descripcion: string;
  monto: number;
}

export interface CobroReciente {
  id: string;
  clienteNombre: string;
  facturaNumero: string;
  monto: number;
  fecha: string;
  hora: string;
}

export interface CobrosResumen {
  totalCobrado: number;
  totalPendiente: number;
  porFormaPago: FormaPagoResumen[];
  ultimosCobros: CobroReciente[];
}

export const CuentaCorrienteService = {
  async getFacturasPendientesCliente(clienteId: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(
      `/cuenta-corriente/clientes/${clienteId}/facturas-pendientes`,
      {
        params: { empresaId }
      }
    );

    return res.data;
  },

  async registrarPagoCliente(data: RegistrarPagoCuentaCorrientePayload) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.post("/cuenta-corriente/clientes/pagos", {
      ...data,
      empresaId,
      nroCaja: 1
    });

    return res.data;
  },

  async getResumenCobros(fechaDesde: string, fechaHasta: string): Promise<CobrosResumen> {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/cuenta-corriente/cobros/resumen", {
      params: { empresaId, fechaDesde, fechaHasta }
    });

    return res.data;
  }
};
