import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";

import { PersonaService } from "../../services/PersonaService";
import { CuentaCorrienteService } from "../../services/CuentaCorrienteService";

interface Props {
  tipo: "clientes" | "proveedores";
}

interface Cliente {
  id: string;
  razonSocial: string;
  ruc?: string | null;
  dv?: string | null;
  nroDocumento?: string | null;
}

interface FacturaPendiente {
  id: string;
  dEst?: string;
  dPunExp?: string;
  dNumDoc?: string;
  numeroFactura?: string;
  fechaEmision?: string;
  fechaVencimiento?: string | null;
  total: number;
  saldoPendiente: number;
  montoPago?: number | null;
  estado?: string;
}

const obtenerMensajeError = (error: any, fallback: string) => {
  const data = error?.response?.data;

  if (typeof data === "string") return data.trim() || fallback;

  return (
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.mensaje ||
    error?.message ||
    fallback
  );
};

export default function CuentaCorrientePage({ tipo }: Props) {
  const esCliente = tipo === "clientes";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [facturas, setFacturas] = useState<FacturaPendiente[]>([]);
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState<FacturaPendiente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [registrandoPago, setRegistrandoPago] = useState(false);

  const clienteSeleccionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteId) ?? null,
    [clientes, clienteId]
  );

  const totalSeleccionado = useMemo(() => {
    return facturasSeleccionadas.reduce(
      (total, factura) => total + Number(factura.montoPago || 0),
      0
    );
  }, [facturasSeleccionadas]);

  const cargarClientes = async () => {
    try {
      setLoadingClientes(true);
      const res = await PersonaService.getPaginated(0, 1000, "");
      setClientes(res?.content ?? []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo cargar el listado de clientes", "error");
    } finally {
      setLoadingClientes(false);
    }
  };

  const cargarFacturasPendientes = async (nextClienteId: string) => {
    try {
      setLoadingFacturas(true);
      setFacturasSeleccionadas([]);

      const res = await CuentaCorrienteService.getFacturasPendientesCliente(nextClienteId);
      const facturasPendientes = (res?.content ?? res ?? []).map((factura: FacturaPendiente) => ({
        ...factura,
        montoPago: Number(factura.saldoPendiente || 0)
      }));

      setFacturas(facturasPendientes);
    } catch (error) {
      console.error(error);
      setFacturas([]);
      Swal.fire(
        "Error",
        obtenerMensajeError(error, "No se pudieron cargar las facturas pendientes"),
        "error"
      );
    } finally {
      setLoadingFacturas(false);
    }
  };

  useEffect(() => {
    if (esCliente) {
      cargarClientes();
    }
  }, [esCliente]);

  const onClienteChange = (nextClienteId: string | null) => {
    setClienteId(nextClienteId);
    setFacturas([]);
    setFacturasSeleccionadas([]);

    if (nextClienteId) {
      cargarFacturasPendientes(nextClienteId);
    }
  };

  const clienteTemplate = (cliente: Cliente) => {
    const documento = cliente.ruc
      ? `${cliente.ruc}${cliente.dv ? "-" + cliente.dv : ""}`
      : cliente.nroDocumento;

    return documento ? `${cliente.razonSocial} - ${documento}` : cliente.razonSocial;
  };

  const formatMoney = (value?: number | null) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return new Date(`${value}T00:00:00`).toLocaleDateString("es-PY");
  };

  const numeracionBody = (rowData: FacturaPendiente) => {
    if (rowData.numeroFactura) return rowData.numeroFactura;

    const partes = [rowData.dEst, rowData.dPunExp, rowData.dNumDoc].filter(Boolean);
    return partes.length ? partes.join("-") : "-";
  };

  const estadoBody = (rowData: FacturaPendiente) => {
    const estado = rowData.estado || "Pendiente";
    return <Tag value={estado} severity="warning" />;
  };

  const actualizarMontoPago = (facturaId: string, value: number | null) => {
    setFacturas((prev) =>
      prev.map((factura) => {
        if (factura.id !== facturaId) return factura;

        const saldo = Number(factura.saldoPendiente || 0);
        const montoPago = Math.min(Math.max(Number(value || 0), 0), saldo);

        return {
          ...factura,
          montoPago
        };
      })
    );

    setFacturasSeleccionadas((prev) =>
      prev.map((factura) => {
        if (factura.id !== facturaId) return factura;

        const saldo = Number(factura.saldoPendiente || 0);
        const montoPago = Math.min(Math.max(Number(value || 0), 0), saldo);

        return {
          ...factura,
          montoPago
        };
      })
    );
  };

  const montoPagoBody = (rowData: FacturaPendiente) => {
    const seleccionada = facturasSeleccionadas.some((factura) => factura.id === rowData.id);

    return (
      <InputNumber
        className="w-full"
        inputClassName="w-full"
        value={rowData.montoPago ?? null}
        min={0}
        max={Number(rowData.saldoPendiente || 0)}
        mode="currency"
        currency="PYG"
        locale="es-PY"
        minFractionDigits={0}
        maxFractionDigits={0}
        disabled={!seleccionada}
        onValueChange={(e) => actualizarMontoPago(rowData.id, e.value ?? null)}
      />
    );
  };

  const registrarPago = async () => {
    if (!clienteId) {
      Swal.fire("Atención", "Seleccione un cliente", "warning");
      return;
    }

    const items = facturasSeleccionadas
      .filter((factura) => Number(factura.montoPago || 0) > 0)
      .map((factura) => ({
        facturaId: factura.id,
        montoPago: Number(factura.montoPago || 0)
      }));

    if (!items.length) {
      Swal.fire("Atención", "Seleccione facturas con monto a pagar mayor a cero", "warning");
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Registrar pago",
      text: `¿Desea registrar un pago por ${formatMoney(totalSeleccionado)}?`,
      showCancelButton: true,
      confirmButtonText: "Sí, registrar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      setRegistrandoPago(true);

      await CuentaCorrienteService.registrarPagoCliente({
        clienteId,
        items
      });

      Swal.fire("Registrado", "Pago registrado correctamente", "success");
      cargarFacturasPendientes(clienteId);
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        obtenerMensajeError(error, "No se pudo registrar el pago"),
        "error"
      );
    } finally {
      setRegistrandoPago(false);
    }
  };

  if (!esCliente) {
    return (
      <div>
        <div className="flex flex-column gap-1 mb-4">
          <h2 className="m-0">Cuenta corriente de proveedores</h2>
          <small className="text-color-secondary">
            Gestión de saldos y movimientos de cuenta corriente
          </small>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="m-0">Cuenta corriente de clientes</h2>
          <small className="text-color-secondary">
            Facturas crédito pendientes y registro de pagos parciales
          </small>
        </div>

        <Button
          label="Registrar pago"
          icon="pi pi-check"
          severity="success"
          onClick={registrarPago}
          loading={registrandoPago}
          disabled={!facturasSeleccionadas.length}
        />
      </div>

      <div className="grid align-items-end mb-3">
        <div className="col-12 md:col-7 lg:col-5">
          <label>Cliente</label>
          <Dropdown
            className="w-full"
            value={clienteId}
            options={clientes}
            optionLabel="razonSocial"
            optionValue="id"
            itemTemplate={clienteTemplate}
            valueTemplate={(cliente) =>
              cliente ? clienteTemplate(cliente) : "Seleccione cliente"
            }
            placeholder="Seleccione cliente"
            filter
            showClear
            loading={loadingClientes}
            onChange={(e) => onClienteChange(e.value ?? null)}
          />
        </div>

        <div className="col-12 md:col-5 lg:col-3">
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              background: "#ffffff"
            }}
          >
            <div className="text-color-secondary text-sm">Total a pagar</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
              {formatMoney(totalSeleccionado)}
            </div>
          </div>
        </div>
      </div>

      {clienteSeleccionado && (
        <div className="mb-3 text-color-secondary">
          Cliente seleccionado: <strong>{clienteTemplate(clienteSeleccionado)}</strong>
        </div>
      )}

      <DataTable
        value={facturas}
        loading={loadingFacturas}
        dataKey="id"
        selectionMode="multiple"
        selection={facturasSeleccionadas}
        onSelectionChange={(e: any) => setFacturasSeleccionadas(e.value ?? [])}
        stripedRows
        size="small"
        emptyMessage={
          clienteId
            ? "No hay facturas crédito pendientes de pago"
            : "Seleccione un cliente para consultar sus facturas pendientes"
        }
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column header="Factura" body={numeracionBody} />
        <Column header="Fecha emisión" body={(rowData: FacturaPendiente) => formatDate(rowData.fechaEmision)} />
        <Column header="Vencimiento" body={(rowData: FacturaPendiente) => formatDate(rowData.fechaVencimiento)} />
        <Column header="Total" body={(rowData: FacturaPendiente) => formatMoney(rowData.total)} />
        <Column header="Saldo pendiente" body={(rowData: FacturaPendiente) => formatMoney(rowData.saldoPendiente)} />
        <Column header="Monto a pagar" body={montoPagoBody} style={{ minWidth: "180px" }} />
        <Column header="Estado" body={estadoBody} />
      </DataTable>
    </div>
  );
}
