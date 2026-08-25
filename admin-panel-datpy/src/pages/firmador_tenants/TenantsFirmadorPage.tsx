import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Password } from "primereact/password";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { TabView, TabPanel } from "primereact/tabview";

import {
  FirmadorTenantService,
  type FirmadorTenant,
  type FirmadorAmbiente,
  type FirmadorCertificado
} from "../../services/FirmadorTenantService";

interface TenantForm {
  codigo: string;
  razonSocial: string;
  nombreFantasia: string;
  ruc: string;
  dv: string;
  email: string;
  telefono: string;
}

const tenantFormVacio: TenantForm = {
  codigo: "",
  razonSocial: "",
  nombreFantasia: "",
  ruc: "",
  dv: "",
  email: "",
  telefono: ""
};

interface AmbienteForm {
  ambiente: "TEST" | "PRODUCCION";
  habilitado: boolean;
  urlRecepcion: string;
  urlConsultaLote: string;
  urlConsultaDe: string;
  urlEventos: string;
}

const ambienteFormVacio: AmbienteForm = {
  ambiente: "TEST",
  habilitado: true,
  urlRecepcion: "",
  urlConsultaLote: "",
  urlConsultaDe: "",
  urlEventos: ""
};

interface CertificadoForm {
  alias: string;
  ruc: string;
  passwordSecretReference: string;
  password: string;
  predeterminado: boolean;
}

const certificadoFormVacio: CertificadoForm = {
  alias: "",
  ruc: "",
  passwordSecretReference: "",
  password: "",
  predeterminado: false
};

const AMBIENTES_OPCIONES = [
  { label: "Test (homologación)", value: "TEST" },
  { label: "Producción", value: "PRODUCCION" }
];

const copiarAlPortapapeles = async (valor: string) => {
  try {
    await navigator.clipboard.writeText(valor);
    Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Copiado", showConfirmButton: false, timer: 1200 });
  } catch {
    Swal.fire("Error", "No se pudo copiar al portapapeles", "error");
  }
};

const idCopiable = (id: string) => (
  <div className="flex align-items-center gap-2">
    <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id.slice(0, 8)}…</span>
    <Button icon="pi pi-copy" text rounded size="small" tooltip="Copiar ID completo" onClick={() => copiarAlPortapapeles(id)} />
  </div>
);

