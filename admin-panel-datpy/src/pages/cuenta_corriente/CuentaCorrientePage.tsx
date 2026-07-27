import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
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
  seleccionada?: boolean;
}

interface FormaPago {
  id: string;
  tipoPagoId: number;
  descripcion: string;
  monto: number;
  referencia?: string;
}

interface TipoPagoOption {
  id: number;
  descripcion: string;
}

const tiposPago: TipoPagoOption[] = [
  { id: 1, descripcion: "Efectivo" },
  { id: 2, descripcion: "Cheque" },
  { id: 3, descripcion: "Tarjeta de crédito" },
  { id: 4, descripcion: "Tarjeta de débito" },
  { id: 5, descripcion: "Transferencia" },
  { id: 7, descripcion: "Billetera electrónica" },
  { id: 99, descripcion: "Otro" }
];

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

const nuevoIdTemporal = () => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function CuentaCorrientePage({ tipo }: Props) {
  const esCliente = tipo === "clientes";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [facturas, setFacturas] = useState<FacturaPendiente[]>([]);

  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [registrandoPago, setRegistrandoPago] = useState(false);

  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

  const clienteSeleccionado = useMemo(
    () => clientes.find((cliente) => String(cliente.id) === String(clienteId)) ?? null,
    [clientes, clienteId]
  );

  const facturasSeleccionadas = useMemo(() => {
    return facturas.filter((factura) => factura.seleccionada);
  }, [facturas]);

  const totalSeleccionado = useMemo(() => {
    return facturasSeleccionadas.reduce(
      (total, factura) => total + Number(factura.montoPago || 0),
      0
    );
  }, [facturasSeleccionadas]);

  const totalFormasPago = useMemo(() => {
    return formasPago.reduce((total, forma) => total + Number(forma.monto || 0), 0);
  }, [formasPago]);

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
      setFormasPago([]);

      const res = await CuentaCorrienteService.getFacturasPendientesCliente(nextClienteId);

      const facturasPendientes = (res?.content ?? res ?? []).map(
        (factura: FacturaPendiente) => ({
          ...factura,
          id: String(factura.id),
          montoPago: Number(factura.saldoPendiente || 0),
          seleccionada: false
        })
      );

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
    setFormasPago([]);

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

  const normalizarMontoPago = (value: number | null | undefined, saldoPendiente: number) => {
    const saldo = Number(saldoPendiente || 0);
    const monto = Number(value || 0);

    return Math.min(Math.max(monto, 0), saldo);
  };

  const actualizarMontoPago = (facturaId: string, value: number | null) => {
    setFacturas((prev) =>
      prev.map((factura) => {
        if (String(factura.id) !== String(facturaId)) return factura;

        return {
          ...factura,
          montoPago: normalizarMontoPago(value, factura.saldoPendiente)
        };
      })
    );
  };

  const toggleFactura = (factura: FacturaPendiente) => {
    const facturaId = String(factura.id);

    setFacturas((prev) =>
      prev.map((item) => {
        if (String(item.id) !== facturaId) return item;

        const seleccionada = !item.seleccionada;

        return {
          ...item,
          seleccionada,
          montoPago:
            seleccionada && (item.montoPago === null || item.montoPago === undefined)
              ? Number(item.saldoPendiente || 0)
              : normalizarMontoPago(item.montoPago, item.saldoPendiente)
        };
      })
    );
  };

  const todasSeleccionadas =
    facturas.length > 0 && facturas.every((factura) => factura.seleccionada);

  const toggleTodas = () => {
    const nuevoValor = !todasSeleccionadas;

    setFacturas((prev) =>
      prev.map((factura) => ({
        ...factura,
        seleccionada: nuevoValor,
        montoPago:
          nuevoValor && (factura.montoPago === null || factura.montoPago === undefined)
            ? Number(factura.saldoPendiente || 0)
            : factura.montoPago
      }))
    );
  };

  const seleccionHeader = (
    <Checkbox
      checked={todasSeleccionadas}
      onChange={toggleTodas}
    />
  );

  const seleccionBody = (rowData: FacturaPendiente) => {
    return (
      <Checkbox
        checked={!!rowData.seleccionada}
        onChange={() => toggleFactura(rowData)}
      />
    );
  };

  const montoPagoBody = (rowData: FacturaPendiente) => {
    const seleccionada = !!rowData.seleccionada;

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
        onFocus={(e) => {
          const target = e.target;
          setTimeout(() => target.select(), 0);
        }}
      />
    );
  };

  const abrirModalPago = () => {
    if (!clienteId) {
      Swal.fire("Atención", "Seleccione un cliente", "warning");
      return;
    }

    if (!facturasSeleccionadas.length) {
      Swal.fire("Atención", "Seleccione al menos una factura", "warning");
      return;
    }

    if (totalSeleccionado <= 0) {
      Swal.fire("Atención", "El monto total a pagar debe ser mayor a cero", "warning");
      return;
    }

    setFormasPago([
      {
        id: nuevoIdTemporal(),
        tipoPagoId: 1,
        descripcion: "Efectivo",
        monto: totalSeleccionado,
        referencia: ""
      }
    ]);

    setModalPagoVisible(true);
  };

  const agregarFormaPago = () => {
    setFormasPago((prev) => [
      ...prev,
      {
        id: nuevoIdTemporal(),
        tipoPagoId: 1,
        descripcion: "Efectivo",
        monto: 0,
        referencia: ""
      }
    ]);
  };

  const eliminarFormaPago = (id: string) => {
    setFormasPago((prev) => prev.filter((forma) => forma.id !== id));
  };

  const actualizarFormaPago = (id: string, cambios: Partial<FormaPago>) => {
    setFormasPago((prev) =>
      prev.map((forma) => {
        if (forma.id !== id) return forma;

        return {
          ...forma,
          ...cambios
        };
      })
    );
  };

  const confirmarRegistroPago = async () => {
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

    const formasPagoValidas = formasPago.filter((forma) => Number(forma.monto || 0) > 0);

    if (!formasPagoValidas.length) {
      Swal.fire("Atención", "Agregue al menos una forma de pago", "warning");
      return;
    }

    if (Number(totalFormasPago) !== Number(totalSeleccionado)) {
      Swal.fire(
        "Atención",
        `El total de formas de pago ${formatMoney(totalFormasPago)} debe coincidir con el total a pagar ${formatMoney(totalSeleccionado)}`,
        "warning"
      );
      return;
    }

    try {
      setRegistrandoPago(true);

      await CuentaCorrienteService.registrarPagoCliente({
        clienteId,
        items,
        formasPago: formasPagoValidas.map((forma) => ({
          tipoPagoId: forma.tipoPagoId,
          descripcion: forma.descripcion,
          monto: Number(forma.monto || 0),
          referencia: forma.referencia || null
        }))
      });

      Swal.fire("Registrado", "Pago registrado correctamente", "success");

      setModalPagoVisible(false);
      setFormasPago([]);

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

  const modalFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        onClick={() => setModalPagoVisible(false)}
        disabled={registrandoPago}
      />
      <Button
        label="Confirmar pago"
        icon="pi pi-check"
        severity="success"
        onClick={confirmarRegistroPago}
        loading={registrandoPago}
      />
    </div>
  );

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
          onClick={abrirModalPago}
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
        stripedRows
        size="small"
        emptyMessage={
          clienteId
            ? "No hay facturas crédito pendientes de pago"
            : "Seleccione un cliente para consultar sus facturas pendientes"
        }
      >
        <Column
          header={seleccionHeader}
          body={seleccionBody}
          headerStyle={{ width: "3rem" }}
          bodyStyle={{ textAlign: "center" }}
        />

        <Column header="Factura" body={numeracionBody} />

        <Column
          header="Fecha emisión"
          body={(rowData: FacturaPendiente) => formatDate(rowData.fechaEmision)}
        />

        <Column
          header="Vencimiento"
          body={(rowData: FacturaPendiente) => formatDate(rowData.fechaVencimiento)}
        />

        <Column
          header="Total"
          body={(rowData: FacturaPendiente) => formatMoney(rowData.total)}
        />

        <Column
          header="Saldo pendiente"
          body={(rowData: FacturaPendiente) => formatMoney(rowData.saldoPendiente)}
        />

        <Column
          header="Monto a pagar"
          body={montoPagoBody}
          style={{ minWidth: "180px" }}
        />

        <Column header="Estado" body={estadoBody} />
      </DataTable>

      <Dialog
        header="Formas de pago"
        visible={modalPagoVisible}
        style={{ width: "720px" }}
        modal
        footer={modalFooter}
        onHide={() => setModalPagoVisible(false)}
      >
        <div className="mb-3">
          <div className="text-color-secondary text-sm">
            Total de facturas seleccionadas
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {formatMoney(totalSeleccionado)}
          </div>
        </div>

        <div className="flex justify-content-between align-items-center mb-3">
          <strong>Detalle de pago</strong>
          <Button
            label="Agregar forma"
            icon="pi pi-plus"
            size="small"
            onClick={agregarFormaPago}
          />
        </div>

        <div className="flex flex-column gap-3">
          {formasPago.map((forma) => (
            <div
              key={forma.id}
              className="grid align-items-end"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 10
              }}
            >
              <div className="col-12 md:col-4">
                <label>Forma de pago</label>
                <Dropdown
                  className="w-full"
                  value={forma.tipoPagoId}
                  options={tiposPago}
                  optionLabel="descripcion"
                  optionValue="id"
                  onChange={(e) => {
                    const tipo = tiposPago.find((item) => item.id === e.value);

                    actualizarFormaPago(forma.id, {
                      tipoPagoId: Number(e.value),
                      descripcion: tipo?.descripcion ?? ""
                    });
                  }}
                />
              </div>

              <div className="col-12 md:col-3">
                <label>Monto</label>
                <InputNumber
                  className="w-full"
                  inputClassName="w-full"
                  value={forma.monto}
                  min={0}
                  mode="currency"
                  currency="PYG"
                  locale="es-PY"
                  minFractionDigits={0}
                  maxFractionDigits={0}
                  onValueChange={(e) =>
                    actualizarFormaPago(forma.id, {
                      monto: Number(e.value || 0)
                    })
                  }
                />
              </div>

              <div className="col-12 md:col-4">
                <label>Referencia</label>
                <InputText
                  className="w-full"
                  value={forma.referencia || ""}
                  placeholder="Nro. operación, cheque, autorización..."
                  onChange={(e) =>
                    actualizarFormaPago(forma.id, {
                      referencia: e.target.value
                    })
                  }
                />
              </div>

              <div className="col-12 md:col-1">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  onClick={() => eliminarFormaPago(forma.id)}
                  disabled={formasPago.length === 1}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-4"
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: 12
          }}
        >
          <div className="flex justify-content-between">
            <span>Total formas de pago:</span>
            <strong>{formatMoney(totalFormasPago)}</strong>
          </div>

          <div className="flex justify-content-between mt-2">
            <span>Diferencia:</span>
            <strong
              style={{
                color:
                  Number(totalFormasPago) === Number(totalSeleccionado)
                    ? "#16a34a"
                    : "#dc2626"
              }}
            >
              {formatMoney(totalSeleccionado - totalFormasPago)}
            </strong>
          </div>
        </div>
      </Dialog>
    </div>
  );
}