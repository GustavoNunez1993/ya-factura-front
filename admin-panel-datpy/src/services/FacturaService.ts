import api from "./api";

export interface FacturaListadoFiltros {
  fechaDesde?: string;
  fechaHasta?: string;
  condicionVenta?: string;
  rucCliente?: string;
  tipoDocumento?: number;
  /** Varios tipos a la vez (filtro múltiple); se combina con tipoDocumento. */
  tiposDocumento?: number[];
  /** true = todos los documentos electrónicos menos las facturas. */
  excluirFacturas?: boolean;
  /** true = sólo aprobados por SIFEN (facturas sobre las que emitir NC/ND). */
  soloAprobadas?: boolean;
}

/** Tipos de documento electrónico (iTiDE) que emite el sistema. */
export const TIPOS_DOCUMENTO_ELECTRONICO: Record<number, string> = {
  1: "Factura",
  4: "Autofactura",
  5: "Nota de crédito",
  6: "Nota de débito",
  7: "Nota de remisión"
};

/**
 * Color e ícono de cada tipo de documento: los mismos en el dashboard y en los listados, para
 * que un tipo se reconozca igual en todo el sistema.
 */
export const ESTILO_TIPO_DOCUMENTO: Record<number, { color: string; icon: string }> = {
  1: { color: "#2563eb", icon: "pi pi-receipt" },
  4: { color: "#7c3aed", icon: "pi pi-shopping-bag" },
  5: { color: "#f59e0b", icon: "pi pi-replay" },
  6: { color: "#dc2626", icon: "pi pi-plus-circle" },
  7: { color: "#0d9488", icon: "pi pi-truck" }
};

export const estiloTipoDocumento = (tipo?: number) =>
  ESTILO_TIPO_DOCUMENTO[tipo ?? 1] ?? { color: "#64748b", icon: "pi pi-file" };

export const nombreTipoDocumento = (tipo?: number) =>
  TIPOS_DOCUMENTO_ELECTRONICO[tipo ?? 1] ?? `Tipo ${tipo}`;

/** Ítem de NC parcial: cantidad devuelta (al precio original) o importe a acreditar. */
export type NotaCreditoItemPayload =
  | { detalleId: string; cantidad: number; monto?: undefined }
  | { detalleId: string; monto: number; cantidad?: undefined };

export interface NotaCreditoPayload {
  /** iMotEmi 1..8 (ver MOTIVOS_NOTA_CREDITO). */
  motivoEmision: number;
  dInfAdic?: string;
  items?: NotaCreditoItemPayload[];
  reponerStock?: boolean;
  nroCaja?: number;
  /** Devolver el dinero por caja (por defecto sí, si la factura fue contado). */
  reintegrarEnCaja?: boolean;
  formaReintegro?: string;
}

export interface NotaDebitoPayload {
  /** iMotEmi 1..8 (misma tabla que la NC). */
  motivoEmision: number;
  dInfAdic?: string;
  items: { productoId: string; cantidad: number; precioUnitario: number; dInfItem?: string }[];
  nroCaja?: number;
}

export interface AutofacturaPayload {
  empresaId: string;
  dEst: string;
  dPunExp: string;
  /** 10 Compra de productos · 11 Compra de servicios. */
  tipoTransaccionId: number;
  /** 1 Contado · 2 Crédito. */
  condicionOperacionId: number;
  iCondCred?: number;
  dPlazoCre?: string;
  dInfAdic?: string;
  /** Si se indica, la mercadería ingresa al stock de ese depósito. */
  depositoId?: string;
  nroCaja?: number;
  /** Contado: cómo se le paga al vendedor; sale de la caja abierta. */
  formaPago?: string;
  vendedor: {
    naturaleza: number;
    tipoDocumento: number;
    nroDocumento: string;
    nombre: string;
    direccion: string;
    numeroCasa: number;
    ciudadId: string;
    direccionTransaccion?: string;
    ciudadTransaccionId?: string;
  };
  items: { productoId: string; cantidad: number; precioUnitario: number }[];
}

export interface NotaRemisionPayload {
  empresaId: string;
  dEst: string;
  dPunExp: string;
  /** Factura que se remite: sin items, se copian sus ítems y cliente. */
  facturaId?: string;
  clienteId?: string;
  dInfAdic?: string;
  /** iMotEmiNR 1..14. */
  motivo: number;
  responsableEmision: number;
  kmRecorrido: number;
  /** yyyy-MM-dd; obligatoria si motivo = 1 (venta). */
  fechaEmisionFactura?: string;
  tipoTransporte: number;
  modalidadTransporte: number;
  responsableFlete: number;
  fechaInicioTraslado: string;
  fechaFinTraslado: string;
  salida: { direccion: string; numeroCasa: number; ciudadId: string };
  entrega: { direccion: string; numeroCasa: number; ciudadId: string };
  vehiculo: { tipo: string; marca: string; tipoIdentificacion: number; identificacion: string };
  transportista?: {
    naturaleza: number;
    nombre: string;
    ruc?: string;
    dv?: string;
    tipoDocumento?: number;
    nroDocumento?: string;
    domicilioFiscal: string;
    choferNroDocumento: string;
    choferNombre: string;
    choferDireccion: string;
  };
  depositoOrigenId?: string;
  depositoDestinoId?: string;
  items?: { productoId: string; cantidad: number }[];
  nroCaja?: number;
}

