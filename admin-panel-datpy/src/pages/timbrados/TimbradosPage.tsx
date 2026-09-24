import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

import { TimbradoService, type Timbrado } from "../../services/TimbradoService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface TimbradoForm {
  establecimiento: string;
  puntoExpedicion: string;
  numeroTimbrado: string;
  tipoDocumento: number;
}

const MAXIMO_NUMERO_SIN_SERIE = 9_999_999;

const TIPOS_DOCUMENTO = [
  { label: "1 - Factura Electrónica", value: 1 },
  { label: "4 - Autofactura Electrónica", value: 4 },
  { label: "5 - Nota de Crédito Electrónica", value: 5 },
  { label: "6 - Nota de Débito Electrónica", value: 6 },
  { label: "7 - Nota de Remisión Electrónica", value: 7 }
];

const nombreTipoDocumento = (tipo: number) =>
  TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label ?? String(tipo);

const formVacio: TimbradoForm = {
  establecimiento: "",
  puntoExpedicion: "",
  numeroTimbrado: "",
  tipoDocumento: 1
};

export default function TimbradosPage() {
  const empresaId = localStorage.getItem("empresaId") || "";

  const [timbrados, setTimbrados] = useState<Timbrado[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<TimbradoForm>(formVacio);

  const [inutilizarOpen, setInutilizarOpen] = useState(false);
  const [inutilizarTarget, setInutilizarTarget] = useState<Timbrado | null>(null);
  const [numeroHasta, setNumeroHasta] = useState("");
  const [motivoInutilizar, setMotivoInutilizar] = useState("");
  const [inutilizando, setInutilizando] = useState(false);

  const isMobile = useIsMobile();

  const cargarTimbrados = async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      const data = await TimbradoService.listar(empresaId);
      setTimbrados(data ?? []);
    } catch (error) {
      console.error("Error cargando timbrados", error);
      setTimbrados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTimbrados();
  }, [empresaId]);

  const abrirNuevo = () => {
    setForm(formVacio);
    setOpen(true);
  };

  const guardar = async () => {
    if (!form.establecimiento.trim() || !form.puntoExpedicion.trim() || !form.numeroTimbrado.trim()) {
      Swal.fire("Atención", "Complete establecimiento, punto de expedición y número de timbrado", "warning");
      return;
    }

    try {
      setGuardando(true);
      await TimbradoService.crear({
        empresaId,
        establecimiento: form.establecimiento.trim(),
        puntoExpedicion: form.puntoExpedicion.trim(),
        tipoDocumento: form.tipoDocumento,
        numeroTimbrado: form.numeroTimbrado.trim()
      });

      Swal.fire("Creado", "Timbrado creado correctamente", "success");
      setOpen(false);
      cargarTimbrados();
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo crear el timbrado";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (timbrado: Timbrado) => {
    const result = await Swal.fire({
      title: "¿Desactivar timbrado?",
      text: `${timbrado.establecimiento}-${timbrado.puntoExpedicion} · N° ${timbrado.numeroTimbrado}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });

    if (!result.isConfirmed) return;

    try {
      await TimbradoService.desactivar(timbrado.id);
      Swal.fire("Listo", "Timbrado desactivado", "success");
      cargarTimbrados();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo desactivar el timbrado", "error");
    }
  };

  const abrirInutilizar = (timbrado: Timbrado) => {
    setInutilizarTarget(timbrado);
    setNumeroHasta("");
    setMotivoInutilizar("");
    setInutilizarOpen(true);
  };

  const confirmarInutilizar = async () => {
    if (!inutilizarTarget) return;

    const proximoNumero = inutilizarTarget.ultimoNumeroUsado + 1;
    const hasta = Number(numeroHasta);

    if (!numeroHasta.trim() || !Number.isInteger(hasta) || hasta < proximoNumero) {
      Swal.fire("Atención", `Ingrese un número mayor o igual al próximo disponible (${proximoNumero})`, "warning");
      return;
    }
    if (!motivoInutilizar.trim() || motivoInutilizar.trim().length < 5) {
      Swal.fire("Atención", "Indique un motivo de al menos 5 caracteres", "warning");
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Inutilizar rango en SIFEN",
      html: `¿Confirma inutilizar el rango <b>${String(proximoNumero).padStart(7, "0")}</b> a <b>${String(hasta).padStart(7, "0")}</b> del timbrado ${inutilizarTarget.numeroTimbrado}? Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, inutilizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });

    if (!result.isConfirmed) return;

    try {
      setInutilizando(true);
      const res = await TimbradoService.inutilizar(inutilizarTarget.id, {
        numeroHasta: hasta,
        motivo: motivoInutilizar.trim()
      });

      Swal.fire({
        icon: res.estado === "RECHAZADO" ? "error" : "success",
        title: "SIFEN",
        html: `<div style="text-align:left"><b>Estado del evento:</b> ${res.estado ?? "-"}<br/><b>Mensaje:</b> ${res.mensajeRespuesta ?? "-"}</div>`
      });

      setInutilizarOpen(false);
      cargarTimbrados();
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo inutilizar el rango en SIFEN";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setInutilizando(false);
    }
  };

  const numeracionTemplate = (rowData: Timbrado) => `${rowData.establecimiento}-${rowData.puntoExpedicion}`;

  const estadoTemplate = (rowData: Timbrado) => (
    <Tag value={rowData.activo ? "Activo" : "Inactivo"} severity={rowData.activo ? "success" : "danger"} />
  );

  const accionesTemplate = (rowData: Timbrado) =>
    rowData.activo ? (
      <div className="flex gap-1 justify-content-end">
        {rowData.ultimoNumeroUsado < MAXIMO_NUMERO_SIN_SERIE && (
          <Button
            icon="pi pi-eraser"
            text
            rounded
            severity="warning"
            tooltip="Inutilizar rango"
            onClick={() => abrirInutilizar(rowData)}
          />
        )}
        <Button icon="pi pi-ban" text rounded severity="danger" tooltip="Desactivar" onClick={() => desactivar(rowData)} />
      </div>
    ) : null;

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Timbrados</h2>
          <small className="text-color-secondary">Timbrados autorizados por el SET para la emisión de facturas electrónicas</small>
        </div>
        <Button label="Nuevo Timbrado" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      {isMobile ? (
        <>
          {timbrados.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No hay timbrados registrados</p>
          ) : (
            timbrados.map((t) => (
              <div
                key={t.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 8,
                  background: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div className="flex align-items-center gap-2">
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{numeracionTemplate(t)}</span>
                    {estadoTemplate(t)}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {nombreTipoDocumento(t.tipoDocumento)}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    N° {t.numeroTimbrado} · Último usado: {t.ultimoNumeroUsado}
                    {t.serieActual ? ` · Serie ${t.serieActual}` : ""}
                  </div>
                </div>
                {accionesTemplate(t)}
              </div>
            ))
          )}
        </>
      ) : (
        <DataTable
          value={timbrados}
          loading={loading}
          size="small"
          stripedRows
          showGridlines
          emptyMessage="No hay timbrados registrados"
        >
          <Column header="Establecimiento / P. Expedición" body={numeracionTemplate} />
          <Column header="Tipo" body={(row: Timbrado) => nombreTipoDocumento(row.tipoDocumento)} style={{ width: "230px" }} />
          <Column field="numeroTimbrado" header="N° Timbrado" />
          <Column field="serieActual" header="Serie actual" body={(row: Timbrado) => row.serieActual ?? "-"} />
          <Column field="ultimoNumeroUsado" header="Último número usado" />
          <Column header="Estado" body={estadoTemplate} style={{ width: "110px" }} />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "100px" }} />
        </DataTable>
      )}

      <Dialog
        header="Nuevo Timbrado"
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "480px", maxWidth: "95vw" }}
        onHide={() => setOpen(false)}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label>Tipo de documento</label>
            <Dropdown
              className="w-full"
              value={form.tipoDocumento}
              options={TIPOS_DOCUMENTO}
              onChange={(e) => setForm({ ...form, tipoDocumento: e.value })}
            />
          </div>

          <div className="grid">
            <div className="col-6">
              <label>Establecimiento *</label>
              <InputText
                className="w-full"
                maxLength={3}
                placeholder="001"
                value={form.establecimiento}
                onChange={(e) => setForm({ ...form, establecimiento: e.target.value })}
              />
            </div>

            <div className="col-6">
              <label>Punto de expedición *</label>
              <InputText
                className="w-full"
                maxLength={3}
                placeholder="001"
                value={form.puntoExpedicion}
                onChange={(e) => setForm({ ...form, puntoExpedicion: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label>Número de timbrado *</label>
            <InputText
              className="w-full"
              maxLength={8}
              placeholder="12345678"
              value={form.numeroTimbrado}
              onChange={(e) => setForm({ ...form, numeroTimbrado: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" severity="secondary" onClick={() => setOpen(false)} />
          <Button label="Guardar" icon="pi pi-check" severity="success" loading={guardando} onClick={guardar} />
        </div>
      </Dialog>

      <Dialog
        header="Inutilizar rango de numeración"
        visible={inutilizarOpen}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "480px", maxWidth: "95vw" }}
        onHide={() => setInutilizarOpen(false)}
      >
        {inutilizarTarget && (
          <div className="flex flex-column gap-3">
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Cierra ante SIFEN un rango de numeración del timbrado {inutilizarTarget.numeroTimbrado} (
              {inutilizarTarget.establecimiento}-{inutilizarTarget.puntoExpedicion}) que todavía no se usó.
              No se puede deshacer.
            </p>

            <div>
              <label>Próximo número disponible</label>
              <InputText className="w-full" value={String(inutilizarTarget.ultimoNumeroUsado + 1).padStart(7, "0")} disabled />
            </div>

            <div>
              <label>Inutilizar hasta *</label>
              <InputText
                className="w-full"
                type="number"
                min={inutilizarTarget.ultimoNumeroUsado + 1}
                max={MAXIMO_NUMERO_SIN_SERIE}
                placeholder={String(inutilizarTarget.ultimoNumeroUsado + 1)}
                value={numeroHasta}
                onChange={(e) => setNumeroHasta(e.target.value)}
              />
            </div>

            <div>
              <label>Motivo *</label>
              <InputTextarea
                className="w-full"
                rows={3}
                placeholder="Indique el motivo de la inutilización..."
                value={motivoInutilizar}
                onChange={(e) => setMotivoInutilizar(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" severity="secondary" onClick={() => setInutilizarOpen(false)} />
          <Button
            label="Inutilizar"
            icon="pi pi-eraser"
            severity="warning"
            loading={inutilizando}
            onClick={confirmarInutilizar}
          />
        </div>
      </Dialog>
    </div>
  );
}
