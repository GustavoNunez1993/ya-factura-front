import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { RadioButton } from "primereact/radiobutton";
import { Checkbox } from "primereact/checkbox";
import { TabView, TabPanel } from "primereact/tabview";

import { ProveedorService } from "../../services/ProveedorService";
import { useIsMobile } from "../../hooks/useIsMobile";
import { CiudadesService } from "../../services/CiudadesService";
import { PaisService } from "../../services/PaisService";
import { DepartamentoService } from "../../services/DepartamentoService";
import { DistritoService } from "../../services/DistritoService";
import { TipoDocumentoService } from "../../services/TipoDocumentoService";
import { BancoService } from "../../services/BancoService";

interface Opcion {
    id: string | number;
    codigo?: string | number;
    descripcion: string;
}

interface ProveedorRelacion {
    id: string | number;
    descripcion?: string;
}

interface Proveedor {
    id?: string;
    naturaleza: number | null;
    tipoContribuyente: number | null;
    descripcion: string;
    direccion: string;
    telefono: string;
    celular: string;
    email: string;
    ruc: string;
    dv: string;
    otroTipoDocumento: string;
    nroDocumento: string;
    tipoDocumentoId: string | number | null;
    ciudadId: string | null;
    paisId: string | null;
    departamentoId?: string | null;
    distritoId?: string | null;
    bancoId: string | null;
    nroCuenta: string;
    encargadoVisitas: string;
    telefonoEncargado: string;
    diasVisita: string[];
    empresaId: string;
    tipoDocumento?: ProveedorRelacion | null;
    ciudad?: ProveedorRelacion | null;
    pais?: ProveedorRelacion | null;
    departamento?: ProveedorRelacion | null;
    distrito?: ProveedorRelacion | null;
    banco?: ProveedorRelacion | null;
    active?: boolean;
}

