import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";

import { PersonaService } from "../../services/PersonaService";
import { CiudadesService } from "../../services/CiudadesService";
import { PaisService } from "../../services/PaisService";
import { DepartamentoService } from "../../services/DepartamentoService";
import { DistritoService } from "../../services/DistritoService";
import { TipoDocumentoService } from "../../services/TipoDocumentoService";

interface Opcion {
    id: string | number;
    codigo?: string | number;
    descripcion: string;
}

interface PersonaRelacion {
    id: string | number;
    descripcion?: string;
}

interface Persona {
    id?: string;
    naturaleza: number | null;
    tipoContribuyente: number | null;
    razonSocial: string;
    direccion: string;
    nroCasa: number | null;
    telefono: string;
    celular: string;
    email: string;
    ruc: string;
    dv: string;
    otroTipoDocumento: string;
    nroDocumento: string;
    emailCopia: string;
    emailAdicional: string;
    tipoOperacion: number | null;
    diplomatico: boolean;
    tipoDocumentoId: string | number | null;
    ciudadId: string | null;
    paisId: string | null;
    departamentoId?: string | null;
    distritoId?: string | null;
    empresaId: string;
    tipoDocumento?: PersonaRelacion | null;
    ciudad?: PersonaRelacion | null;
    pais?: PersonaRelacion | null;
    departamento?: PersonaRelacion | null;
    distrito?: PersonaRelacion | null;
    active?: boolean;
}

