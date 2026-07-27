import api from "./api";

export interface RegistrarPagoCuentaCorrienteItem {
  facturaId: string;
  montoPago: number;
}

export interface RegistrarPagoCuentaCorrientePayload {
  clienteId: string;
  items: RegistrarPagoCuentaCorrienteItem[];
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
  }
};
