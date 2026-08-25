import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

import { TimbradoService, type Timbrado } from "../../services/TimbradoService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface TimbradoForm {
  establecimiento: string;
  puntoExpedicion: string;
  numeroTimbrado: string;
}

const TIPO_DOCUMENTO_FACTURA_ELECTRONICA = 1;

const formVacio: TimbradoForm = {
  establecimiento: "",
  puntoExpedicion: "",
  numeroTimbrado: ""
};

export default function TimbradosPage() {
  const empresaId = localStorage.getItem("empresaId") || "";

  const [timbrados, setTimbrados] = useState<Timbrado[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<TimbradoForm>(formVacio);

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
        tipoDocumento: TIPO_DOCUMENTO_FACTURA_ELECTRONICA,
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

  const numeracionTemplate = (rowData: Timbrado) => `${rowData.establecimiento}-${rowData.puntoExpedicion}`;

  const estadoTemplate = (rowData: Timbrado) => (
    <Tag value={rowData.activo ? "Activo" : "Inactivo"} severity={rowData.activo ? "success" : "danger"} />
  );

  const accionesTemplate = (rowData: Timbrado) =>
    rowData.activo ? (
      <Button icon="pi pi-ban" text rounded severity="danger" tooltip="Desactivar" onClick={() => desactivar(rowData)} />
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
            <InputText className="w-full" value="1 - Factura Electrónica" disabled />
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
    </div>
  );
}