export default function TenantsFirmadorPage() {
  const [tenants, setTenants] = useState<FirmadorTenant[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<TenantForm>(tenantFormVacio);

  const [selectedTenant, setSelectedTenant] = useState<FirmadorTenant | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const [ambientes, setAmbientes] = useState<FirmadorAmbiente[]>([]);
  const [ambienteForm, setAmbienteForm] = useState<AmbienteForm>(ambienteFormVacio);
  const [guardandoAmbiente, setGuardandoAmbiente] = useState(false);

  const [certificados, setCertificados] = useState<FirmadorCertificado[]>([]);
  const [certificadoForm, setCertificadoForm] = useState<CertificadoForm>(certificadoFormVacio);
  const [archivoCertificado, setArchivoCertificado] = useState<File | null>(null);
  const [subiendoCertificado, setSubiendoCertificado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarTenants = async () => {
    try {
      setLoading(true);
      const res = await FirmadorTenantService.listar();
      setTenants(res?.content ?? []);
    } catch (error) {
      console.error("Error cargando tenants", error);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTenants();
  }, []);

  const abrirNuevo = () => {
    setForm(tenantFormVacio);
    setOpen(true);
  };

  const guardarTenant = async () => {
    if (!form.codigo.trim() || !form.razonSocial.trim() || !form.ruc.trim()) {
      Swal.fire("Atención", "Complete código, razón social y RUC", "warning");
      return;
    }

    try {
      setGuardando(true);
      const creado = await FirmadorTenantService.crear({
        codigo: form.codigo.trim(),
        razonSocial: form.razonSocial.trim(),
        nombreFantasia: form.nombreFantasia.trim() || undefined,
        ruc: form.ruc.trim(),
        dv: form.dv.trim() || undefined,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined
      });

      Swal.fire({
        icon: "success",
        title: "Tenant creado",
        html: `<div style="text-align:left">Copie este ID, lo va a necesitar en <b>Datos de la empresa → Envío a SIFEN</b>:<br/><code style="word-break:break-all">${creado.id}</code></div>`
      });

      setOpen(false);
      cargarTenants();
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo crear el tenant";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardando(false);
    }
  };

  const cargarAmbientes = async (tenantId: string) => {
    try {
      const data = await FirmadorTenantService.listarAmbientes(tenantId);
      setAmbientes(data ?? []);
    } catch (error) {
      console.error("Error cargando ambientes", error);
      setAmbientes([]);
    }
  };

  const cargarCertificados = async (tenantId: string) => {
    try {
      const res = await FirmadorTenantService.listarCertificados(tenantId);
      setCertificados(res?.content ?? []);
    } catch (error) {
      console.error("Error cargando certificados", error);
      setCertificados([]);
    }
  };

  const gestionar = async (tenant: FirmadorTenant) => {
    setSelectedTenant(tenant);
    setAmbienteForm(ambienteFormVacio);
    setCertificadoForm(certificadoFormVacio);
    setArchivoCertificado(null);
    setManageOpen(true);
    await Promise.all([cargarAmbientes(tenant.id), cargarCertificados(tenant.id)]);
  };

  const guardarAmbiente = async () => {
    if (!selectedTenant) return;

    try {
      setGuardandoAmbiente(true);
      await FirmadorTenantService.crearAmbiente(selectedTenant.id, {
        ambiente: ambienteForm.ambiente,
        habilitado: ambienteForm.habilitado,
        urlRecepcion: ambienteForm.urlRecepcion.trim() || undefined,
        urlConsultaLote: ambienteForm.urlConsultaLote.trim() || undefined,
        urlConsultaDe: ambienteForm.urlConsultaDe.trim() || undefined,
        urlEventos: ambienteForm.urlEventos.trim() || undefined
      });

      Swal.fire("Listo", "Ambiente creado correctamente", "success");
      setAmbienteForm(ambienteFormVacio);
      await cargarAmbientes(selectedTenant.id);
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo crear el ambiente";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardandoAmbiente(false);
    }
  };

  const seleccionarArchivo = () => fileInputRef.current?.click();

  const onArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (archivo) setArchivoCertificado(archivo);
  };

  const subirCertificado = async () => {
    if (!selectedTenant) return;

    if (!certificadoForm.alias.trim() || !certificadoForm.ruc.trim() || !certificadoForm.password) {
      Swal.fire("Atención", "Complete alias, RUC y la contraseña del certificado", "warning");
      return;
    }

    if (!archivoCertificado) {
      Swal.fire("Atención", "Seleccione el archivo .p12/.pfx del certificado", "warning");
      return;
    }

    try {
      setSubiendoCertificado(true);
      await FirmadorTenantService.subirCertificado(
        selectedTenant.id,
        {
          alias: certificadoForm.alias.trim(),
          ruc: certificadoForm.ruc.trim(),
          passwordSecretReference: certificadoForm.passwordSecretReference.trim() || certificadoForm.alias.trim(),
          predeterminado: certificadoForm.predeterminado
        },
        certificadoForm.password,
        archivoCertificado
      );

      Swal.fire("Listo", "Certificado subido correctamente", "success");
      setCertificadoForm(certificadoFormVacio);
      setArchivoCertificado(null);
      await cargarCertificados(selectedTenant.id);
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo subir el certificado";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setSubiendoCertificado(false);
    }
  };

  const marcarPredeterminado = async (certificado: FirmadorCertificado) => {
    if (!selectedTenant) return;

    try {
      await FirmadorTenantService.marcarCertificadoPredeterminado(selectedTenant.id, certificado.id);
      Swal.fire("Listo", "Certificado marcado como predeterminado", "success");
      await cargarCertificados(selectedTenant.id);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo marcar el certificado como predeterminado", "error");
    }
  };

  const estadoTenantTemplate = (rowData: FirmadorTenant) => (
    <Tag value={rowData.estado} severity={rowData.estado === "ACTIVO" ? "success" : "danger"} />
  );

  const idTenantTemplate = (rowData: FirmadorTenant) => idCopiable(rowData.id);

  const accionesTenantTemplate = (rowData: FirmadorTenant) => (
    <Button icon="pi pi-cog" text rounded severity="info" tooltip="Gestionar ambientes y certificados" onClick={() => gestionar(rowData)} />
  );

  const estadoAmbienteTemplate = (rowData: FirmadorAmbiente) => (
    <Tag value={rowData.habilitado ? "Habilitado" : "Deshabilitado"} severity={rowData.habilitado ? "success" : "secondary"} />
  );

  const idCertificadoTemplate = (rowData: FirmadorCertificado) => idCopiable(rowData.id);

  const predeterminadoCertificadoTemplate = (rowData: FirmadorCertificado) =>
    rowData.predeterminado ? (
      <Tag value="Predeterminado" severity="info" icon="pi pi-star-fill" />
    ) : (
      <Button label="Marcar predeterminado" text size="small" onClick={() => marcarPredeterminado(rowData)} />
    );

  const validezCertificadoTemplate = (rowData: FirmadorCertificado) => {
    if (!rowData.validTo) return "-";
    return new Date(rowData.validTo).toLocaleDateString("es-PY");
  };

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Tenants de firmador-xml</h2>
          <small className="text-color-secondary">
            Alta de tenants, ambientes SIFEN y certificados en firmador-xml — los IDs resultantes se usan en Datos de la empresa
          </small>
        </div>
        <Button label="Nuevo Tenant" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      <DataTable value={tenants} loading={loading} size="small" stripedRows showGridlines emptyMessage="No hay tenants registrados">
        <Column field="codigo" header="Código" />
        <Column field="razonSocial" header="Razón Social" />
        <Column field="ruc" header="RUC" />
        <Column header="Estado" body={estadoTenantTemplate} style={{ width: "110px" }} />
        <Column header="ID" body={idTenantTemplate} style={{ width: "140px" }} />
        <Column header="Acciones" body={accionesTenantTemplate} style={{ width: "90px" }} />
      </DataTable>

      <Dialog
        header="Nuevo Tenant"
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "560px", maxWidth: "95vw" }}
        onHide={() => setOpen(false)}
      >
        <div className="grid">
          <div className="col-6">
            <label>Código *</label>
            <InputText className="w-full" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          </div>
          <div className="col-6">
            <label>RUC *</label>
            <InputText className="w-full" value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })} />
          </div>
          <div className="col-8">
            <label>Razón Social *</label>
            <InputText className="w-full" value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} />
          </div>
          <div className="col-4">
            <label>DV</label>
            <InputText className="w-full" value={form.dv} onChange={(e) => setForm({ ...form, dv: e.target.value })} />
          </div>
          <div className="col-12">
            <label>Nombre Fantasía</label>
            <InputText className="w-full" value={form.nombreFantasia} onChange={(e) => setForm({ ...form, nombreFantasia: e.target.value })} />
          </div>
          <div className="col-6">
            <label>Email</label>
            <InputText className="w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="col-6">
            <label>Teléfono</label>
            <InputText className="w-full" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" severity="secondary" onClick={() => setOpen(false)} />
          <Button label="Guardar" icon="pi pi-check" severity="success" loading={guardando} onClick={guardarTenant} />
        </div>
      </Dialog>

      <Dialog
        header={selectedTenant ? `Gestionar tenant: ${selectedTenant.razonSocial}` : "Gestionar tenant"}
        visible={manageOpen}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "720px", maxWidth: "95vw" }}
        onHide={() => setManageOpen(false)}
      >
        {selectedTenant && (
          <div className="flex align-items-center gap-2 mb-3">
            <span className="text-color-secondary">ID del tenant:</span>
            {idCopiable(selectedTenant.id)}
          </div>
        )}

        <TabView>
          <TabPanel header="Ambientes SIFEN">
            <DataTable value={ambientes} size="small" emptyMessage="No hay ambientes registrados" className="mb-3">
              <Column field="ambiente" header="Ambiente" />
              <Column header="Estado" body={estadoAmbienteTemplate} />
              <Column field="urlRecepcion" header="URL Recepción" body={(row: FirmadorAmbiente) => row.urlRecepcion ?? "-"} />
            </DataTable>

            <div className="grid">
              <div className="col-6">
                <label>Ambiente</label>
                <Dropdown
                  className="w-full"
                  value={ambienteForm.ambiente}
                  options={AMBIENTES_OPCIONES}
                  onChange={(e) => setAmbienteForm({ ...ambienteForm, ambiente: e.value })}
                />
              </div>
              <div className="col-6 flex align-items-center gap-2" style={{ marginTop: "22px" }}>
                <Checkbox
                  inputId="ambienteHabilitado"
                  checked={ambienteForm.habilitado}
                  onChange={(e) => setAmbienteForm({ ...ambienteForm, habilitado: e.checked ?? false })}
                />
                <label htmlFor="ambienteHabilitado" className="m-0">Habilitado</label>
              </div>
              <div className="col-6">
                <label>URL Recepción</label>
                <InputText className="w-full" value={ambienteForm.urlRecepcion} onChange={(e) => setAmbienteForm({ ...ambienteForm, urlRecepcion: e.target.value })} />
              </div>
              <div className="col-6">
                <label>URL Consulta Lote</label>
                <InputText className="w-full" value={ambienteForm.urlConsultaLote} onChange={(e) => setAmbienteForm({ ...ambienteForm, urlConsultaLote: e.target.value })} />
              </div>
              <div className="col-6">
                <label>URL Consulta DE</label>
                <InputText className="w-full" value={ambienteForm.urlConsultaDe} onChange={(e) => setAmbienteForm({ ...ambienteForm, urlConsultaDe: e.target.value })} />
              </div>
              <div className="col-6">
                <label>URL Eventos</label>
                <InputText className="w-full" value={ambienteForm.urlEventos} onChange={(e) => setAmbienteForm({ ...ambienteForm, urlEventos: e.target.value })} />
              </div>
            </div>

            <Button
              label="Agregar Ambiente"
              icon="pi pi-plus"
              severity="success"
              loading={guardandoAmbiente}
              onClick={guardarAmbiente}
              className="mt-2"
            />
          </TabPanel>

          <TabPanel header="Certificados">
            <DataTable value={certificados} size="small" emptyMessage="No hay certificados registrados" className="mb-3">
              <Column field="alias" header="Alias" />
              <Column header="Vence" body={validezCertificadoTemplate} style={{ width: "110px" }} />
              <Column header="ID" body={idCertificadoTemplate} style={{ width: "140px" }} />
              <Column header="Predeterminado" body={predeterminadoCertificadoTemplate} style={{ width: "170px" }} />
            </DataTable>

            <div className="grid">
              <div className="col-6">
                <label>Alias *</label>
                <InputText className="w-full" value={certificadoForm.alias} onChange={(e) => setCertificadoForm({ ...certificadoForm, alias: e.target.value })} />
              </div>
              <div className="col-6">
                <label>RUC del certificado *</label>
                <InputText className="w-full" value={certificadoForm.ruc} onChange={(e) => setCertificadoForm({ ...certificadoForm, ruc: e.target.value })} />
              </div>
              <div className="col-6">
                <label>Contraseña del .p12 *</label>
                <Password
                  className="w-full"
                  inputClassName="w-full"
                  value={certificadoForm.password}
                  onChange={(e) => setCertificadoForm({ ...certificadoForm, password: e.target.value })}
                  feedback={false}
                  toggleMask
                />
              </div>
              <div className="col-6">
                <label>Referencia de la contraseña</label>
                <InputText
                  className="w-full"
                  placeholder="Ej: vault/certificados/empresa-x"
                  value={certificadoForm.passwordSecretReference}
                  onChange={(e) => setCertificadoForm({ ...certificadoForm, passwordSecretReference: e.target.value })}
                />
              </div>

              <div className="col-6 flex align-items-center gap-2">
                <Checkbox
                  inputId="certificadoPredeterminado"
                  checked={certificadoForm.predeterminado}
                  onChange={(e) => setCertificadoForm({ ...certificadoForm, predeterminado: e.checked ?? false })}
                />
                <label htmlFor="certificadoPredeterminado" className="m-0">Marcar como predeterminado</label>
              </div>

              <div className="col-6">
                <input ref={fileInputRef} type="file" accept=".p12,.pfx" style={{ display: "none" }} onChange={onArchivoSeleccionado} />
                <Button
                  label={archivoCertificado ? archivoCertificado.name : "Seleccionar archivo .p12"}
                  icon="pi pi-upload"
                  severity="secondary"
                  outlined
                  className="w-full"
                  onClick={seleccionarArchivo}
                />
              </div>
            </div>

            <Button
              label="Subir Certificado"
              icon="pi pi-upload"
              severity="success"
              loading={subiendoCertificado}
              onClick={subirCertificado}
              className="mt-2"
            />
          </TabPanel>
        </TabView>
      </Dialog>
    </div>
  );
}