export default function PersonasPage() {
    const empresaId = localStorage.getItem("empresaId") || "";

    const TIPO_CONTRIBUYENTE = {
        NO_CONTRIBUYENTE: 2,
        CONTRIBUYENTE: 1
    };

    const TIPO_DOCUMENTO_OTRO = 7;

    const crearFormularioInicial = (): Persona => ({
        naturaleza: 1,
        tipoContribuyente: TIPO_CONTRIBUYENTE.CONTRIBUYENTE,
        razonSocial: "",
        direccion: "",
        nroCasa: null,
        telefono: "",
        celular: "",
        email: "",
        ruc: "",
        dv: "",
        otroTipoDocumento: "",
        nroDocumento: "",
        emailCopia: "",
        emailAdicional: "",
        tipoDocumentoId: null,
        ciudadId: null,
        paisId: null,
        departamentoId: null,
        distritoId: null,
        empresaId,
        tipoOperacion: null,
        diplomatico: false,
        tipoDocumento: null,
        ciudad: null,
        pais: null,
        departamento: null,
        distrito: null,
        active: true
    });

    const [personas, setPersonas] = useState<Persona[]>([]);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(0);
    const size = 10;

    const [search, setSearch] = useState("");

    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [editing, setEditing] = useState<Persona | null>(null);

    const [ciudades, setCiudades] = useState<Opcion[]>([]);
    const [paises, setPaises] = useState<Opcion[]>([]);
    const [departamentos, setDepartamentos] = useState<Opcion[]>([]);
    const [distritos, setDistritos] = useState<Opcion[]>([]);
    const [tiposDocumento, setTiposDocumento] = useState<Opcion[]>([]);

    const [form, setForm] = useState<Persona>(crearFormularioInicial());

    const tiposOperacion = [
        { id: 1, descripcion: "Negocio a Negocio" },
        { id: 2, descripcion: "Negocio a Consumidor final" },
        { id: 3, descripcion: "Negocio a Gobierno" },
        { id: 4, descripcion: "Negocio a Extranjero" }
    ];

const adaptarPersonaDesdeApi = (data: any): Persona => ({
    id: data.id,
    naturaleza: data.naturaleza ?? 1,
    tipoContribuyente: data.tipoContribuyente ?? TIPO_CONTRIBUYENTE.CONTRIBUYENTE,
    razonSocial: data.razonSocial ?? "",
    direccion: data.direccion ?? "",
    nroCasa: data.nroCasa ?? null,
    telefono: data.telefono ?? "",
    celular: data.celular ?? "",
    email: data.email ?? "",
    ruc: data.ruc ?? "",
    dv: data.dv ?? "",
    otroTipoDocumento: data.otroTipoDocumento ?? "",
    nroDocumento: data.nroDocumento ?? "",
    emailCopia: data.emailCopia ?? "",
    emailAdicional: data.emailAdicional ?? "",

    tipoDocumentoId: data.tipoDocumentoId ?? data.tipoDocumento?.id ?? null,
    ciudadId: data.ciudadId ?? data.ciudad?.id ?? null,
    paisId: data.paisId ?? data.pais?.id ?? null,
    departamentoId: data.departamentoId ?? data.departamento?.id ?? null,
    distritoId: data.distritoId ?? data.distrito?.id ?? null,
    empresaId: data.empresaId ?? data.empresa?.id ?? empresaId,

    tipoOperacion: data.tipoOperacion ?? null,
    diplomatico: data.diplomatico ?? false,

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
    active: data.active ?? true
});

 const buildPayload = (persona: Persona) => ({
    tipoDocumentoId: persona.tipoDocumentoId || null,
    ciudadId: persona.ciudadId || null,
    paisId: persona.paisId || null,
    departamentoId: persona.departamentoId || null,
    empresaId: persona.empresaId || empresaId,

    naturaleza: persona.naturaleza,
    tipoContribuyente: persona.tipoContribuyente,
    razonSocial: persona.razonSocial,
    direccion: persona.direccion,
    nroCasa: persona.nroCasa,
    telefono: persona.telefono,
    celular: persona.celular,
    email: persona.email,
    ruc: persona.ruc,
    dv: persona.dv,
    otroTipoDocumento: persona.otroTipoDocumento,
    nroDocumento: persona.nroDocumento,
    emailCopia: persona.emailCopia,
    emailAdicional: persona.emailAdicional,

    tipoOperacion: persona.tipoOperacion,
    diplomatico: persona.diplomatico
});

    const esTipoDocumentoOtro = (tipoDocumentoId: string | number | null) => {
        const tipoDocumento = tiposDocumento.find((item) => item.id === tipoDocumentoId);
        return Number(tipoDocumento?.codigo) === TIPO_DOCUMENTO_OTRO;
    };

    const cargarPersonas = async () => {
        try {
            const res = await PersonaService.getPaginated(page, size, search);
            const content = (res?.content ?? []).map((item: any) => adaptarPersonaDesdeApi(item));
            setPersonas(content);
            setTotal(res?.totalElements ?? 0);
        } catch (error) {
            console.error("Error cargando personas", error);
            setPersonas([]);
            setTotal(0);
        }
    };

    const cargarCatalogos = async () => {
        try {
            const [paisesRes, tiposDocumentoRes] = await Promise.all([
                PaisService.getAll(),
                TipoDocumentoService.getAll()
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
        } catch (error) {
            console.error("Error cargando catálogos", error);
            setPaises([]);
            setTiposDocumento([]);
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
            cargarPersonas();
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

    const ver = async (persona: Persona) => {
        try {
            const data = await PersonaService.getById(persona.id!);
            const adaptado = adaptarPersonaDesdeApi(data);

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
            Swal.fire("Error", "No se pudo cargar la persona", "error");
        }
    };

    const editar = async (persona: Persona) => {
        try {
            const data = await PersonaService.getById(persona.id!);
            const adaptado = adaptarPersonaDesdeApi(data);

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
            Swal.fire("Error", "No se pudo cargar la persona", "error");
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
                Swal.fire("Atención", "Debe seleccionar la naturaleza de la persona", "warning");
                return;
            }

            if (!form.razonSocial.trim()) {
                Swal.fire("Atención", "La razón social es obligatoria", "warning");
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
                await PersonaService.update(editing.id, payload);
                Swal.fire("Actualizado", "Persona actualizada correctamente", "success");
            } else {
                await PersonaService.create(payload);
                Swal.fire("Creado", "Persona creada correctamente", "success");
            }

            cerrarDialog();
            cargarPersonas();
        } catch (error) {
            console.error("Error guardando persona", error);
            Swal.fire("Error", "No se pudo guardar la persona", "error");
        }
    };

    const eliminar = async (id?: string) => {
        if (!id) return;

        const result = await Swal.fire({
            title: "¿Eliminar persona?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            await PersonaService.remove(id);
            Swal.fire("Eliminado", "Persona eliminada correctamente", "success");
            cargarPersonas();
        } catch (error) {
            console.error("Error eliminando persona", error);
            Swal.fire("Error", "No se pudo eliminar", "error");
        }
    };

    const accionesTemplate = (rowData: Persona) => (
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
                tooltip="Eliminar"
                onClick={() => eliminar(rowData.id)}
            />
        </div>
    );

    const estadoBodyTemplate = (rowData: Persona) => {
        const activo = rowData.active;

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

    const rucCompletoTemplate = (rowData: Persona) => {
        if (!rowData.ruc) return "-";
        return `${rowData.ruc}${rowData.dv ? "-" + rowData.dv : ""}`;
    };

    const esContribuyente = form.tipoContribuyente === TIPO_CONTRIBUYENTE.CONTRIBUYENTE;
    const esNoContribuyente = form.tipoContribuyente === TIPO_CONTRIBUYENTE.NO_CONTRIBUYENTE;
    const esOtroTipoDocumento = esTipoDocumentoOtro(form.tipoDocumentoId);

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="m-0">Personas</h2>
                    <small className="text-color-secondary">Gestión de personas</small>
                </div>

                <Button
                    label="Nueva Persona"
                    icon="pi pi-plus"
                    severity="success"
                    onClick={abrirNuevo}
                />
            </div>

            <span className="p-input-icon-left mb-3">
                <i className="pi pi-search" />
                <InputText
                    placeholder="Buscar por razón social, documento, ruc..."
                    value={search}
                    onChange={(e) => {
                        setPage(0);
                        setSearch(e.target.value);
                    }}
                />
            </span>

            <DataTable
                value={personas}
                paginator
                rows={size}
                totalRecords={total}
                lazy
                size="small"
                first={page * size}
                onPage={(e) => setPage(e.page ?? 0)}
                stripedRows
                showGridlines
                responsiveLayout="scroll"
                emptyMessage="No existen personas registradas"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
            >
                <Column field="razonSocial" header="Razón Social" sortable />

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

                <Column field="email" header="Email" style={{ minWidth: "220px" }} />

                <Column
                    header="Tipo Documento"
                    body={(rowData: Persona) => rowData.tipoDocumento?.descripcion || "-"}
                    style={{ width: "180px" }}
                />

                <Column
                    header="Ciudad"
                    body={(rowData: Persona) => rowData.ciudad?.descripcion || "-"}
                    style={{ width: "160px" }}
                />

                <Column
                    header="País"
                    body={(rowData: Persona) => rowData.pais?.descripcion || "-"}
                    style={{ width: "160px" }}
                />

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

            <Dialog
                header={viewMode ? "Ver persona" : editing ? "Editar persona" : "Nueva persona"}
                visible={open}
                modal
                draggable={false}
                resizable={false}
                style={{ width: "1000px" }}
                onHide={cerrarDialog}
            >
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
                            Naturaleza de la Persona <span className="text-red-500">*</span>
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
                                    maxLength={1}
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
                        <label>Razón Social <span className="text-red-500">*</span></label>
                        <InputText
                            placeholder="Juan Perez"
                            className="w-full"
                            disabled={viewMode}
                            value={form.razonSocial}
                            onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
                        />
                    </div>

                    <div className="col-12 md:col-8">
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
                        <label>Nro. Casa</label>
                        <InputNumber
                            placeholder="9999"
                            className="w-full"
                            disabled={viewMode}
                            value={form.nroCasa}
                            useGrouping={false}
                            onValueChange={(e) => setForm({ ...form, nroCasa: e.value ?? null })}
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
                        <label>Tipo de Operación</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.tipoOperacion}
                            options={tiposOperacion}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione un tipo de operación"
                            onChange={(e) => setForm({ ...form, tipoOperacion: e.value })}
                        />
                    </div>

                    <div className="col-12 md:col-4 flex align-items-end">
                        <div className="flex align-items-center gap-2 pt-3">
                            <Checkbox
                                inputId="diplomatico"
                                disabled={viewMode}
                                checked={form.diplomatico}
                                onChange={(e) => setForm({ ...form, diplomatico: !!e.checked })}
                            />
                            <label htmlFor="diplomatico" className="m-0 cursor-pointer">
                                Es Diplomático.?
                            </label>
                        </div>
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
                        <label>Email Copia</label>
                        <InputText
                            placeholder="tucorreo@mail.com;otrocorreo@mail.com"
                            className="w-full"
                            disabled={viewMode}
                            value={form.emailCopia}
                            onChange={(e) => setForm({ ...form, emailCopia: e.target.value })}
                        />
                    </div>

                    <div className="col-12 md:col-6">
                        <label>Email Adicional</label>
                        <InputText
                            placeholder="tucorreo@mail.com;otrocorreo@mail.com"
                            className="w-full"
                            disabled={viewMode}
                            value={form.emailAdicional}
                            onChange={(e) => setForm({ ...form, emailAdicional: e.target.value })}
                        />
                    </div>
                </div>

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
