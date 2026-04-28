import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { ProductosService } from "../../services/ProductosService";
import { UnidadMedidaService } from "../../services/UnidadMedidaService";
import { MarcaService } from "../../services/MarcasService";
import { SubFamiliaService } from "../../services/SubFamiliaService";
import { AfectacionIvaService } from "../../services/AfectacionIvaService";
import { InputTextarea } from "primereact/inputtextarea";

interface ProductoImagen {
    id?: string;
    urlImagen: string;
    esPrincipal?: boolean;
}

interface Producto {
    id?: string;
    codigo: string;
    descripcion: string;
    observaciones: string | null;
    precioVenta: number | null;
    precioCompra: number | null;
    codigoBarra: string;
    codigoBarraPaquete: string;
    tipo: string | null;
    proporcionIva: number | null;
    porcentajeIva: number | null;
    rucEmisor: string;
    ddncpg: string;
    ddncpe: string;
    dncm: string;
    afectacionIvaId: string | null;
    unidadMedidaId: string | null;
    marcaId: string | null;
    subFamiliaId: string | null;
    empresaId: string;
    imagenes: ProductoImagen[];
}

interface Opcion {
    id: string;
    descripcion: string;
}

export default function ProductosPage() {
    const empresaId = localStorage.getItem("empresaId") || "";

    const crearFormularioInicial = (): Producto => ({
        codigo: "",
        descripcion: "",
        observaciones: "",
        precioVenta: null,
        precioCompra: null,
        codigoBarra: "",
        codigoBarraPaquete: "",
        tipo: "PRODUCTO",
        proporcionIva: null,
        porcentajeIva: 10,
        rucEmisor: "",
        ddncpg: "",
        ddncpe: "",
        dncm: "",
        afectacionIvaId: null,
        unidadMedidaId: null,
        marcaId: null,
        subFamiliaId: null,
        empresaId,
        imagenes: []
    });

    const [productos, setProductos] = useState<Producto[]>([]);
    const [total, setTotal] = useState(0);

    const [page, setPage] = useState(0);
    const size = 10;

    const [search, setSearch] = useState("");

    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [editing, setEditing] = useState<Producto | null>(null);

    const [unidadMedidas, setUnidadMedidas] = useState<Opcion[]>([]);
    const [marcas, setMarcas] = useState<Opcion[]>([]);
    const [subFamilias, setSubFamilias] = useState<Opcion[]>([]);
    const [afectacionesIva, setAfectacionesIva] = useState<Opcion[]>([]);

    const [form, setForm] = useState<Producto>(crearFormularioInicial());
    const [imagenesFiles, setImagenesFiles] = useState<File[]>([]);

    const opcionesIva = [
        { label: "Exento 0%", value: 0 },
        { label: "IVA 5%", value: 5 },
        { label: "IVA 10%", value: 10 }
    ];

    const opcionesTipo = [
        { label: "Producto", value: "PRODUCTO" },
        { label: "Servicio", value: "SERVICIO" },
        { label: "Auto-Factura", value: "AUTOFACTURA" }
    ];

    const cargarProductos = async () => {
        try {
            const res = await ProductosService.getPaginated(page, size, search);
            setProductos(res?.content ?? []);
            setTotal(res?.totalElements ?? 0);
        } catch (error) {
            console.error("Error cargando productos", error);
            setProductos([]);
            setTotal(0);
        }
    };

    const cargarCatalogos = async () => {
        try {
            const [marcasRes, subFamiliasRes, unidadesRes, afectacionesRes] = await Promise.all([
                MarcaService.getAll(),
                SubFamiliaService.getAll(),
                UnidadMedidaService.getAll(),
                AfectacionIvaService.getAll()
            ]);

            setMarcas(
                (marcasRes ?? []).map((item: any) => ({
                    id: item.id,
                    descripcion: item.descripcion
                }))
            );

            setSubFamilias(
                (subFamiliasRes ?? []).map((item: any) => ({
                    id: item.id,
                    descripcion: item.descripcion
                }))
            );

            setUnidadMedidas(
                (unidadesRes ?? []).map((item: any) => ({
                    id: item.id,
                    descripcion: item.descripcion
                }))
            );

            setAfectacionesIva(
                (afectacionesRes ?? []).map((item: any) => ({
                    id: item.id,
                    descripcion: item.descripcion
                }))
            );

        } catch (error) {
            console.error("Error cargando catálogos", error);
            setMarcas([]);
            setSubFamilias([]);
            setAfectacionesIva([]);
            setUnidadMedidas([]);
        }
    };


    useEffect(() => {
        if (empresaId) {
            cargarProductos();
        }
    }, [page, search, empresaId]);

    useEffect(() => {
        cargarCatalogos();
    }, []);

    const cerrarDialog = () => {
        setOpen(false);
        setViewMode(false);
        setEditing(null);
        setImagenesFiles([]);
        setForm(crearFormularioInicial());
    };

    const abrirNuevo = () => {
        setEditing(null);
        setViewMode(false);
        setImagenesFiles([]);
        setForm(crearFormularioInicial());
        setOpen(true);
    };

    const ver = async (producto: Producto) => {
        try {
            const data = await ProductosService.getById(producto.id!);
            setViewMode(true);
            setEditing(data);
            setForm(data);
            setImagenesFiles([]);
            setOpen(true);
        } catch (error) {
            Swal.fire("Error", "No se pudo cargar el producto", "error");
        }
    };

    const editar = async (producto: Producto) => {
        try {
            const data = await ProductosService.getById(producto.id!);
            setViewMode(false);
            setEditing(data);
            setForm(data);
            setImagenesFiles([]);
            setOpen(true);
        } catch (error) {
            Swal.fire("Error", "No se pudo cargar el producto", "error");
        }
    };

    const guardar = async () => {
        try {
            if (!form.codigo.trim()) {
                Swal.fire("Atención", "El código es obligatorio", "warning");
                return;
            }

            if (!form.descripcion.trim()) {
                Swal.fire("Atención", "La descripción es obligatoria", "warning");
                return;
            }

            if (!form.unidadMedidaId) {
                Swal.fire("Atención", "La unidad de medida es obligatoria", "warning");
                return;
            }

            if (editing?.id) {
                await ProductosService.update(editing.id, form, imagenesFiles);

                Swal.fire(
                    "Actualizado",
                    "Producto actualizado correctamente",
                    "success"
                );
            } else {
                await ProductosService.create(form, imagenesFiles);

                Swal.fire(
                    "Creado",
                    "Producto creado correctamente",
                    "success"
                );
            }

            cerrarDialog();
            cargarProductos();
        } catch (error) {
            console.error("Error guardando producto", error);
            Swal.fire("Error", "No se pudo guardar el producto", "error");
        }
    };

    const eliminar = async (id?: string) => {
        if (!id) return;

        const result = await Swal.fire({
            title: "¿Eliminar producto?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        try {
            await ProductosService.remove(id);

            Swal.fire(
                "Eliminado",
                "Producto eliminado correctamente",
                "success"
            );

            cargarProductos();
        } catch (error) {
            console.error("Error eliminando producto", error);
            Swal.fire("Error", "No se pudo eliminar", "error");
        }
    };

    const accionesTemplate = (rowData: Producto) => {
        return (
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
    };

    const imagenTemplate = (rowData: Producto) => {
        const principal =
            rowData.imagenes?.find((img) => img.esPrincipal) || rowData.imagenes?.[0];

        if (!principal?.urlImagen) {
            return <span>Sin imagen</span>;
        }

        return (
            <img
                src={principal.urlImagen}
                alt="producto"
                style={{
                    width: "50px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "8px"
                }}
            />
        );
    };

    const estadoBodyTemplate = (rowData: any) => {
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
                    color: activo ? "#127e2b" : "#721c24",
                }}
            >
                {activo ? "Activo" : "Anulado"}
            </span>
        );
    };

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="m-0">Productos</h2>
                    <small className="text-color-secondary">
                        Catálogo de productos
                    </small>
                </div>

                <Button
                    label="Nuevo Producto"
                    icon="pi pi-plus"
                    severity="success"
                    onClick={abrirNuevo}
                />
            </div>

            <span className="p-input-icon-left mb-3">
                <i className="pi pi-search" />

                <InputText
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(e) => {
                        setPage(0);
                        setSearch(e.target.value);
                    }}
                />
            </span>

            <DataTable
                value={productos}
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
                emptyMessage="No existen productos registrados"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos"
            >
                <Column
                    header="Imagen"
                    body={imagenTemplate}
                    style={{ width: "90px", textAlign: "center" }}
                />

                <Column
                    field="codigo"
                    header="Código"
                    sortable
                    style={{ width: "120px", textAlign: "center" }}
                />

                <Column field="descripcion" header="Descripción" sortable />

                <Column field="precioVenta" header="Precio Venta" sortable />

                <Column
                    field="porcentajeIva"
                    header="IVA"
                    style={{ width: "100px", textAlign: "center" }}
                />

                <Column
                    field="marca"
                    header="Marca"
                    style={{ width: "100px", textAlign: "center" }}
                />
                <Column
                    field="familia"
                    header="Familia"
                    style={{ width: "100px", textAlign: "center" }}
                />
                <Column
                    field="subFamilia"
                    header="Sub-Familia"
                    style={{ width: "100px", textAlign: "center" }}
                />


                <Column
                    field="active"
                    header="Estado"
                    style={{ width: "120px", textAlign: "center" }}
                    body={estadoBodyTemplate}
                />

                <Column
                    header="Acciones"
                    body={accionesTemplate}
                    style={{ width: "140px" }}
                />
            </DataTable>

            <Dialog
                header={
                    viewMode
                        ? "Ver producto"
                        : editing
                            ? "Editar producto"
                            : "Nuevo producto"
                }
                visible={open}
                modal
                draggable={false}
                resizable={false}
                style={{ width: "900px" }}
                onHide={cerrarDialog}
            >
                <div className="grid">
                    <div className="col-12 md:col-4">
                        <label>Código</label>
                        <InputText
                            className="w-full"
                            disabled={viewMode}
                            value={form.codigo}
                            onChange={(e) =>
                                setForm({ ...form, codigo: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Código Barra</label>
                        <InputText
                            className="w-full"
                            disabled={viewMode}
                            value={form.codigoBarra}
                            onChange={(e) =>
                                setForm({ ...form, codigoBarra: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Código Barra Paquete</label>
                        <InputText
                            className="w-full"
                            disabled={viewMode}
                            value={form.codigoBarraPaquete}
                            onChange={(e) =>
                                setForm({ ...form, codigoBarraPaquete: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-12">
                        <label>Descripción</label>
                        <InputText
                            className="w-full"
                            disabled={viewMode}
                            value={form.descripcion}
                            onChange={(e) =>
                                setForm({ ...form, descripcion: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-12">
                        <label>Observaciones</label>
                        <InputTextarea
                            className="w-full"
                            disabled={viewMode}
                            value={form.observaciones ?? undefined}
                            onChange={(e) =>
                                setForm({ ...form, observaciones: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Precio Venta</label>
                        <InputNumber
                            className="w-full"
                            disabled={viewMode}
                            value={form.precioVenta}
                            onValueChange={(e) =>
                                setForm({ ...form, precioVenta: e.value ?? null })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Precio Compra</label>
                        <InputNumber
                            className="w-full"
                            disabled={viewMode}
                            value={form.precioCompra}
                            onValueChange={(e) =>
                                setForm({ ...form, precioCompra: e.value ?? null })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Tipo</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.tipo}
                            options={opcionesTipo}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Seleccione"
                            onChange={(e) =>
                                setForm({ ...form, tipo: e.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Porcentaje IVA</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.porcentajeIva}
                            options={opcionesIva}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Seleccione"
                            onChange={(e) =>
                                setForm({ ...form, porcentajeIva: e.value })
                            }
                        />
                    </div>


                    <div className="col-12 md:col-4">
                        <label>Proporción IVA</label>
                        <InputNumber
                            className="w-full"
                            disabled={viewMode}
                            value={form.proporcionIva}
                            onValueChange={(e) =>
                                setForm({ ...form, proporcionIva: e.value ?? null })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Afectación IVA</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.afectacionIvaId}
                            options={afectacionesIva}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione"
                            filter
                            showClear
                            onChange={(e) =>
                                setForm({ ...form, afectacionIvaId: e.value })
                            }
                        />
                    </div>


                    <div className="col-12 md:col-4">
                        <label>DDNCPG</label>
                        <InputText
                            className="w-full"
                            disabled={viewMode}
                            value={form.ddncpg}
                            onChange={(e) =>
                                setForm({ ...form, ddncpg: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>DDNCPE</label>
                        <InputText
                            className="w-full"
                            disabled={viewMode}
                            value={form.ddncpe}
                            onChange={(e) =>
                                setForm({ ...form, ddncpe: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>DNCM</label>
                        <InputText
                            className="w-full"
                            disabled={viewMode}
                            value={form.dncm}
                            onChange={(e) =>
                                setForm({ ...form, dncm: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Unidad de Medida</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.unidadMedidaId}
                            options={unidadMedidas}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione"
                            filter
                            onChange={(e) =>
                                setForm({ ...form, unidadMedidaId: e.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Marca</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.marcaId}
                            options={marcas}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione"
                            filter
                            showClear
                            onChange={(e) =>
                                setForm({ ...form, marcaId: e.value })
                            }
                        />
                    </div>

                    <div className="col-12 md:col-4">
                        <label>Sub Familia</label>
                        <Dropdown
                            className="w-full"
                            disabled={viewMode}
                            value={form.subFamiliaId}
                            options={subFamilias}
                            optionLabel="descripcion"
                            optionValue="id"
                            placeholder="Seleccione"
                            filter
                            showClear
                            onChange={(e) =>
                                setForm({ ...form, subFamiliaId: e.value })
                            }
                        />
                    </div>

                    <div className="col-12">
                        <label>Imágenes</label>

                        {!viewMode && (
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) =>
                                    setImagenesFiles(Array.from(e.target.files ?? []))
                                }
                            />
                        )}
                    </div>

                    {form.imagenes?.length > 0 && (
                        <div className="col-12">
                            <div className="flex gap-2 flex-wrap">
                                {form.imagenes.map((img, index) => (
                                    <img
                                        key={img.id || index}
                                        src={img.urlImagen}
                                        alt="producto"
                                        style={{
                                            width: "90px",
                                            height: "90px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                            border: img.esPrincipal
                                                ? "2px solid green"
                                                : "1px solid #ccc"
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {!viewMode && (
                    <div className="flex justify-content-end gap-2 mt-4">
                        <Button
                            label="Cancelar"
                            severity="secondary"
                            onClick={cerrarDialog}
                        />

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