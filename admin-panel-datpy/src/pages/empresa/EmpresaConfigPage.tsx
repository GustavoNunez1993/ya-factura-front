import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { EmpresaService } from "../../services/EmpresaService";
import {
  EmpresaActividadEconomicaService,
  type ActividadEconomica
} from "../../services/EmpresaActividadEconomicaService";
import { PaisService } from "../../services/PaisService";
import { DepartamentoService } from "../../services/DepartamentoService";
import { DistritoService } from "../../services/DistritoService";
import { CiudadesService } from "../../services/CiudadesService";

interface Opcion {
  id: string;
  descripcion: string;
}

const TIPOS_CONTRIBUYENTE = [
  { label: "1 - Persona Física", value: 1 },
  { label: "2 - Persona Jurídica", value: 2 }
];

const AMBIENTES_SIFEN = [
  { label: "Test (homologación)", value: "TEST" },
  { label: "Producción", value: "PRODUCCION" }
];

export default function EmpresaConfigPage() {
  const empresaId = localStorage.getItem("empresaId") || "";

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [tipoContribuyente, setTipoContribuyente] = useState<number | null>(null);
  const [direccion, setDireccion] = useState("");
  const [numeroCasa, setNumeroCasa] = useState<number | null>(null);
  const [telefono, setTelefono] = useState("");
  const [emailEmisor, setEmailEmisor] = useState("");

  const [paisId, setPaisId] = useState<string | null>(null);
  const [departamentoId, setDepartamentoId] = useState<string | null>(null);
  const [distritoId, setDistritoId] = useState<string | null>(null);
  const [ciudadId, setCiudadId] = useState<string | null>(null);

  const [paises, setPaises] = useState<Opcion[]>([]);
  const [departamentos, setDepartamentos] = useState<Opcion[]>([]);
  const [distritos, setDistritos] = useState<Opcion[]>([]);
  const [ciudades, setCiudades] = useState<Opcion[]>([]);

  const [firmadorTenantId, setFirmadorTenantId] = useState("");
  const [ambienteSifen, setAmbienteSifen] = useState<string | null>("TEST");
  const [firmadorCertificadoId, setFirmadorCertificadoId] = useState("");

  const [actividades, setActividades] = useState<ActividadEconomica[]>([]);
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [guardandoActividad, setGuardandoActividad] = useState(false);

  const cargarActividades = async () => {
    if (!empresaId) return;
    try {
      const data = await EmpresaActividadEconomicaService.listar(empresaId);
      setActividades(data ?? []);
    } catch (error) {
      console.error("Error cargando actividades económicas", error);
      setActividades([]);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const [data] = await Promise.all([EmpresaService.obtenerActual(), cargarActividades()]);

        setTipoContribuyente(data.tipoContribuyente ?? null);
        setDireccion(data.direccion ?? "");
        setNumeroCasa(data.numeroCasa ?? null);
        setTelefono(data.telefono ?? "");
        setEmailEmisor(data.emailEmisor ?? "");

        setFirmadorTenantId(data.firmadorTenantId ?? "");
        setAmbienteSifen(data.ambienteSifen ?? "TEST");
        setFirmadorCertificadoId(data.firmadorCertificadoId ?? "");

        const ciudad = data.ciudad ?? null;
        const distrito = ciudad?.distrito ?? null;
        const departamento = distrito?.departamento ?? null;
        const pais = departamento?.pais ?? null;

        if (pais?.id) setPaisId(pais.id);
        if (departamento?.id) setDepartamentoId(departamento.id);
        if (distrito?.id) setDistritoId(distrito.id);
        if (ciudad?.id) setCiudadId(ciudad.id);

        if (pais?.id) await cargarDepartamentosPorPais(pais.id);
        if (departamento?.id) await cargarDistritosPorDepartamento(departamento.id);
        if (distrito?.id) await cargarCiudadesPorDistrito(distrito.id);
      } catch (error) {
        console.error("Error cargando la empresa", error);
        Swal.fire("Error", "No se pudo cargar la información de la empresa", "error");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  useEffect(() => {
    PaisService.getAll()
      .then((data: any) =>
        setPaises((data ?? []).map((item: any) => ({ id: item.id, descripcion: item.descripcion })))
      )
      .catch(() => setPaises([]));
  }, []);

  const cargarDepartamentosPorPais = async (id: string) => {
    try {
      const data = await DepartamentoService.getByPaisId(id);
      setDepartamentos((data ?? []).map((item: any) => ({ id: item.id, descripcion: item.descripcion })));
    } catch (error) {
      console.error("Error cargando departamentos", error);
      setDepartamentos([]);
    }
  };

  const cargarDistritosPorDepartamento = async (id: string) => {
    try {
      const data = await DistritoService.getByDepartamentoId(id);
      setDistritos((data ?? []).map((item: any) => ({ id: item.id, descripcion: item.descripcion })));
    } catch (error) {
      console.error("Error cargando distritos", error);
      setDistritos([]);
    }
  };

  const cargarCiudadesPorDistrito = async (id: string) => {
    try {
      const data = await CiudadesService.getByDistritoId(id);
      setCiudades((data ?? []).map((item: any) => ({ id: item.id, descripcion: item.descripcion })));
    } catch (error) {
      console.error("Error cargando ciudades", error);
      setCiudades([]);
    }
  };

  const guardar = async () => {
    if (!empresaId) return;

    try {
      setGuardando(true);
      const actual = await EmpresaService.obtenerActual();

      await EmpresaService.actualizar(empresaId, {
        ...actual,
        tipoContribuyente,
        direccion,
        numeroCasa,
        telefono,
        emailEmisor,
        ciudad: ciudadId ? { id: ciudadId } : null,
        firmadorTenantId: firmadorTenantId.trim() || null,
        ambienteSifen,
        firmadorCertificadoId: firmadorCertificadoId.trim() || null
      });

      Swal.fire("Listo", "Datos de la empresa actualizados correctamente", "success");
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo guardar la información de la empresa";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardando(false);
    }
  };

  const agregarActividad = async () => {
    if (!nuevoCodigo.trim() || !nuevaDescripcion.trim()) {
      Swal.fire("Atención", "Complete el código y la descripción de la actividad", "warning");
      return;
    }

    try {
      setGuardandoActividad(true);
      await EmpresaActividadEconomicaService.crear({
        empresaId,
        codigo: nuevoCodigo.trim(),
        descripcion: nuevaDescripcion.trim()
      });

      setNuevoCodigo("");
      setNuevaDescripcion("");
      await cargarActividades();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo agregar la actividad económica", "error");
    } finally {
      setGuardandoActividad(false);
    }
  };

  const eliminarActividad = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar actividad económica?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      await EmpresaActividadEconomicaService.eliminar(id);
      await cargarActividades();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo eliminar la actividad económica", "error");
    }
  };

  const accionesActividadTemplate = (rowData: ActividadEconomica) => (
    <Button icon="pi pi-trash" text rounded severity="danger" tooltip="Eliminar" onClick={() => eliminarActividad(rowData.id)} />
  );

  if (loading) {
    return <div className="text-color-secondary">Cargando datos de la empresa...</div>;
  }

  return (
    <div>
      <style>
        {`
          .empresa-card {
            border: 1px solid var(--surface-border);
            border-radius: 10px;
            background: var(--surface-card);
          }
        `}
      </style>

      <div className="mb-4">
        <h2 className="m-0">Datos de la empresa</h2>
        <small className="text-color-secondary">Información fiscal del emisor requerida por SIFEN</small>
      </div>

      <div className="flex flex-column gap-3">
        <div className="empresa-card p-4">
          <div className="text-lg font-semibold mb-3">Datos fiscales del emisor</div>

          <div className="grid">
            <div className="col-12 md:col-4">
              <label>Tipo de contribuyente</label>
              <Dropdown
                className="w-full"
                value={tipoContribuyente}
                options={TIPOS_CONTRIBUYENTE}
                placeholder="Seleccione"
                onChange={(e) => setTipoContribuyente(e.value)}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Dirección</label>
              <InputText
                className="w-full"
                placeholder="Calle 1 c/ calle 2"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Número de casa</label>
              <InputNumber
                className="w-full"
                inputClassName="w-full"
                value={numeroCasa}
                onValueChange={(e) => setNumeroCasa(e.value ?? null)}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>País</label>
              <Dropdown
                className="w-full"
                value={paisId}
                options={paises}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione un País"
                filter
                showClear
                onChange={(e) => {
                  setPaisId(e.value);
                  setDepartamentoId(null);
                  setDistritoId(null);
                  setCiudadId(null);
                  setDepartamentos([]);
                  setDistritos([]);
                  setCiudades([]);
                  if (e.value) cargarDepartamentosPorPais(e.value);
                }}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Departamento</label>
              <Dropdown
                className="w-full"
                disabled={!paisId}
                value={departamentoId}
                options={departamentos}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione un Departamento"
                filter
                showClear
                onChange={(e) => {
                  setDepartamentoId(e.value);
                  setDistritoId(null);
                  setCiudadId(null);
                  setDistritos([]);
                  setCiudades([]);
                  if (e.value) cargarDistritosPorDepartamento(e.value);
                }}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Distrito</label>
              <Dropdown
                className="w-full"
                disabled={!departamentoId}
                value={distritoId}
                options={distritos}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione un Distrito"
                filter
                showClear
                onChange={(e) => {
                  setDistritoId(e.value);
                  setCiudadId(null);
                  setCiudades([]);
                  if (e.value) cargarCiudadesPorDistrito(e.value);
                }}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Ciudad</label>
              <Dropdown
                className="w-full"
                disabled={!distritoId}
                value={ciudadId}
                options={ciudades}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione una Ciudad"
                filter
                showClear
                onChange={(e) => setCiudadId(e.value)}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Teléfono</label>
              <InputText
                className="w-full"
                placeholder="0999-9999999"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Email del emisor</label>
              <InputText
                className="w-full"
                placeholder="facturacion@empresa.com"
                value={emailEmisor}
                onChange={(e) => setEmailEmisor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="empresa-card p-4">
          <div className="text-lg font-semibold mb-3">Actividades económicas</div>
          <small className="text-color-secondary" style={{ display: "block", marginBottom: "12px" }}>
            Requeridas por SIFEN para poder generar el XML de una factura (al menos una)
          </small>

          <DataTable value={actividades} size="small" emptyMessage="No hay actividades económicas cargadas" stripedRows>
            <Column field="codigo" header="Código" style={{ width: "120px" }} />
            <Column field="descripcion" header="Descripción" />
            <Column header="Acciones" body={accionesActividadTemplate} style={{ width: "100px" }} />
          </DataTable>

          <div className="grid mt-2">
            <div className="col-12 md:col-3">
              <label>Código</label>
              <InputText className="w-full" value={nuevoCodigo} onChange={(e) => setNuevoCodigo(e.target.value)} />
            </div>
            <div className="col-12 md:col-6">
              <label>Descripción</label>
              <InputText className="w-full" value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} />
            </div>
            <div className="col-12 md:col-3 flex align-items-end">
              <Button
                label="Agregar"
                icon="pi pi-plus"
                severity="success"
                loading={guardandoActividad}
                onClick={agregarActividad}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="empresa-card p-4">
          <div className="text-lg font-semibold mb-3">Envío a SIFEN</div>
          <small className="text-color-secondary" style={{ display: "block", marginBottom: "12px" }}>
            El tenant y el certificado se dan de alta directamente en firmador-xml, acá sólo se guarda su identificador
          </small>

          <div className="grid">
            <div className="col-12 md:col-4">
              <label>Tenant de firmador-xml</label>
              <InputText
                className="w-full"
                placeholder="UUID del tenant"
                value={firmadorTenantId}
                onChange={(e) => setFirmadorTenantId(e.target.value)}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Ambiente SIFEN</label>
              <Dropdown
                className="w-full"
                value={ambienteSifen}
                options={AMBIENTES_SIFEN}
                onChange={(e) => setAmbienteSifen(e.value)}
              />
            </div>

            <div className="col-12 md:col-4">
              <label>Certificado (opcional)</label>
              <InputText
                className="w-full"
                placeholder="UUID del certificado"
                value={firmadorCertificadoId}
                onChange={(e) => setFirmadorCertificadoId(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <Button label="Guardar cambios" icon="pi pi-save" severity="success" loading={guardando} onClick={guardar} />
        </div>
      </div>
    </div>
  );
}
