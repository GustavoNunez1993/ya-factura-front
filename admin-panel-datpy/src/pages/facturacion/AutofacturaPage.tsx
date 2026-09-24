import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { AutoComplete } from "primereact/autocomplete";
import type { AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

import { CiudadesService } from "../../services/CiudadesService";
import { DepositoService } from "../../services/DepositoService";
import type { Deposito } from "../../services/DepositoService";
import { FacturaService } from "../../services/FacturaService";
import { ProductosService } from "../../services/ProductosService";
import { TimbradoService } from "../../services/TimbradoService";
import { NRO_CAJA, verificarCajaAbierta } from "../../utils/caja";

interface Opcion {
  id: string;
  descripcion: string;
}

interface ProductoOpcion extends Opcion {
  codigo?: string;
  precioCompra?: number;
}

interface ItemCompra {
  producto: ProductoOpcion | null;
  cantidad: number | null;
  precioUnitario: number | null;
}

const naturalezas = [
  { label: "No contribuyente", value: 1 },
  { label: "Extranjero", value: 2 }
];

const tiposDocumento = [
  { label: "Cédula paraguaya", value: 1 },
  { label: "Pasaporte", value: 2 },
  { label: "Cédula extranjera", value: 3 },
  { label: "Carnet de residencia", value: 4 }
];

const tiposTransaccion = [
  { label: "Compra de productos", value: 10 },
  { label: "Compra de servicios", value: 11 }
];

const condiciones = [
  { label: "Contado", value: 1 },
  { label: "Crédito", value: 2 }
];

const itemVacio = (): ItemCompra => ({ producto: null, cantidad: 1, precioUnitario: null });

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(value || 0);

/**
 * Alta de una Autofactura Electrónica (iTiDE=4): la empresa documenta una compra a un
 * vendedor no contribuyente o extranjero. El IVA de cada ítem sale del producto.
 */
export default function AutofacturaPage() {
  const navigate = useNavigate();

  const [puntos, setPuntos] = useState<{ label: string; value: string }[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);

  const [puntoExpedicion, setPuntoExpedicion] = useState<string | null>(null);
  const [tipoTransaccion, setTipoTransaccion] = useState(10);
  const [condicion, setCondicion] = useState(1);
  const [plazo, setPlazo] = useState("");
  const [depositoId, setDepositoId] = useState<string | null>(null);
  const [formaPago, setFormaPago] = useState("EFECTIVO");
  const [infAdic, setInfAdic] = useState("");

  const [naturaleza, setNaturaleza] = useState(1);
  const [tipoDocumento, setTipoDocumento] = useState(1);
  const [nroDocumento, setNroDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [numeroCasa, setNumeroCasa] = useState<number | null>(0);
  const [ciudad, setCiudad] = useState<Opcion | null>(null);
  const [direccionTransaccion, setDireccionTransaccion] = useState("");
  const [ciudadTransaccion, setCiudadTransaccion] = useState<Opcion | null>(null);

  const [items, setItems] = useState<ItemCompra[]>([itemVacio()]);
  const [sugerenciasCiudad, setSugerenciasCiudad] = useState<Opcion[]>([]);
  const [sugerenciasProducto, setSugerenciasProducto] = useState<ProductoOpcion[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Sin apertura de caja no se emite: se vuelve al listado o se va a abrir la caja.
  useEffect(() => {
    verificarCajaAbierta("Volver al listado").then((ok) => {
      if (!ok) navigate("/autofacturas");
    });
  }, [navigate]);

  useEffect(() => {
    const empresaId = localStorage.getItem("empresaId") ?? "";
    TimbradoService.listar(empresaId)
      .then((timbrados) => {
        const opciones = timbrados
          .filter((t) => t.activo && t.tipoDocumento === 4)
          .map((t) => `${t.establecimiento}-${t.puntoExpedicion}`)
          .map((p) => ({ label: p, value: p }));
        setPuntos(opciones);
        if (opciones.length > 0) setPuntoExpedicion(opciones[0].value);
      })
      .catch(() => setPuntos([]));
    DepositoService.getActivos().then(setDepositos).catch(() => setDepositos([]));
  }, []);

  const buscarCiudades = async (e: AutoCompleteCompleteEvent) => {
    try {
      const res = await CiudadesService.getPaginated(0, 20, e.query);
      setSugerenciasCiudad(res?.content ?? []);
    } catch {
      setSugerenciasCiudad([]);
    }
  };

  const buscarProductos = async (e: AutoCompleteCompleteEvent) => {
    try {
      const res = await ProductosService.getPaginated(0, 20, e.query);
      setSugerenciasProducto(res?.content ?? []);
    } catch {
      setSugerenciasProducto([]);
    }
  };

  const actualizarItem = (index: number, cambios: Partial<ItemCompra>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...cambios } : it)));
  };

  const total = useMemo(
    () => items.reduce((t, it) => t + (it.cantidad ?? 0) * (it.precioUnitario ?? 0), 0),
    [items]
  );

  const guardar = async () => {
    if (!puntoExpedicion) {
      Swal.fire("Atención", "No hay un timbrado activo de Autofactura. Cargalo en Timbrados.", "info");
      return;
    }
    if (!nroDocumento.trim() || !nombre.trim() || !direccion.trim() || !ciudad) {
      Swal.fire("Atención", "Completá documento, nombre, dirección y ciudad del vendedor.", "info");
      return;
    }
    if (condicion === 2 && (plazo.trim().length < 2 || plazo.trim().length > 15)) {
      Swal.fire("Atención", "Indicá el plazo del crédito (2 a 15 caracteres, ej: 30 dias).", "info");
      return;
    }
    const invalido = items.findIndex(
      (it) => !it.producto || !it.cantidad || it.cantidad <= 0 || !it.precioUnitario || it.precioUnitario <= 0
    );
    if (invalido >= 0) {
      Swal.fire("Atención", `Completá producto, cantidad y precio del ítem ${invalido + 1}.`, "info");
      return;
    }

    const [dEst, dPunExp] = puntoExpedicion.split("-");
    try {
      setGuardando(true);
      const res = await FacturaService.crearAutofactura({
        empresaId: localStorage.getItem("empresaId") ?? "",
        dEst,
        dPunExp,
        tipoTransaccionId: tipoTransaccion,
        condicionOperacionId: condicion,
        iCondCred: condicion === 2 ? 1 : undefined,
        dPlazoCre: condicion === 2 ? plazo.trim() : undefined,
        dInfAdic: infAdic.trim() || undefined,
        depositoId: depositoId ?? undefined,
        nroCaja: NRO_CAJA,
        formaPago: condicion === 1 ? formaPago : undefined,
        vendedor: {
          naturaleza,
          tipoDocumento,
          nroDocumento: nroDocumento.trim(),
          nombre: nombre.trim(),
          direccion: direccion.trim(),
          numeroCasa: numeroCasa ?? 0,
          ciudadId: ciudad.id,
          direccionTransaccion: direccionTransaccion.trim() || undefined,
          ciudadTransaccionId: ciudadTransaccion?.id
        },
        items: items.map((it) => ({
          productoId: it.producto!.id,
          cantidad: it.cantidad!,
          precioUnitario: it.precioUnitario!
        }))
      });
      await Swal.fire({
        icon: "success",
        title: "Autofactura creada",
        html:
          `<div style="text-align:left">` +
          `<b>Numeración:</b> ${res.dEst}-${res.dPunExp}-${res.dNumDoc}<br/>` +
          `<b>Total:</b> ${formatMoney(Number(res.total ?? 0))}<br/>` +
          `<b>Estado SIFEN:</b> ${res.estadoSifen ?? "Sin enviar"}` +
          `</div>`
      });
      navigate("/autofacturas");
    } catch (error: unknown) {
      console.error(error);
      const mensaje =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "No se pudo emitir la autofactura";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardando(false);
    }
  };

  const ciudadInput = (value: Opcion | null, onChange: (c: Opcion | null) => void, placeholder: string) => (
    <AutoComplete
      className="w-full"
      inputClassName="w-full"
      value={value}
      suggestions={sugerenciasCiudad}
      completeMethod={buscarCiudades}
      field="descripcion"
      placeholder={placeholder}
      forceSelection
      onChange={(e) => onChange(typeof e.value === "object" ? (e.value as Opcion) : null)}
    />
  );

  return (
    <div>
      <div className="flex justify-content-between align-items-start mb-4" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="m-0">Nueva autofactura</h2>
          <small className="text-color-secondary">Compra a un vendedor no contribuyente o extranjero</small>
        </div>
        <Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined onClick={() => navigate("/autofacturas")} />
      </div>

      <div className="grid">
        <div className="col-12 md:col-3">
          <label>Punto de expedición</label>
          <Dropdown
            className="w-full"
            value={puntoExpedicion}
            options={puntos}
            placeholder="Sin timbrado de autofactura"
            onChange={(e) => setPuntoExpedicion(e.value)}
          />
        </div>
        <div className="col-12 md:col-3">
          <label>Tipo de compra</label>
          <Dropdown className="w-full" value={tipoTransaccion} options={tiposTransaccion} onChange={(e) => setTipoTransaccion(e.value)} />
        </div>
        <div className="col-6 md:col-3">
          <label>Condición</label>
          <Dropdown className="w-full" value={condicion} options={condiciones} onChange={(e) => setCondicion(e.value)} />
        </div>
        <div className="col-6 md:col-3">
          {condicion === 2 ? (
            <>
              <label>Plazo</label>
              <InputText className="w-full" value={plazo} placeholder="30 dias" maxLength={15} onChange={(e) => setPlazo(e.target.value)} />
            </>
          ) : (
            <>
              <label>Pago (sale de caja)</label>
              <Dropdown
                className="w-full"
                value={formaPago}
                options={[
                  { label: "Efectivo", value: "EFECTIVO" },
                  { label: "Transferencia", value: "TRANSFERENCIA" }
                ]}
                onChange={(e) => setFormaPago(e.value)}
              />
            </>
          )}
        </div>
        <div className="col-12 md:col-3">
          <label>Ingresar al depósito</label>
          <Dropdown
            className="w-full"
            value={depositoId}
            options={depositos}
            optionLabel="nombre"
            optionValue="id"
            placeholder="No mover stock"
            showClear
            onChange={(e) => setDepositoId(e.value ?? null)}
          />
        </div>

        <div className="col-12"><h4 className="m-0 mt-2">Vendedor</h4></div>
        <div className="col-12 md:col-3">
          <label>Naturaleza</label>
          <Dropdown className="w-full" value={naturaleza} options={naturalezas} onChange={(e) => setNaturaleza(e.value)} />
        </div>
        <div className="col-12 md:col-3">
          <label>Tipo de documento</label>
          <Dropdown className="w-full" value={tipoDocumento} options={tiposDocumento} onChange={(e) => setTipoDocumento(e.value)} />
        </div>
        <div className="col-12 md:col-3">
          <label>Nº de documento</label>
          <InputText className="w-full" value={nroDocumento} maxLength={20} onChange={(e) => setNroDocumento(e.target.value)} />
        </div>
        <div className="col-12 md:col-3">
          <label>Nombre y apellido</label>
          <InputText className="w-full" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="col-12 md:col-5">
          <label>Dirección</label>
          <InputText className="w-full" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        <div className="col-4 md:col-2">
          <label>Nº casa</label>
          <InputNumber className="w-full" inputStyle={{ width: "100%" }} value={numeroCasa} min={0} useGrouping={false} onValueChange={(e) => setNumeroCasa(e.value ?? 0)} />
        </div>
        <div className="col-8 md:col-5">
          <label>Ciudad</label>
          {ciudadInput(ciudad, setCiudad, "Buscar ciudad")}
        </div>
        <div className="col-12 md:col-7">
          <label>Lugar de la transacción (opcional)</label>
          <InputText
            className="w-full"
            value={direccionTransaccion}
            placeholder="Por defecto, la dirección de la empresa"
            onChange={(e) => setDireccionTransaccion(e.target.value)}
          />
        </div>
        <div className="col-12 md:col-5">
          <label>Ciudad de la transacción (opcional)</label>
          {ciudadInput(ciudadTransaccion, setCiudadTransaccion, "Por defecto, la de la empresa")}
        </div>

        <div className="col-12"><h4 className="m-0 mt-2">Ítems comprados</h4></div>
        <div className="col-12">
          {items.map((it, i) => (
            <div key={i} className="grid align-items-end" style={{ borderBottom: "1px solid #f3f4f6", margin: 0 }}>
              <div className="col-12 md:col-6">
                <small>Producto / servicio</small>
                <AutoComplete
                  className="w-full"
                  inputClassName="w-full"
                  value={it.producto}
                  suggestions={sugerenciasProducto}
                  completeMethod={buscarProductos}
                  field="descripcion"
                  placeholder="Buscar producto"
                  forceSelection
                  onChange={(e) => {
                    const producto = typeof e.value === "object" ? (e.value as ProductoOpcion) : null;
                    actualizarItem(i, {
                      producto,
                      precioUnitario: producto?.precioCompra != null ? Number(producto.precioCompra) : it.precioUnitario
                    });
                  }}
                />
              </div>
              <div className="col-4 md:col-2">
                <small>Cantidad</small>
                <InputNumber value={it.cantidad} min={0} maxFractionDigits={4} inputStyle={{ width: "100%" }} onValueChange={(e) => actualizarItem(i, { cantidad: e.value ?? null })} />
              </div>
              <div className="col-8 md:col-3">
                <small>Precio unitario</small>
                <InputNumber value={it.precioUnitario} min={0} maxFractionDigits={0} prefix="Gs. " inputStyle={{ width: "100%" }} onValueChange={(e) => actualizarItem(i, { precioUnitario: e.value ?? null })} />
              </div>
              <div className="col-12 md:col-1 flex justify-content-end">
                <Button icon="pi pi-trash" severity="danger" text rounded disabled={items.length === 1} onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
          <Button className="mt-2" label="Agregar ítem" icon="pi pi-plus" text onClick={() => setItems((prev) => [...prev, itemVacio()])} />
        </div>

        <div className="col-12">
          <label>Información adicional (opcional)</label>
          <InputTextarea className="w-full" rows={2} value={infAdic} onChange={(e) => setInfAdic(e.target.value)} />
        </div>

        <div className="col-12 flex justify-content-between align-items-center" style={{ flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Total: {formatMoney(total)}</span>
          <Button label="Emitir autofactura" icon="pi pi-check" severity="success" loading={guardando} onClick={guardar} />
        </div>
      </div>
    </div>
  );
}
