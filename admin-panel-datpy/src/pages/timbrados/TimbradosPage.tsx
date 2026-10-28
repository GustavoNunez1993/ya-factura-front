import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

import { TimbradoService, type Timbrado } from "../../services/TimbradoService";
import { useIsMobile } from "../../hooks/useIsMobile";
import { usePermisos } from "../../hooks/usePermisos";

interface TimbradoForm {
  numeroTimbrado: string;
  fechaInicioVigencia: Date | null;
}

const formVacio: TimbradoForm = { numeroTimbrado: "", fechaInicioVigencia: null };

/** "2026-01-01" <-> Date local, sin corrimientos por zona horaria. */
const aFecha = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const aIso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
const aTexto = (iso: string) => aFecha(iso).toLocaleDateString("es-PY");

const mensajeError = (error: unknown, porDefecto: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? porDefecto;

export default function TimbradosPage() {
  // Acciones según el rol (el back valida igual cada una).
  const { puede } = usePermisos();
  const empresaId = localStorage.getItem("empresaId") || "";

  const [timbrados, setTimbrados] = useState<Timbrado[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  // null = alta; si no, se edita la fecha de ese timbrado (el número no se edita).
  const [editando, setEditando] = useState<Timbrado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<TimbradoForm>(formVacio);

  const isMobile = useIsMobile();

  const cargarTimbrados = async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      setTimbrados((await TimbradoService.listar(empresaId)) ?? []);
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
    setEditando(null);
    setForm(formVacio);
    setOpen(true);
  };

  const abrirEditar = (timbrado: Timbrado) => {
    setEditando(timbrado);
    setForm({ numeroTimbrado: timbrado.numeroTimbrado, fechaInicioVigencia: aFecha(timbrado.fechaInicioVigencia) });
    setOpen(true);
  };

  const guardar = async () => {
    if (!form.numeroTimbrado.trim() || !form.fechaInicioVigencia) {
      Swal.fire("Atención", "Complete el número de timbrado y la fecha de inicio de vigencia", "warning");
      return;
    }

    try {
      setGuardando(true);
      const fechaInicioVigencia = aIso(form.fechaInicioVigencia);
      if (editando) {
        await TimbradoService.actualizar(editando.id, { fechaInicioVigencia });
      } else {
        await TimbradoService.crear({ empresaId, numeroTimbrado: form.numeroTimbrado.trim(), fechaInicioVigencia });
      }

      Swal.fire("Listo", editando ? "Timbrado actualizado" : "Timbrado creado correctamente", "success");
      setOpen(false);
      cargarTimbrados();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", mensajeError(error, "No se pudo guardar el timbrado"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (timbrado: Timbrado, activo: boolean) => {
    const enUso = timbrado.puntosExpedicion > 0
      ? ` Los ${timbrado.puntosExpedicion} punto(s) de expedición que lo usan no podrán emitir.`
      : "";
    const result = await Swal.fire({
      title: activo ? "¿Activar timbrado?" : "¿Desactivar timbrado?",
      text: `N° ${timbrado.numeroTimbrado}.${activo ? "" : enUso}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: activo ? "Sí, activar" : "Sí, desactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: activo ? "#16a34a" : "#dc2626"
    });

    if (!result.isConfirmed) return;

    try {
      await TimbradoService.cambiarEstado(timbrado.id, activo);
      cargarTimbrados();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", mensajeError(error, "No se pudo cambiar el estado del timbrado"), "error");
    }
  };

  const estadoTemplate = (t: Timbrado) => (
    <Tag value={t.activo ? "Activo" : "Inactivo"} severity={t.activo ? "success" : "danger"} />
  );

  const accionesTemplate = (t: Timbrado) => (
    <div className="flex gap-1 justify-content-end">
      {puede("TIMBRADOS", "EDITAR") && (
      <Button icon="pi pi-pencil" text rounded tooltip="Editar fecha de vigencia" onClick={() => abrirEditar(t)} />
      )}
      {puede("TIMBRADOS", "EDITAR") && (t.activo ? (
        <Button icon="pi pi-ban" text rounded severity="danger" tooltip="Desactivar" onClick={() => cambiarEstado(t, false)} />
      ) : (
        <Button icon="pi pi-check" text rounded severity="success" tooltip="Activar" onClick={() => cambiarEstado(t, true)} />
      ))}
    </div>
  );

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Timbrados</h2>
          <small className="text-color-secondary">
            Timbrados autorizados por la SET. Se asignan a cada punto en Puntos de Expedición.
          </small>
        </div>
        {puede("TIMBRADOS", "CREAR") && (
        <Button label="Nuevo Timbrado" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
        )}
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
                    <span style={{ fontWeight: 600, fontSize: 14 }}>N° {t.numeroTimbrado}</span>
                    {estadoTemplate(t)}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    Vigente desde {aTexto(t.fechaInicioVigencia)} · {t.puntosExpedicion} punto(s)
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
          <Column field="numeroTimbrado" header="N° Timbrado" />
          <Column header="Inicio de vigencia" body={(t: Timbrado) => aTexto(t.fechaInicioVigencia)} />
          <Column field="puntosExpedicion" header="Puntos de expedición" />
          <Column header="Estado" body={estadoTemplate} style={{ width: "110px" }} />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "110px" }} />
        </DataTable>
      )}

      <Dialog
        header={editando ? `Timbrado N° ${editando.numeroTimbrado}` : "Nuevo Timbrado"}
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "420px", maxWidth: "95vw" }}
        onHide={() => setOpen(false)}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label>Número de timbrado *</label>
            <InputText
              className="w-full"
              maxLength={8}
              placeholder="12345678"
              keyfilter="int"
              disabled={editando !== null}
              value={form.numeroTimbrado}
              onChange={(e) => setForm({ ...form, numeroTimbrado: e.target.value })}
            />
          </div>

          <div>
            <label>Fecha de inicio de vigencia *</label>
            <Calendar
              className="w-full"
              dateFormat="dd/mm/yy"
              showIcon
              value={form.fechaInicioVigencia}
              onChange={(e) => setForm({ ...form, fechaInicioVigencia: (e.value as Date | null) ?? null })}
            />
            <small className="text-color-secondary">La que figura en el timbrado otorgado por la SET.</small>
          </div>

          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" outlined onClick={() => setOpen(false)} />
            <Button label="Guardar" icon="pi pi-check" loading={guardando} onClick={guardar} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
