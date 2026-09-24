import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

import { AutoComplete } from "primereact/autocomplete";
import type { AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

import { CiudadesService } from "../../services/CiudadesService";
import { DepositoService } from "../../services/DepositoService";
import type { Deposito } from "../../services/DepositoService";
import { FacturaService } from "../../services/FacturaService";
import { PersonaService } from "../../services/PersonaService";
import { ProductosService } from "../../services/ProductosService";
import { TimbradoService } from "../../services/TimbradoService";
import { NRO_CAJA, verificarCajaAbierta } from "../../utils/caja";

interface Opcion {
  id: string;
  descripcion: string;
}

interface ClienteOpcion {
  id: string;
  razonSocial: string;
  ruc?: string;
  nroDocumento?: string;
}

interface ItemRemision {
  producto: Opcion | null;
  cantidad: number | null;
}

interface FacturaRemitida {
  id: string;
  numero: string;
  cliente: string;
  items: { descripcion: string; cantidad: number }[];
}

const motivos = [
  "Traslado por ventas",
  "Traslado por consignación",
  "Exportación",
  "Traslado por compra",
  "Importación",
  "Traslado por devolución",
  "Traslado entre locales de la empresa",
  "Traslado de bienes por transformación",
  "Traslado de bienes para reparación",
  "Traslado por emisor móvil",
  "Exhibición o Demostración",
  "Participación en ferias",
  "Traslado de encomienda",
  "Decomiso"
].map((label, i) => ({ label: `${i + 1} - ${label}`, value: i + 1 }));

const responsables = [
  "Emisor de la factura",
  "Poseedor de la factura y bienes",
  "Empresa transportista",
  "Despachante de Aduanas",
  "Agente de transporte o intermediario"
].map((label, i) => ({ label, value: i + 1 }));

const tiposTransporte = [
  { label: "Propio", value: 1 },
  { label: "Tercero", value: 2 }
];

const modalidades = [
  { label: "Terrestre", value: 1 },
  { label: "Fluvial", value: 2 },
  { label: "Aéreo", value: 3 },
  { label: "Multimodal", value: 4 }
];

const responsablesFlete = [
  "Emisor de la factura",
  "Receptor de la factura",
  "Tercero",
  "Agente intermediario del transporte",
  "Transporte propio"
].map((label, i) => ({ label, value: i + 1 }));

const tiposIdVehiculo = [
  { label: "Matrícula", value: 2 },
  { label: "Nº de identificación (chasis)", value: 1 }
];

const naturalezasTransportista = [
  { label: "Contribuyente (RUC)", value: 1 },
  { label: "No contribuyente", value: 2 }
];

const tiposDocumento = [
  { label: "Cédula paraguaya", value: 1 },
  { label: "Pasaporte", value: 2 },
  { label: "Cédula extranjera", value: 3 },
  { label: "Carnet de residencia", value: 4 }
];

const hoy = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const fechaParam = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : undefined;

/**
 * Alta de una Nota de Remisión Electrónica (iTiDE=7). Con ?facturaId= remite los ítems y el
 * cliente de esa factura; si no, se cargan ítems y un destinatario opcional (sin destinatario,
 * el receptor es la propia empresa: traslado entre locales).
 */
export default function NotaRemisionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facturaId = searchParams.get("facturaId");

  const [puntos, setPuntos] = useState<{ label: string; value: string }[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [facturaRemitida, setFacturaRemitida] = useState<FacturaRemitida | null>(null);

  const [puntoExpedicion, setPuntoExpedicion] = useState<string | null>(null);
  const [cliente, setCliente] = useState<ClienteOpcion | null>(null);
  const [motivo, setMotivo] = useState(facturaId ? 1 : 7);
  const [responsable, setResponsable] = useState(1);
  const [km, setKm] = useState<number | null>(null);
  const [fechaFactura, setFechaFactura] = useState<Date | null>(hoy());
  const [fechaInicio, setFechaInicio] = useState<Date | null>(hoy());
  const [fechaFin, setFechaFin] = useState<Date | null>(hoy());
  const [tipoTransporte, setTipoTransporte] = useState(1);
  const [modalidad, setModalidad] = useState(1);
  const [responsableFlete, setResponsableFlete] = useState(1);

  const [salidaDireccion, setSalidaDireccion] = useState("");
  const [salidaNumero, setSalidaNumero] = useState<number | null>(0);
  const [salidaCiudad, setSalidaCiudad] = useState<Opcion | null>(null);
  const [entregaDireccion, setEntregaDireccion] = useState("");
  const [entregaNumero, setEntregaNumero] = useState<number | null>(0);
  const [entregaCiudad, setEntregaCiudad] = useState<Opcion | null>(null);

  const [vehiculoTipo, setVehiculoTipo] = useState("Camión");
  const [vehiculoMarca, setVehiculoMarca] = useState("");
  const [vehiculoTipoId, setVehiculoTipoId] = useState(2);
  const [vehiculoId, setVehiculoId] = useState("");

  const [transNaturaleza, setTransNaturaleza] = useState(1);
  const [transNombre, setTransNombre] = useState("");
  const [transRuc, setTransRuc] = useState("");
  const [transDv, setTransDv] = useState("");
  const [transTipoDoc, setTransTipoDoc] = useState(1);
  const [transNroDoc, setTransNroDoc] = useState("");
  const [transDomicilio, setTransDomicilio] = useState("");
  const [choferDoc, setChoferDoc] = useState("");
  const [choferNombre, setChoferNombre] = useState("");
  const [choferDireccion, setChoferDireccion] = useState("");

  const [depositoOrigenId, setDepositoOrigenId] = useState<string | null>(null);
  const [depositoDestinoId, setDepositoDestinoId] = useState<string | null>(null);
  const [infAdic, setInfAdic] = useState("");
  const [items, setItems] = useState<ItemRemision[]>([{ producto: null, cantidad: 1 }]);

  const [sugCiudad, setSugCiudad] = useState<Opcion[]>([]);
  const [sugProducto, setSugProducto] = useState<Opcion[]>([]);
  const [sugCliente, setSugCliente] = useState<ClienteOpcion[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Sin apertura de caja no se emite: se vuelve al listado o se va a abrir la caja.
  useEffect(() => {
    verificarCajaAbierta("Volver al listado").then((ok) => {
      if (!ok) navigate("/notas-remision");
    });
  }, [navigate]);

  useEffect(() => {
    const empresaId = localStorage.getItem("empresaId") ?? "";
    TimbradoService.listar(empresaId)
      .then((timbrados) => {
        const opciones = timbrados
          .filter((t) => t.activo && t.tipoDocumento === 7)
          .map((t) => `${t.establecimiento}-${t.puntoExpedicion}`)
          .map((p) => ({ label: p, value: p }));
        setPuntos(opciones);
        if (opciones.length > 0) setPuntoExpedicion(opciones[0].value);
      })
      .catch(() => setPuntos([]));
    DepositoService.getActivos().then(setDepositos).catch(() => setDepositos([]));

    if (facturaId) {
      FacturaService.getById(facturaId)
        .then((f) => {
          setFacturaRemitida({
            id: f.id,
            numero: `${f.dEst}-${f.dPunExp}-${f.dNumDoc}`,
            cliente: f.dNomRec ?? "-",
            items: (f.detalles ?? []).map((d: { descripcion?: string; cantidad?: number }) => ({
              descripcion: d.descripcion ?? "",
              cantidad: Number(d.cantidad ?? 0)
            }))
          });
          setEntregaDireccion(f.dDirRec ?? "");
        })
        .catch(() => Swal.fire("Error", "No se pudo cargar la factura a remitir", "error"));
    }
  }, [facturaId]);

  const buscarCiudades = async (e: AutoCompleteCompleteEvent) => {
    try {
      setSugCiudad((await CiudadesService.getPaginated(0, 20, e.query))?.content ?? []);
    } catch {
      setSugCiudad([]);
    }
  };

  const buscarProductos = async (e: AutoCompleteCompleteEvent) => {
    try {
      setSugProducto((await ProductosService.getPaginated(0, 20, e.query))?.content ?? []);
    } catch {
      setSugProducto([]);
    }
  };

  const buscarClientes = async (e: AutoCompleteCompleteEvent) => {
    try {
      setSugCliente((await PersonaService.getPaginated(0, 20, e.query))?.content ?? []);
    } catch {
      setSugCliente([]);
    }
  };

  const ciudadInput = (value: Opcion | null, onChange: (c: Opcion | null) => void) => (
    <AutoComplete
      className="w-full"
      inputClassName="w-full"
      value={value}
      suggestions={sugCiudad}
      completeMethod={buscarCiudades}
      field="descripcion"
      placeholder="Buscar ciudad"
      forceSelection
      onChange={(e) => onChange(typeof e.value === "object" ? (e.value as Opcion) : null)}
    />
  );

  const guardar = async () => {
    if (!puntoExpedicion) {
      Swal.fire("Atención", "No hay un timbrado activo de Nota de remisión. Cargalo en Timbrados.", "info");
      return;
    }
    if (!km || km < 1) {
      Swal.fire("Atención", "Indicá los km a recorrer.", "info");
      return;
    }
    if (!salidaDireccion.trim() || !salidaCiudad || !entregaDireccion.trim() || !entregaCiudad) {
      Swal.fire("Atención", "Completá dirección y ciudad de salida y de entrega.", "info");
      return;
    }
    if (vehiculoTipo.trim().length < 4 || !vehiculoMarca.trim() || !vehiculoId.trim()) {
      Swal.fire("Atención", "Completá tipo (mínimo 4 letras), marca e identificación del vehículo.", "info");
      return;
    }
    if (!facturaRemitida) {
      const invalido = items.findIndex((it) => !it.producto || !it.cantidad || it.cantidad <= 0);
      if (invalido >= 0) {
        Swal.fire("Atención", `Completá producto y cantidad del ítem ${invalido + 1}.`, "info");
        return;
      }
    }

    const [dEst, dPunExp] = puntoExpedicion.split("-");
    try {
      setGuardando(true);
      const res = await FacturaService.crearNotaRemision({
        empresaId: localStorage.getItem("empresaId") ?? "",
        dEst,
        dPunExp,
        facturaId: facturaRemitida?.id,
        clienteId: cliente?.id,
        dInfAdic: infAdic.trim() || undefined,
        motivo,
        responsableEmision: responsable,
        kmRecorrido: km,
        fechaEmisionFactura: motivo === 1 ? fechaParam(fechaFactura) : undefined,
        tipoTransporte,
        modalidadTransporte: modalidad,
        responsableFlete,
        fechaInicioTraslado: fechaParam(fechaInicio)!,
        fechaFinTraslado: fechaParam(fechaFin)!,
        salida: { direccion: salidaDireccion.trim(), numeroCasa: salidaNumero ?? 0, ciudadId: salidaCiudad.id },
        entrega: { direccion: entregaDireccion.trim(), numeroCasa: entregaNumero ?? 0, ciudadId: entregaCiudad.id },
        vehiculo: {
          tipo: vehiculoTipo.trim(),
          marca: vehiculoMarca.trim(),
          tipoIdentificacion: vehiculoTipoId,
          identificacion: vehiculoId.trim()
        },
        transportista:
          modalidad === 1
            ? {
                naturaleza: transNaturaleza,
                nombre: transNombre.trim(),
                ruc: transNaturaleza === 1 ? transRuc.trim() : undefined,
                dv: transNaturaleza === 1 ? transDv.trim() : undefined,
                tipoDocumento: transNaturaleza === 2 ? transTipoDoc : undefined,
                nroDocumento: transNaturaleza === 2 ? transNroDoc.trim() : undefined,
                domicilioFiscal: transDomicilio.trim(),
                choferNroDocumento: choferDoc.trim(),
                choferNombre: choferNombre.trim(),
                choferDireccion: choferDireccion.trim()
              }
            : undefined,
        nroCaja: NRO_CAJA,
        depositoOrigenId: depositoOrigenId ?? undefined,
        depositoDestinoId: depositoDestinoId ?? undefined,
        items: facturaRemitida
          ? undefined
          : items.map((it) => ({ productoId: it.producto!.id, cantidad: it.cantidad! }))
      });
      await Swal.fire({
        icon: "success",
        title: "Nota de remisión creada",
        html: `<div style="text-align:left"><b>Numeración:</b> ${res.dEst}-${res.dPunExp}-${res.dNumDoc}<br/>` +
          `<b>Estado SIFEN:</b> ${res.estadoSifen ?? "Sin enviar"}</div>`
      });
      navigate("/notas-remision");
    } catch (error: unknown) {
      console.error(error);
      const mensaje =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "No se pudo emitir la nota de remisión";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="flex justify-content-between align-items-start mb-4" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="m-0">Nueva nota de remisión</h2>
          <small className="text-color-secondary">
            {facturaRemitida ? `Remite la factura ${facturaRemitida.numero}` : "Traslado de mercadería"}
          </small>
        </div>
        <Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined onClick={() => navigate("/notas-remision")} />
      </div>

      <div className="grid">
        <div className="col-12 md:col-3">
          <label>Punto de expedición</label>
          <Dropdown className="w-full" value={puntoExpedicion} options={puntos} placeholder="Sin timbrado de remisión" onChange={(e) => setPuntoExpedicion(e.value)} />
        </div>
        <div className="col-12 md:col-5">
          <label>Motivo del traslado</label>
          <Dropdown className="w-full" value={motivo} options={motivos} onChange={(e) => setMotivo(e.value)} />
        </div>
        <div className="col-12 md:col-4">
          <label>Responsable de la emisión</label>
          <Dropdown className="w-full" value={responsable} options={responsables} onChange={(e) => setResponsable(e.value)} />
        </div>

        <div className="col-12 md:col-6">
          <label>Destinatario</label>
          {facturaRemitida ? (
            <InputText className="w-full" value={facturaRemitida.cliente} disabled />
          ) : (
            <AutoComplete
              className="w-full"
              inputClassName="w-full"
              value={cliente}
              suggestions={sugCliente}
              completeMethod={buscarClientes}
              field="razonSocial"
              placeholder="Opcional: sin destinatario = la propia empresa"
              forceSelection
              onChange={(e) => setCliente(typeof e.value === "object" ? (e.value as ClienteOpcion) : null)}
            />
          )}
        </div>
        <div className="col-6 md:col-2">
          <label>Km a recorrer</label>
          <InputNumber className="w-full" inputStyle={{ width: "100%" }} value={km} min={1} max={99999} useGrouping={false} onValueChange={(e) => setKm(e.value ?? null)} />
        </div>
        {motivo === 1 && (
          <div className="col-6 md:col-4">
            <label>Fecha estimada de la factura</label>
            <Calendar className="w-full" value={fechaFactura} dateFormat="dd/mm/yy" showIcon onChange={(e) => setFechaFactura(e.value ?? null)} />
          </div>
        )}

        <div className="col-12"><h4 className="m-0 mt-2">Transporte</h4></div>
        <div className="col-6 md:col-2">
          <label>Tipo</label>
          <Dropdown className="w-full" value={tipoTransporte} options={tiposTransporte} onChange={(e) => setTipoTransporte(e.value)} />
        </div>
        <div className="col-6 md:col-2">
          <label>Modalidad</label>
          <Dropdown className="w-full" value={modalidad} options={modalidades} onChange={(e) => setModalidad(e.value)} />
        </div>
        <div className="col-12 md:col-4">
          <label>Responsable del flete</label>
          <Dropdown className="w-full" value={responsableFlete} options={responsablesFlete} onChange={(e) => setResponsableFlete(e.value)} />
        </div>
        <div className="col-6 md:col-2">
          <label>Inicio traslado</label>
          <Calendar className="w-full" value={fechaInicio} dateFormat="dd/mm/yy" showIcon onChange={(e) => setFechaInicio(e.value ?? null)} />
        </div>
        <div className="col-6 md:col-2">
          <label>Fin traslado</label>
          <Calendar className="w-full" value={fechaFin} dateFormat="dd/mm/yy" showIcon minDate={fechaInicio ?? undefined} onChange={(e) => setFechaFin(e.value ?? null)} />
        </div>

        <div className="col-12 md:col-5">
          <label>Dirección de salida</label>
          <InputText className="w-full" value={salidaDireccion} onChange={(e) => setSalidaDireccion(e.target.value)} />
        </div>
        <div className="col-4 md:col-2">
          <label>Nº casa</label>
          <InputNumber className="w-full" inputStyle={{ width: "100%" }} value={salidaNumero} min={0} useGrouping={false} onValueChange={(e) => setSalidaNumero(e.value ?? 0)} />
        </div>
        <div className="col-8 md:col-5">
          <label>Ciudad de salida</label>
          {ciudadInput(salidaCiudad, setSalidaCiudad)}
        </div>
        <div className="col-12 md:col-5">
          <label>Dirección de entrega</label>
          <InputText className="w-full" value={entregaDireccion} onChange={(e) => setEntregaDireccion(e.target.value)} />
        </div>
        <div className="col-4 md:col-2">
          <label>Nº casa</label>
          <InputNumber className="w-full" inputStyle={{ width: "100%" }} value={entregaNumero} min={0} useGrouping={false} onValueChange={(e) => setEntregaNumero(e.value ?? 0)} />
        </div>
        <div className="col-8 md:col-5">
          <label>Ciudad de entrega</label>
          {ciudadInput(entregaCiudad, setEntregaCiudad)}
        </div>

        <div className="col-6 md:col-3">
          <label>Tipo de vehículo</label>
          <InputText className="w-full" value={vehiculoTipo} maxLength={10} onChange={(e) => setVehiculoTipo(e.target.value)} />
        </div>
        <div className="col-6 md:col-3">
          <label>Marca</label>
          <InputText className="w-full" value={vehiculoMarca} maxLength={10} onChange={(e) => setVehiculoMarca(e.target.value)} />
        </div>
        <div className="col-6 md:col-3">
          <label>Identificación por</label>
          <Dropdown className="w-full" value={vehiculoTipoId} options={tiposIdVehiculo} onChange={(e) => setVehiculoTipoId(e.value)} />
        </div>
        <div className="col-6 md:col-3">
          <label>{vehiculoTipoId === 2 ? "Matrícula" : "Nº de identificación"}</label>
          <InputText className="w-full" value={vehiculoId} maxLength={vehiculoTipoId === 2 ? 7 : 20} onChange={(e) => setVehiculoId(e.target.value)} />
        </div>

        {modalidad === 1 && (
          <>
            <div className="col-12 md:col-3">
              <label>Transportista</label>
              <Dropdown className="w-full" value={transNaturaleza} options={naturalezasTransportista} onChange={(e) => setTransNaturaleza(e.value)} />
            </div>
            <div className="col-12 md:col-5">
              <label>Nombre / razón social</label>
              <InputText className="w-full" value={transNombre} onChange={(e) => setTransNombre(e.target.value)} />
            </div>
            {transNaturaleza === 1 ? (
              <>
                <div className="col-8 md:col-3">
                  <label>RUC</label>
                  <InputText className="w-full" value={transRuc} maxLength={8} onChange={(e) => setTransRuc(e.target.value)} />
                </div>
                <div className="col-4 md:col-1">
                  <label>DV</label>
                  <InputText className="w-full" value={transDv} maxLength={1} onChange={(e) => setTransDv(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="col-6 md:col-2">
                  <label>Tipo doc.</label>
                  <Dropdown className="w-full" value={transTipoDoc} options={tiposDocumento} onChange={(e) => setTransTipoDoc(e.value)} />
                </div>
                <div className="col-6 md:col-2">
                  <label>Nº doc.</label>
                  <InputText className="w-full" value={transNroDoc} onChange={(e) => setTransNroDoc(e.target.value)} />
                </div>
              </>
            )}
            <div className="col-12 md:col-6">
              <label>Domicilio fiscal del transportista</label>
              <InputText className="w-full" value={transDomicilio} maxLength={150} onChange={(e) => setTransDomicilio(e.target.value)} />
            </div>
            <div className="col-6 md:col-2">
              <label>CI del chofer</label>
              <InputText className="w-full" value={choferDoc} onChange={(e) => setChoferDoc(e.target.value)} />
            </div>
            <div className="col-6 md:col-4">
              <label>Nombre del chofer</label>
              <InputText className="w-full" value={choferNombre} onChange={(e) => setChoferNombre(e.target.value)} />
            </div>
            <div className="col-12">
              <label>Dirección del chofer</label>
              <InputText className="w-full" value={choferDireccion} onChange={(e) => setChoferDireccion(e.target.value)} />
            </div>
          </>
        )}

        <div className="col-12"><h4 className="m-0 mt-2">Mercadería</h4></div>
        {facturaRemitida ? (
          <div className="col-12">
            <ul className="m-0 pl-3">
              {facturaRemitida.items.map((it, i) => (
                <li key={i}>{it.cantidad} × {it.descripcion}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="col-12">
            {items.map((it, i) => (
              <div key={i} className="grid align-items-end" style={{ borderBottom: "1px solid #f3f4f6", margin: 0 }}>
                <div className="col-12 md:col-8">
                  <small>Producto</small>
                  <AutoComplete
                    className="w-full"
                    inputClassName="w-full"
                    value={it.producto}
                    suggestions={sugProducto}
                    completeMethod={buscarProductos}
                    field="descripcion"
                    placeholder="Buscar producto"
                    forceSelection
                    onChange={(e) => {
                      const producto = typeof e.value === "object" ? (e.value as Opcion) : null;
                      setItems((prev) => prev.map((x, j) => (j === i ? { ...x, producto } : x)));
                    }}
                  />
                </div>
                <div className="col-8 md:col-3">
                  <small>Cantidad</small>
                  <InputNumber value={it.cantidad} min={0} maxFractionDigits={4} inputStyle={{ width: "100%" }} onValueChange={(e) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, cantidad: e.value ?? null } : x)))} />
                </div>
                <div className="col-4 md:col-1 flex justify-content-end">
                  <Button icon="pi pi-trash" severity="danger" text rounded disabled={items.length === 1} onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))} />
                </div>
              </div>
            ))}
            <Button className="mt-2" label="Agregar ítem" icon="pi pi-plus" text onClick={() => setItems((prev) => [...prev, { producto: null, cantidad: 1 }])} />
          </div>
        )}

        <div className="col-12 md:col-6">
          <label>Descontar del depósito (opcional)</label>
          <Dropdown className="w-full" value={depositoOrigenId} options={depositos} optionLabel="nombre" optionValue="id" placeholder="No mover stock" showClear onChange={(e) => setDepositoOrigenId(e.value ?? null)} />
        </div>
        <div className="col-12 md:col-6">
          <label>Ingresar al depósito (opcional)</label>
          <Dropdown className="w-full" value={depositoDestinoId} options={depositos} optionLabel="nombre" optionValue="id" placeholder="No mover stock" showClear onChange={(e) => setDepositoDestinoId(e.value ?? null)} />
        </div>
        <div className="col-12">
          <small className="text-color-secondary">
            El stock sólo se mueve si indicás ambos depósitos (traslado entre locales). En una remisión de venta la factura ya
            descontó el stock.
          </small>
        </div>

        <div className="col-12">
          <label>Información adicional (opcional)</label>
          <InputTextarea className="w-full" rows={2} value={infAdic} onChange={(e) => setInfAdic(e.target.value)} />
        </div>

        <div className="col-12 flex justify-content-end">
          <Button label="Emitir nota de remisión" icon="pi pi-check" severity="success" loading={guardando} onClick={guardar} />
        </div>
      </div>
    </div>
  );
}