/** GET /facturas/resumen: números del dashboard calculados en el back. */
export interface ResumenComprobantes {
  /** Facturas + notas de débito − notas de crédito (sin anulados). */
  ventasNetas: number;
  facturado: number;
  notasCredito: number;
  notasDebito: number;
  /** Autofacturas: compras, no ventas. */
  compras: number;
  facturasEmitidas: number;
  documentosEmitidos: number;
  porTipo: { tipo: number; emitidos: number; anulados: number; total: number }[];
  tendenciaVentas: { anio: number; mes: number; ventasNetas: number }[];
  facturasUltimos7Dias: { fecha: string; facturas: number }[];
}

export interface RespuestaSifenDetalle {
  cdc: string | null;
  estadoSifen: string | null;
  /** Uno o varios códigos de SIFEN separados por coma, p. ej. "1305,2008". */
  codigo: string | null;
  /** Mensajes de SIFEN separados por " | ", en el mismo orden que los códigos. */
  mensaje: string | null;
  protocolo: string | null;
  xmlRespuesta: string | null;
}

export const FacturaService = {
  async getResumen(fechaDesde: string, fechaHasta: string): Promise<ResumenComprobantes> {
    const empresaId = localStorage.getItem("empresaId");
    const res = await api.get("/facturas/resumen", { params: { empresaId, fechaDesde, fechaHasta } });
    return res.data;
  },

  async create(data: any) {
    const res = await api.post("/facturas", data);
    return res.data;
  },

  async getPaginated(
    page: number,
    size: number,
    search: string = "",
    filtros: FacturaListadoFiltros = {}
  ) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/facturas", {
      params: {
        empresaId,
        page,
        size,
        search,
        fechaDesde: filtros.fechaDesde || undefined,
        fechaHasta: filtros.fechaHasta || undefined,
        condicionVenta: filtros.condicionVenta || undefined,
        rucCliente: filtros.rucCliente || undefined,
        tipoDocumento: filtros.tipoDocumento || undefined,
        // "5,6": Spring lo convierte a List<Integer> (axios mandaría tiposDocumento[]=5&...).
        tiposDocumento: filtros.tiposDocumento?.length ? filtros.tiposDocumento.join(",") : undefined,
        excluirFacturas: filtros.excluirFacturas || undefined,
        soloAprobadas: filtros.soloAprobadas || undefined
      }
    });

    return res.data;
  },

  async getById(id: string) {
    const res = await api.get(`/facturas/${id}`);
    return res.data;
  },

  async enviarSifen(id: string) {
    const res = await api.post(`/facturas/${id}/enviar-sifen`);
    return res.data;
  },

  async estadoSifen(id: string) {
    const res = await api.get(`/facturas/${id}/estado-sifen`);
    return res.data;
  },

  /** Última respuesta de SIFEN guardada (códigos, mensajes, protocolo y XML); no consulta a SIFEN. */
  async respuestaSifen(id: string): Promise<RespuestaSifenDetalle> {
    const res = await api.get(`/facturas/${id}/respuesta-sifen`);
    return res.data;
  },

  async cancelarSifen(id: string, motivo: string) {
    const res = await api.post(`/facturas/${id}/cancelar-sifen`, { motivo });
    return res.data;
  },

  async getXmlSifen(id: string) {
    const res = await api.get(`/facturas/${id}/xml-sifen`, { responseType: "blob" });
    return res.data as Blob;
  },

  /**
   * rDE para el KuDE: sin firmar y SIN validaciones de consistencia (esas van al guardar
   * la factura, no a la impresión). Lo que el front manda a kude-renderer.
   */
  async getRdeParaKude(id: string): Promise<Blob> {
    const res = await api.get(`/facturas/${id}/rde-kude`, { responseType: "blob" });
    return res.data as Blob;
  },

  /**
   * Emite una Nota de Crédito Electrónica (iTiDE=5) sobre una factura aprobada. Sin items
   * es total (todo lo pendiente de acreditar); con items es parcial.
   */
  async crearNotaCredito(id: string, payload: NotaCreditoPayload) {
    const res = await api.post(`/facturas/${id}/nota-credito`, payload);
    return res.data;
  },

  /** Emite una Autofactura Electrónica (iTiDE=4): compra a un vendedor no contribuyente. */
  async crearAutofactura(payload: AutofacturaPayload) {
    const res = await api.post("/facturas/autofactura", payload);
    return res.data;
  },

  /** Emite una Nota de Remisión Electrónica (iTiDE=7): traslado de mercadería. */
  async crearNotaRemision(payload: NotaRemisionPayload) {
    const res = await api.post("/facturas/nota-remision", payload);
    return res.data;
  },

  /** Emite una Nota de Débito Electrónica (iTiDE=6) con cargos nuevos sobre una factura aprobada. */
  async crearNotaDebito(id: string, payload: NotaDebitoPayload) {
    const res = await api.post(`/facturas/${id}/nota-debito`, payload);
    return res.data;
  }
};

export const MOTIVOS_NOTA_CREDITO: Record<string, string> = {
  "1": "Devolución y ajuste de precios",
  "2": "Devolución",
  "3": "Descuento",
  "4": "Bonificación",
  "5": "Crédito incobrable",
  "6": "Recupero de costo",
  "7": "Recupero de gasto",
  "8": "Ajuste de precio"
};