export default function ProveedoresPage() {
    const empresaId = localStorage.getItem("empresaId") || "";

    const TIPO_CONTRIBUYENTE = {
        NO_CONTRIBUYENTE: 2,
        CONTRIBUYENTE: 1
    };

    const TIPO_DOCUMENTO_OTRO = 7;

    const DIAS_SEMANA = [
        { id: "LUNES", descripcion: "Lunes" },
        { id: "MARTES", descripcion: "Martes" },
        { id: "MIERCOLES", descripcion: "Miércoles" },
        { id: "JUEVES", descripcion: "Jueves" },
        { id: "VIERNES", descripcion: "Viernes" },
        { id: "SABADO", descripcion: "Sábado" },
        { id: "DOMINGO", descripcion: "Domingo" }
    ];

    const crearFormularioInicial = (): Proveedor => ({
        naturaleza: 1,
        tipoContribuyente: TIPO_CONTRIBUYENTE.CONTRIBUYENTE,
        descripcion: "",
        direccion: "",
        telefono: "",
        celular: "",
        email: "",
        ruc: "",
        dv: "",
        otroTipoDocumento: "",
        nroDocumento: "",
        tipoDocumentoId: null,
        ciudadId: null,
        paisId: null,
        departamentoId: null,
        distritoId: null,
        bancoId: null,
        nroCuenta: "",
        encargadoVisitas: "",
        telefonoEncargado: "",
        diasVisita: [],
        empresaId,
        tipoDocumento: null,
        ciudad: null,
        pais: null,
        departamento: null,
        distrito: null,
        banco: null,
        active: true
    });

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(0);
    const size = 10;

    const [search, setSearch] = useState("");
    const isMobile = useIsMobile();

    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [editing, setEditing] = useState<Proveedor | null>(null);

    const [ciudades, setCiudades] = useState<Opcion[]>([]);
    const [paises, setPaises] = useState<Opcion[]>([]);
    const [departamentos, setDepartamentos] = useState<Opcion[]>([]);
    const [distritos, setDistritos] = useState<Opcion[]>([]);
    const [tiposDocumento, setTiposDocumento] = useState<Opcion[]>([]);
    const [bancos, setBancos] = useState<Opcion[]>([]);

    const [form, setForm] = useState<Proveedor>(crearFormularioInicial());

    const parseDiasVisita = (valor: any): string[] => {
        if (Array.isArray(valor)) return valor;
        if (typeof valor !== "string" || !valor.trim()) return [];

        try {
            const parseado = JSON.parse(valor);
            return Array.isArray(parseado) ? parseado : [];
        } catch {
            return [];
        }
    };

    const adaptarProveedorDesdeApi = (data: any): Proveedor => ({
        id: data.id,
        naturaleza: data.naturaleza ?? 1,
        tipoContribuyente: data.tipoContribuyente ?? TIPO_CONTRIBUYENTE.CONTRIBUYENTE,
        descripcion: data.descripcion ?? "",
        direccion: data.direccion ?? "",
        telefono: data.telefono ?? "",
        celular: data.celular ?? "",
        email: data.email ?? "",
        ruc: data.ruc ?? "",
        dv: data.dv ?? "",
        otroTipoDocumento: data.otroTipoDocumento ?? "",
        nroDocumento: data.nroDocumento ?? "",

        tipoDocumentoId: data.tipoDocumentoId ?? data.tipoDocumento?.id ?? null,
        ciudadId: data.ciudadId ?? data.ciudad?.id ?? null,
        paisId: data.paisId ?? data.pais?.id ?? null,
        departamentoId: data.departamentoId ?? data.departamento?.id ?? null,
        distritoId: data.distritoId ?? data.distrito?.id ?? null,
        bancoId: data.bancoId ?? data.banco?.id ?? null,
        nroCuenta: data.nroCuenta ?? "",
        encargadoVisitas: data.encargadoVisitas ?? "",
        telefonoEncargado: data.telefonoEncargado ?? "",
        diasVisita: parseDiasVisita(data.diasVisita),
        empresaId: data.empresaId ?? data.empresa?.id ?? empresaId,

        tipoDocumento: data.tipoDocumento ?? (
            data.tipoDocumentoId
                ? { id: data.tipoDocumentoId, descripcion: data.tipoDocumentoDescripcion }
                : null
        ),

        ciudad: data.ciudad ?? (
            data.ciudadId
                ? { id: data.ciudadId, descripcion: data.ciudadDescripcion }
                : null
        ),

        pais: data.pais ?? (
            data.paisId
                ? { id: data.paisId, descripcion: data.paisDescripcion }
                : null
        ),

        departamento: data.departamento ?? (
            data.departamentoId
                ? { id: data.departamentoId, descripcion: data.departamentoDescripcion }
                : null
        ),

        distrito: data.distrito ?? null,

        banco: data.banco ?? (
            data.bancoId
                ? { id: data.bancoId, descripcion: data.bancoDescripcion }
                : null
        ),

        active: data.active ?? true
    });

    const buildPayload = (proveedor: Proveedor) => ({
        tipoDocumentoId: proveedor.tipoDocumentoId || null,
        ciudadId: proveedor.ciudadId || null,
        paisId: proveedor.paisId || null,
        departamentoId: proveedor.departamentoId || null,
        bancoId: proveedor.bancoId || null,
        empresaId: proveedor.empresaId || empresaId,
        encargadoVisitas: proveedor.encargadoVisitas,
        telefonoEncargado: proveedor.telefonoEncargado,
        diasVisita: JSON.stringify(proveedor.diasVisita ?? []),

        naturaleza: proveedor.naturaleza,
        tipoContribuyente: proveedor.tipoContribuyente,
        descripcion: proveedor.descripcion,
        direccion: proveedor.direccion,
        telefono: proveedor.telefono,
        celular: proveedor.celular,
        email: proveedor.email,
        ruc: proveedor.ruc,
        dv: proveedor.dv,
        otroTipoDocumento: proveedor.otroTipoDocumento,
        nroDocumento: proveedor.nroDocumento,
        nroCuenta: proveedor.nroCuenta
    });

    const esTipoDocumentoOtro = (tipoDocumentoId: string | number | null) => {
        const tipoDocumento = tiposDocumento.find((item) => item.id === tipoDocumentoId);
        return Number(tipoDocumento?.codigo) === TIPO_DOCUMENTO_OTRO;
    };

    const cargarProveedores = async () => {
        try {
            const res = await ProveedorService.getPaginated(page, size, search);
            const content = (res?.content ?? []).map((item: any) => adaptarProveedorDesdeApi(item));
            setProveedores(content);
            setTotal(res?.totalElements ?? 0);
        } catch (error) {
            console.error("Error cargando proveedores", error);
            setProveedores([]);
            setTotal(0);
        }
    };

    const cargarCatalogos = async () => {
        try {
            const [paisesRes, tiposDocumentoRes, bancosRes] = await Promise.all([
                PaisService.getAll(),
                TipoDocumentoService.getAll(),
                BancoService.getAll()
            ]);

            setPaises(
                (paisesRes ?? []).map((item: any) => ({
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion
                }))
            );

            setTiposDocumento(
                (tiposDocumentoRes ?? []).map((item: any) => ({
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion
                }))
            );

            setBancos(
                (bancosRes ?? []).map((item: any) => ({
                    id: item.id,
                    codigo: item.codigo,
                    descripcion: item.descripcion
                }))
            );
        } catch (error) {
            console.error("Error cargando catálogos", error);
            setPaises([]);
            setTiposDocumento([]);
            setBancos([]);
        }
    };

    const cargarDepartamentosPorPais = async (paisId: string) => {
        try {
            const data = await DepartamentoService.getByPaisId(paisId);

            setDepartamentos(
                (data ?? []).map((item: any) => ({
                    id: item.id,
                    descripcion: item.descripcion
                }))
            );
        } catch (error) {
            console.error("Error cargando departamentos", error);
            setDepartamentos([]);
        }
    };

    const cargarDistritosPorDepartamento = async (departamentoId: string) => {
        try {
            const data = await DistritoService.getByDepartamentoId(departamentoId);

            setDistritos(
                (data ?? []).map((item: any) => ({
                    id: item.id,
                    descripcion: item.descripcion
                }))
            );
        } catch (error) {
            console.error("Error cargando distritos", error);
            setDistritos([]);
        }
    };

    const cargarCiudadesPorDistrito = async (distritoId: string) => {
        try {
            const data = await CiudadesService.getByDistritoId(distritoId);

            setCiudades(
                (data ?? []).map((item: any) => ({
                    id: item.id,
                    descripcion: item.descripcion
                }))
            );
        } catch (error) {
            console.error("Error cargando ciudades", error);
            setCiudades([]);
        }
    };

    useEffect(() => {
        if (empresaId) {
            cargarProveedores();
        }
    }, [page, search, empresaId]);

    useEffect(() => {
        cargarCatalogos();
    }, []);

    useEffect(() => {
        if (form.paisId) {
            cargarDepartamentosPorPais(String(form.paisId));
        } else {
            setDepartamentos([]);
        }
    }, [form.paisId]);

    useEffect(() => {
        if (form.departamentoId) {
            cargarDistritosPorDepartamento(String(form.departamentoId));
        } else {
            setDistritos([]);
        }
    }, [form.departamentoId]);

    useEffect(() => {
        if (form.distritoId) {
            cargarCiudadesPorDistrito(String(form.distritoId));
        } else {
            setCiudades([]);
        }
    }, [form.distritoId]);

    const cerrarDialog = () => {
        setOpen(false);
        setViewMode(false);
        setEditing(null);
        setForm(crearFormularioInicial());
        setDepartamentos([]);
        setDistritos([]);
        setCiudades([]);
    };

    const abrirNuevo = () => {
        setEditing(null);
        setViewMode(false);
        setForm(crearFormularioInicial());
        setDepartamentos([]);
        setDistritos([]);
        setCiudades([]);
        setOpen(true);
    };

    const ver = async (proveedor: Proveedor) => {
        try {
            const data = await ProveedorService.getById(proveedor.id!);
            const adaptado = adaptarProveedorDesdeApi(data);

            setViewMode(true);
            setEditing(adaptado);
            setForm(adaptado);

            if (adaptado.paisId) {
                await cargarDepartamentosPorPais(String(adaptado.paisId));
            }

            if (adaptado.departamentoId) {
                await cargarDistritosPorDepartamento(String(adaptado.departamentoId));
            }

            if (adaptado.distritoId) {
                await cargarCiudadesPorDistrito(String(adaptado.distritoId));
            }

            setOpen(true);
        } catch (error) {
            Swal.fire("Error", "No se pudo cargar el proveedor", "error");
        }
    };

    const editar = async (proveedor: Proveedor) => {
        try {
            const data = await ProveedorService.getById(proveedor.id!);
            const adaptado = adaptarProveedorDesdeApi(data);

            setViewMode(false);
            setEditing(adaptado);
            setForm(adaptado);

            if (adaptado.paisId) {
                await cargarDepartamentosPorPais(String(adaptado.paisId));
            }

            if (adaptado.departamentoId) {
                await cargarDistritosPorDepartamento(String(adaptado.departamentoId));
            }

            if (adaptado.distritoId) {
                await cargarCiudadesPorDistrito(String(adaptado.distritoId));
            }

            setOpen(true);
        } catch (error) {
            Swal.fire("Error", "No se pudo cargar el proveedor", "error");
        }
    };

    const cambiarTipoContribuyente = (valor: number) => {
        setForm((prev) => ({
            ...prev,
            tipoContribuyente: valor,
            ruc: valor === TIPO_CONTRIBUYENTE.CONTRIBUYENTE ? prev.ruc : "",
            dv: valor === TIPO_CONTRIBUYENTE.CONTRIBUYENTE ? prev.dv : "",
            tipoDocumentoId: valor === TIPO_CONTRIBUYENTE.NO_CONTRIBUYENTE ? prev.tipoDocumentoId : null,
            nroDocumento: valor === TIPO_CONTRIBUYENTE.NO_CONTRIBUYENTE ? prev.nroDocumento : "",
            otroTipoDocumento: valor === TIPO_CONTRIBUYENTE.NO_CONTRIBUYENTE ? prev.otroTipoDocumento : ""
        }));
    };

    const guardar = async () => {
        try {
            if (!form.tipoContribuyente) {
                Swal.fire("Atención", "Debe seleccionar el tipo de contribuyente", "warning");
                return;
            }

            if (!form.naturaleza) {
                Swal.fire("Atención", "Debe seleccionar la naturaleza del proveedor", "warning");
                return;
            }

            if (!form.descripcion.trim()) {
                Swal.fire("Atención", "La descripción es obligatoria", "warning");
                return;
            }

            if (form.tipoContribuyente === TIPO_CONTRIBUYENTE.CONTRIBUYENTE) {
                if (!form.ruc.trim()) {
                    Swal.fire("Atención", "El RUC es obligatorio para contribuyentes", "warning");
                    return;
                }

                if (!form.dv.trim()) {
                    Swal.fire("Atención", "El DV es obligatorio para contribuyentes", "warning");
                    return;
                }
            }

            if (form.tipoContribuyente === TIPO_CONTRIBUYENTE.NO_CONTRIBUYENTE) {
                if (!form.tipoDocumentoId) {
                    Swal.fire("Atención", "El tipo de documento es obligatorio", "warning");
                    return;
                }

                if (!form.nroDocumento.trim()) {
                    Swal.fire("Atención", "El número de documento es obligatorio", "warning");
                    return;
                }

                if (
                    esTipoDocumentoOtro(form.tipoDocumentoId) &&
                    !form.otroTipoDocumento.trim()
                ) {
                    Swal.fire("Atención", "Debe informar el otro tipo de documento", "warning");
                    return;
                }
            }

            const payload = buildPayload(form);

            if (editing?.id) {
                await ProveedorService.update(editing.id, payload);
                Swal.fire("Actualizado", "Proveedor actualizado correctamente", "success");
            } else {
                await ProveedorService.create(payload);
                Swal.fire("Creado", "Proveedor creado correctamente", "success");
            }

            cerrarDialog();
            cargarProveedores();
        } catch (error: any) {
            console.error("Error guardando proveedor", error);
            const mensaje = error?.response?.data?.message || "No se pudo guardar el proveedor";
            Swal.fire("Error", mensaje, "error");
        }
    };

    const eliminar = async (id?: string) => {
        if (!id) return;

        const result = await Swal.fire({
            title: "¿Dar de baja el proveedor?",
            text: "El proveedor pasará a estado inactivo",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, dar de baja",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            await ProveedorService.remove(id);
            Swal.fire("Dado de baja", "Proveedor dado de baja correctamente", "success");
            cargarProveedores();
        } catch (error) {
            console.error("Error dando de baja al proveedor", error);
            Swal.fire("Error", "No se pudo dar de baja", "error");
        }
    };

    const accionesTemplate = (rowData: Proveedor) => (
        <div className="flex gap-2 justify-content-center">
            <Button
                icon="pi pi-eye"
                rounded
                text
                severity="info"
                tooltip="Ver"
                onClick={() => ver(rowData)}
            />
            <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="warning"
                tooltip="Editar"
                onClick={() => editar(rowData)}
            />
            <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                tooltip="Dar de baja"
                onClick={() => eliminar(rowData.id)}
            />
        </div>
    );

    const estadoBodyTemplate = (rowData: Proveedor) => {
        const activo = rowData.active !== false;

        return (
            <span
                style={{
                    display: "inline-block",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "12px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    minWidth: "90px",
                    textAlign: "center",
                    backgroundColor: activo ? "#d4edda" : "#f8d7da",
                    color: activo ? "#127e2b" : "#721c24"
                }}
            >
                {activo ? "Activo" : "Inactivo"}
            </span>
        );
    };

    const rucCompletoTemplate = (rowData: Proveedor) => {
        if (!rowData.ruc) return "-";
        return `${rowData.ruc}${rowData.dv ? "-" + rowData.dv : ""}`;
    };

    const esContribuyente = form.tipoContribuyente === TIPO_CONTRIBUYENTE.CONTRIBUYENTE;
    const esNoContribuyente = form.tipoContribuyente === TIPO_CONTRIBUYENTE.NO_CONTRIBUYENTE;
    const esOtroTipoDocumento = esTipoDocumentoOtro(form.tipoDocumentoId);

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h2 className="m-0">Proveedores</h2>
                    <small className="text-color-secondary">Gestión de proveedores</small>
                </div>
                <Button label="Nuevo Proveedor" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
            </div>

            <div className="p-input-icon-left mb-3 w-full">
                <i className="pi pi-search" />
                <InputText
                    className="w-full"
                    placeholder="Buscar por descripción, documento, ruc..."
                    value={search}
                    onChange={(e) => { setPage(0); setSearch(e.target.value); }}
                />
            </div>

            {isMobile ? (
                <>
                    {proveedores.length === 0 ? (
                        <p style={{ textAlign: "center", color: "var(--text-color-secondary)", padding: "24px 0" }}>No existen proveedores registrados</p>
                    ) : proveedores.map((item) => (
                        <div key={item.id} style={{ border: "1px solid var(--surface-border)", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "var(--surface-card)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.descripcion}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-color-secondary)", marginTop: 3, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                                        {item.nroDocumento && <span>Doc: {item.nroDocumento}</span>}
                                        {item.ruc && <span>RUC: {item.ruc}{item.dv ? "-" + item.dv : ""}</span>}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-color-secondary)", marginTop: 2, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                                        {item.telefono && <span>Tel: {item.telefono}</span>}
                                        {item.celular && <span>Cel: {item.celular}</span>}
                                    </div>
                                    {item.email && <div style={{ fontSize: 12, color: "var(--text-color-secondary)", marginTop: 2 }}>{item.email}</div>}
                                    {item.banco?.descripcion && (
                                        <div style={{ fontSize: 12, color: "var(--text-color-secondary)", marginTop: 2 }}>
                                            Banco: {item.banco.descripcion}{item.nroCuenta ? ` (Cta. ${item.nroCuenta})` : ""}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                    {estadoBodyTemplate(item)}
                                    {accionesTemplate(item)}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, alignItems: "center" }}>
                        <Button icon="pi pi-angle-left" text size="small" disabled={page === 0} onClick={() => setPage(page - 1)} />
                        <span style={{ fontSize: 13, color: "#6b7280" }}>Pág. {page + 1} de {Math.max(1, Math.ceil(total / size))}</span>
                        <Button icon="pi pi-angle-right" text size="small" disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)} />
                    </div>
                </>
            ) : (
                <div style={{ overflowX: "auto" }}>
                <DataTable
                    value={proveedores}
                    paginator
                    rows={size}
                    totalRecords={total}
                    lazy
                    size="small"
                    first={page * size}
                    onPage={(e) => setPage(e.page ?? 0)}
                    stripedRows
                    showGridlines
                    emptyMessage="No existen proveedores registrados"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                >
                    <Column field="descripcion" header="Descripción" sortable />

                    <Column
                        field="nroDocumento"
                        header="Nro. Documento"
                        sortable
                        style={{ width: "160px", textAlign: "center" }}
                    />

                    <Column
                        header="RUC"
                        body={rucCompletoTemplate}
                        style={{ width: "140px", textAlign: "center" }}
                    />

                    <Column
                        field="telefono"
                        header="Teléfono"
                        style={{ width: "130px", textAlign: "center" }}
                    />

                    <Column
                        field="celular"
                        header="Celular"
                        style={{ width: "130px", textAlign: "center" }}
                    />

                    <Column field="email" header="Email" style={{ minWidth: "200px" }} />


                    <Column
                        field="active"
                        header="Estado"
                        body={estadoBodyTemplate}
                        style={{ width: "120px", textAlign: "center" }}
                    />

                    <Column
                        header="Acciones"
                        body={accionesTemplate}
                        style={{ width: "140px" }}
                    />
                </DataTable>
                </div>
            )}

            <Dialog
                header={viewMode ? "Ver proveedor" : editing ? "Editar proveedor" : "Nuevo proveedor"}
                visible={open}
                modal
                draggable={false}
                resizable={false}
                style={{ width: "1000px" }}
                onHide={cerrarDialog}
            >
                <TabView>
                <TabPanel header="Datos Generales">
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <label className="block mb-3 font-medium">
                            Tipo Contribuyente <span className="text-red-500">*</span>
                        </label>

                        <div
                            className="flex flex-wrap gap-4 border-1 border-300 border-round p-3"
                            style={{ minHeight: "58px", alignItems: "center" }}
                        >
                            <div className="flex align-items-center">
                                <RadioButton
                                    inputId="tipoContribuyente1"
                                    name="tipoContribuyente"
                                    value={TIPO_CONTRIBUYENTE.CONTRIBUYENTE}
                                    disabled={viewMode}
                                    onChange={(e) => cambiarTipoContribuyente(e.value)}
                                    checked={form.tipoContribuyente === TIPO_CONTRIBUYENTE.CONTRIBUYENTE}
                                />
                                <label htmlFor="tipoContribuyente1" className="ml-2 cursor-pointer">
                                    Contribuyente
                                </label>
                            </div>

                            <div className="flex align-items-center">
                                <RadioButton
                                    inputId="tipoContribuyente2"
                                    name="tipoContribuyente"
                                    value={TIPO_CONTRIBUYENTE.NO_CONTRIBUYENTE}
                                    disabled={viewMode}
                                    onChange={(e) => cambiarTipoContribuyente(e.value)}
                                    checked={form.tipoContribuyente === TIPO_CONTRIBUYENTE.NO_CONTRIBUYENTE}
                                />
                                <label htmlFor="tipoContribuyente2" className="ml-2 cursor-pointer">
                                    No contribuyente
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 md:col-6">
                        <label className="block mb-3 font-medium">
                            Naturaleza del Proveedor <span className="text-red-500">*</span>
                        </label>

                        <div
                            className="flex flex-wrap gap-4 border-1 border-300 border-round p-3"
                            style={{ minHeight: "58px", alignItems: "center" }}
                        >
                            <div className="flex align-items-center">
                                <RadioButton
                                    inputId="naturaleza1"
                                    name="naturaleza"
                                    value={1}
                                    disabled={viewMode}
                                    onChange={(e) => setForm({ ...form, naturaleza: e.value })}
                                    checked={form.naturaleza === 1}
                                />
                                <label htmlFor="naturaleza1" className="ml-2 cursor-pointer">
                                    Persona Física
                                </label>
                            </div>

                            <div className="flex align-items-center">
                                <RadioButton
                                    inputId="naturaleza2"
                                    name="naturaleza"
                                    value={2}
                                    disabled={viewMode}
                                    onChange={(e) => setForm({ ...form, naturaleza: e.value })}
                                    checked={form.naturaleza === 2}
                                />
                                <label htmlFor="naturaleza2" className="ml-2 cursor-pointer">
                                    Persona Jurídica
                                </label>
                            </div>
                        </div>
                    </div>

                    {esContribuyente && (
                        <>
                            <div className="col-12 md:col-3">
                                <label>RUC <span className="text-red-500">*</span></label>
                                <InputText
                                    placeholder="99999999"
                                    className="w-full"
                                    disabled={viewMode}
                                    value={form.ruc}
                                    onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                                />
                            </div>

                            <div className="col-12 md:col-2">
                                <label>DV <span className="text-red-500">*</span></label>
                                <InputText
                                    placeholder="X"
                                    className="w-full"
                                    disabled={viewMode}
                                    value={form.dv}
                                    maxLength={2}
                                    onChange={(e) => setForm({ ...form, dv: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {esNoContribuyente && (
                        <>
                            <div className="col-12 md:col-4">
                                <label>Tipo Documento <span className="text-red-500">*</span></label>
                                <Dropdown
                                    className="w-full"
                                    disabled={viewMode}
                                    value={form.tipoDocumentoId}
                                    options={tiposDocumento}
                                    optionLabel="descripcion"
                                    optionValue="id"
                                    placeholder="Seleccione Tipo Documento"
                                    filter
                                    showClear
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tipoDocumentoId: e.value,
                                            otroTipoDocumento:
                                                esTipoDocumentoOtro(e.value)
                                                    ? form.otroTipoDocumento
                                                    : ""
                                        })
                                    }
                                />
                            </div>

                            <div className="col-12 md:col-3">
                                <label>Nro. Documento <span className="text-red-500">*</span></label>
                                <InputText
                                    placeholder="9999999"
                                    className="w-full"
                                    disabled={viewMode}
                                    value={form.nroDocumento}
                                    onChange={(e) => setForm({ ...form, nroDocumento: e.target.value })}
                                />
                            </div>

                            {esOtroTipoDocumento && (
                                <div className="col-12 md:col-4">
                                    <label>Otro Tipo Documento</label>
                                    <InputText
                                        placeholder="Informar con un minimo de 9 caracteres"
                                        className="w-full"
                                        disabled={viewMode}
                                        value={form.otroTipoDocumento}
                                        onChange={(e) =>
                                            setForm({ ...form, otroTipoDocumento: e.target.value })
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className="col-12 md:col-7">
                        <label>Descripción <span className="text-red-500">*</span></label>
                        <InputText
                            placeholder="Razón social o nombre del proveedor"
                            className="w-full"
                            disabled={viewMode}
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        />
                    </div>

                    <div className="col-12 md:col-5">
                        <label>Dirección</label>
                        <InputText
                            placeholder="Calle 1 c/ calle 2"
                            className="w-full"
                            disabled={viewMode}
                            value={form.direccion}
                            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>País</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.paisId}
                            options={paises}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione un País"
                            filter
                            showClear
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    paisId: e.value,
                                    departamentoId: null,
                                    distritoId: null,
                                    ciudadId: null
                                })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Departamento</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode || !form.paisId}
                            value={form.departamentoId}
                            options={departamentos}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione un Departamento"
                            filter
                            showClear
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    departamentoId: e.value,
                                    distritoId: null,
                                    ciudadId: null
                                })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Distrito</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode || !form.departamentoId}
                            value={form.distritoId}
                            options={distritos}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione un Distrito"
                            filter
                            showClear
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    distritoId: e.value,
                                    ciudadId: null
                                })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Ciudad</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode || !form.distritoId}
                            value={form.ciudadId}
                            options={ciudades}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione una Ciudad"
                            filter
                            showClear
                            onChange={(e) => setForm({ ...form, ciudadId: e.value })}
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Teléfono</label>
                        <InputText
                            placeholder="0999-9999999"
                            className="w-full"
                            disabled={viewMode}
                            value={form.telefono}
                            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Celular</label>
                        <InputText
                            placeholder="0999-9999999"
                            className="w-full"
                            disabled={viewMode}
                            value={form.celular}
                            onChange={(e) => setForm({ ...form, celular: e.target.value })}
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Email</label>
                        <InputText
                            placeholder="tucorreo@mail.com"
                            className="w-full"
                            disabled={viewMode}
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div className="col-12 md:col-6">
                        <label>Banco</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.bancoId}
                            options={bancos}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione un Banco"
                            filter
                            showClear
                            onChange={(e) => setForm({ ...form, bancoId: e.value })}
                        />
                    </div>

                    <div className="col-12 md:col-6">
                        <label>Nro. de Cuenta</label>
                        <InputText
                            placeholder="Nro. de cuenta bancaria"
                            className="w-full"
                            disabled={viewMode}
                            value={form.nroCuenta}
                            onChange={(e) => setForm({ ...form, nroCuenta: e.target.value })}
                        />
                    </div>

                </div>
                </TabPanel>

                <TabPanel header="Visitas">
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <label>Repartidor / Encargado de Visitas</label>
                        <InputText
                            placeholder="Nombre del encargado"
                            className="w-full"
                            disabled={viewMode}
                            value={form.encargadoVisitas}
                            onChange={(e) => setForm({ ...form, encargadoVisitas: e.target.value })}
                        />
                    </div>

                    <div className="col-12 md:col-6">
                        <label>Teléfono del Encargado</label>
                        <InputText
                            placeholder="0999-9999999"
                            className="w-full"
                            disabled={viewMode}
                            value={form.telefonoEncargado}
                            onChange={(e) => setForm({ ...form, telefonoEncargado: e.target.value })}
                        />
                    </div>

                    <div className="col-12">
                        <label className="block mb-2">Días de Visita</label>
                        <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--surface-border)" }}>Día</th>
                                    <th style={{ textAlign: "center", padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--surface-border)", width: "100px" }}>Visita</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DIAS_SEMANA.map((dia, index) => {
                                    const marcado = form.diasVisita.includes(dia.id);

                                    return (
                                        <tr
                                            key={dia.id}
                                            style={{ backgroundColor: index % 2 === 0 ? "transparent" : "var(--surface-hover)" }}
                                        >
                                            <td style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--surface-border)" }}>{dia.descripcion}</td>
                                            <td style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--surface-border)", textAlign: "center" }}>
                                                <Checkbox
                                                    inputId={`dia-visita-${dia.id}`}
                                                    checked={marcado}
                                                    disabled={viewMode}
                                                    onChange={() => {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            diasVisita: marcado
                                                                ? prev.diasVisita.filter((d) => d !== dia.id)
                                                                : [...prev.diasVisita, dia.id]
                                                        }));
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                </TabPanel>
                </TabView>

                {!viewMode && (
                    <div className="flex justify-content-end gap-2 mt-4">
                        <Button label="Cancelar" severity="secondary" onClick={cerrarDialog} />

                        <Button
                            label="Guardar"
                            icon="pi pi-check"
                            severity="success"
                            onClick={guardar}
                        />
                    </div>
                )}
            </Dialog>
        </div>
    );
}
