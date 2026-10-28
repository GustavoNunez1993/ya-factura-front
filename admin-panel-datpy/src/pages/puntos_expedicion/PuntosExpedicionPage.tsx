import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { DataTable, type DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

import {
  PuntoExpedicionService,
  codigoPunto,
  type NumeracionDocumento,
  type PuntoExpedicion
} from "../../services/PuntoExpedicionService";
import { TimbradoService, type Timbrado } from "../../services/TimbradoService";
import { useIsMobile } from "../../hooks/useIsMobile";
import { usePermisos } from "../../hooks/usePermisos";

interface PuntoForm {
  establecimiento: string;
  puntoExpedicion: string;
  timbradoId: string | null;
  descripcion: string;
}

const MAXIMO_NUMERO_SIN_SERIE = 9_999_999;

const NOMBRES_TIPO: Record<number, string> = {
  1: "Factura electrónica",
  4: "Autofactura electrónica",
  5: "Nota de crédito electrónica",
  6: "Nota de débito electrónica",
  7: "Nota de remisión electrónica"
};

const formVacio: PuntoForm = { establecimiento: "", puntoExpedicion: "", timbradoId: null, descripcion: "" };

const mensajeError = (error: unknown, porDefecto: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? porDefecto;

export default function PuntosExpedicionPage() {
  // Acciones según el rol (el back valida igual cada una).
  const { puede } = usePermisos();
  const empresaId = localStorage.getItem("empresaId") || "";

  const [puntos, setPuntos] = useState<PuntoExpedicion[]>([]);
  const [timbrados, setTimbrados] = useState<Timbrado[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandidos, setExpandidos] = useState<DataTableExpandedRows>({});

  const [open, setOpen] = useState(false);
  // null = alta; si no, se editan descripción y timbrado de ese punto.
  const [editando, setEditando] = useState<PuntoExpedicion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<PuntoForm>(formVacio);

  const [inutilizarTarget, setInutilizarTarget] = useState<{ punto: PuntoExpedicion; numeracion: NumeracionDocumento } | null>(null);
  const [numeroHasta, setNumeroHasta] = useState("");
  const [motivoInutilizar, setMotivoInutilizar] = useState("");
  const [inutilizando, setInutilizando] = useState(false);

  const isMobile = useIsMobile();

  const cargar = async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      const [puntosRes, timbradosRes] = await Promise.all([
        PuntoExpedicionService.listar(empresaId),
        TimbradoService.listar(empresaId)
      ]);
      setPuntos(puntosRes ?? []);
      setTimbrados(timbradosRes ?? []);
    } catch (error) {
      console.error("Error cargando puntos de expedición", error);
      setPuntos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [empresaId]);

  // Para elegir sólo sirven los timbrados activos; al editar se muestra también el actual aunque no lo esté.
  const opcionesTimbrado = timbrados
    .filter((t) => t.activo || t.id === editando?.timbrado.id)
    .map((t) => ({ label: `N° ${t.numeroTimbrado}${t.activo ? "" : " (inactivo)"}`, value: t.id }));

  const yaEmitio = (p: PuntoExpedicion) => p.numeraciones.some((n) => n.ultimoNumeroUsado > 0);

  const abrirNuevo = () => {
    setEditando(null);
    const activos = timbrados.filter((t) => t.activo);
    setForm({ ...formVacio, timbradoId: activos.length === 1 ? activos[0].id : null });
    setOpen(true);
  };

  const abrirEditar = (punto: PuntoExpedicion) => {
    setEditando(punto);
    setForm({
      establecimiento: punto.establecimiento,
      puntoExpedicion: punto.puntoExpedicion,
      timbradoId: punto.timbrado.id,
      descripcion: punto.descripcion ?? ""
    });
    setOpen(true);
  };

  const guardar = async () => {
    if (!form.establecimiento.trim() || !form.puntoExpedicion.trim() || !form.timbradoId) {
      Swal.fire("Atención", "Complete establecimiento, punto de expedición y timbrado", "warning");
      return;
    }

    try {
      setGuardando(true);
      const payload = { timbradoId: form.timbradoId, descripcion: form.descripcion.trim() };
      const punto = editando
        ? await PuntoExpedicionService.actualizar(editando.id, payload)
        : await PuntoExpedicionService.crear({
            ...payload,
            empresaId,
            establecimiento: form.establecimiento.trim(),
            puntoExpedicion: form.puntoExpedicion.trim()
          });

      Swal.fire("Listo", editando ? `Punto ${codigoPunto(punto)} actualizado` : `Punto ${codigoPunto(punto)} creado`, "success");
      setOpen(false);
      cargar();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", mensajeError(error, "No se pudo guardar el punto de expedición"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (punto: PuntoExpedicion, activo: boolean) => {
    const result = await Swal.fire({
      title: `¿${activo ? "Activar" : "Desactivar"} el punto ${codigoPunto(punto)}?`,
      text: activo
        ? "Se podrá volver a emitir desde este punto; la numeración sigue donde quedó."
        : "No se podrá emitir ningún documento desde este punto hasta volver a activarlo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: activo ? "Sí, activar" : "Sí, desactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: activo ? "#16a34a" : "#dc2626"
    });

    if (!result.isConfirmed) return;

    try {
      await PuntoExpedicionService.cambiarEstado(punto.id, activo);
      cargar();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", mensajeError(error, "No se pudo cambiar el estado"), "error");
    }
  };

  const abrirInutilizar = (punto: PuntoExpedicion, numeracion: NumeracionDocumento) => {
    setInutilizarTarget({ punto, numeracion });
    setNumeroHasta("");
    setMotivoInutilizar("");
  };

  const confirmarInutilizar = async () => {
    if (!inutilizarTarget) return;
    const { punto, numeracion } = inutilizarTarget;

    const proximoNumero = numeracion.ultimoNumeroUsado + 1;
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
      html: `¿Confirma inutilizar el rango <b>${String(proximoNumero).padStart(7, "0")}</b> a <b>${String(hasta).padStart(7, "0")}</b> de ${NOMBRES_TIPO[numeracion.tipoDocumento] ?? numeracion.tipoDocumento} en el punto ${codigoPunto(punto)}? Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, inutilizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });

    if (!result.isConfirmed) return;

    try {
      setInutilizando(true);
      const res = await PuntoExpedicionService.inutilizar(numeracion.id, {
        numeroHasta: hasta,
        motivo: motivoInutilizar.trim()
      });

      Swal.fire({
        icon: res.estado === "RECHAZADO" ? "error" : "success",
        title: "SIFEN",
        html: `<div style="text-align:left"><b>Estado del evento:</b> ${res.estado ?? "-"}<br/><b>Mensaje:</b> ${res.mensajeRespuesta ?? "-"}</div>`
      });

      setInutilizarTarget(null);
      cargar();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", mensajeError(error, "No se pudo inutilizar el rango en SIFEN"), "error");
    } finally {
      setInutilizando(false);
    }
  };

  const estadoTemplate = (p: PuntoExpedicion) => {
    if (!p.activo) return <Tag value="Inactivo" severity="danger" />;
    if (!p.timbrado.activo) return <Tag value="Timbrado inactivo" severity="warning" />;
    return <Tag value="Activo" severity="success" />;
  };

  const accionesTemplate = (p: PuntoExpedicion) => (
    <div className="flex gap-1">
      {puede("PUNTOS_EXPEDICION", "EDITAR") && (
      <Button icon="pi pi-pencil" rounded text tooltip="Editar" onClick={() => abrirEditar(p)} />
      )}
      {puede("PUNTOS_EXPEDICION", "EDITAR") && (p.activo ? (
        <Button icon="pi pi-ban" rounded text severity="danger" tooltip="Desactivar punto" onClick={() => cambiarEstado(p, false)} />
      ) : (
        <Button icon="pi pi-check" rounded text severity="success" tooltip="Activar punto" onClick={() => cambiarEstado(p, true)} />
      ))}
    </div>
  );

  const numeracionesTemplate = (p: PuntoExpedicion) => (
    <div className="p-2">
      <h4 className="mt-0 mb-2">Numeración de {codigoPunto(p)}</h4>
      <DataTable value={p.numeraciones} size="small" dataKey="id">
        <Column header="Tipo de documento" body={(n: NumeracionDocumento) => NOMBRES_TIPO[n.tipoDocumento] ?? n.tipoDocumento} />
        <Column header="Último número usado" body={(n: NumeracionDocumento) => String(n.ultimoNumeroUsado).padStart(7, "0")} />
        <Column header="Serie" body={(n: NumeracionDocumento) => n.serieActual ?? "-"} />
        <Column
          header="Acciones"
          style={{ width: "100px" }}
          body={(n: NumeracionDocumento) =>
            puede("PUNTOS_EXPEDICION", "INUTILIZAR") && p.activo && n.ultimoNumeroUsado < MAXIMO_NUMERO_SIN_SERIE ? (
              <Button
                icon="pi pi-eraser"
                text
                rounded
                severity="warning"
                tooltip="Inutilizar rango"
                onClick={() => abrirInutilizar(p, n)}
              />
            ) : null
          }
        />
      </DataTable>
    </div>
  );

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Puntos de expedición</h2>
          <small className="text-color-secondary">
            Establecimiento y punto desde donde se emite, con su timbrado. Expanda un punto para ver su numeración.
          </small>
        </div>
        {puede("PUNTOS_EXPEDICION", "CREAR") && (
        <Button label="Nuevo Punto" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
        )}
      </div>

      {isMobile ? (
        <>
          {puntos.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No hay puntos de expedición registrados</p>
          ) : (
            puntos.map((p) => (
              <div
                key={p.id}
                style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "#fff" }}
              >
                <div className="flex justify-content-between align-items-center">
                  <div>
                    <div className="flex align-items-center gap-2">
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{codigoPunto(p)}</span>
                      {estadoTemplate(p)}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {p.descripcion ? `${p.descripcion} · ` : ""}Timbrado N° {p.timbrado.numeroTimbrado}
                    </div>
                  </div>
                  {accionesTemplate(p)}
                </div>
                {p.numeraciones.map((n) => (
                  <div key={n.id} className="flex justify-content-between align-items-center" style={{ fontSize: 12, marginTop: 6 }}>
                    <span>
                      {NOMBRES_TIPO[n.tipoDocumento] ?? n.tipoDocumento}: {String(n.ultimoNumeroUsado).padStart(7, "0")}
                      {n.serieActual ? ` · Serie ${n.serieActual}` : ""}
                    </span>
                    {puede("PUNTOS_EXPEDICION", "INUTILIZAR") && p.activo && n.ultimoNumeroUsado < MAXIMO_NUMERO_SIN_SERIE && (
                      <Button icon="pi pi-eraser" text rounded severity="warning" size="small" onClick={() => abrirInutilizar(p, n)} />
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      ) : (
        <DataTable
          value={puntos}
          loading={loading}
          size="small"
          stripedRows
          showGridlines
          dataKey="id"
          expandedRows={expandidos}
          onRowToggle={(e) => setExpandidos(e.data as DataTableExpandedRows)}
          rowExpansionTemplate={numeracionesTemplate}
          emptyMessage="No hay puntos de expedición registrados"
        >
          <Column expander style={{ width: "48px" }} />
          <Column header="Establecimiento / P. Expedición" body={codigoPunto} style={{ width: "220px" }} />
          <Column header="Descripción" body={(p: PuntoExpedicion) => p.descripcion ?? "-"} />
          <Column header="Timbrado" body={(p: PuntoExpedicion) => `N° ${p.timbrado.numeroTimbrado}`} style={{ width: "150px" }} />
          <Column header="Estado" body={estadoTemplate} style={{ width: "150px" }} />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "110px" }} />
        </DataTable>
      )}

      <Dialog
        header={editando ? `Punto ${codigoPunto(editando)}` : "Nuevo Punto de Expedición"}
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "480px", maxWidth: "95vw" }}
        onHide={() => setOpen(false)}
      >
        <div className="flex flex-column gap-3">
          <div className="grid">
            <div className="col-6">
              <label>Establecimiento *</label>
              <InputText
                className="w-full"
                maxLength={3}
                placeholder="001"
                keyfilter="int"
                disabled={editando !== null}
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
                keyfilter="int"
                disabled={editando !== null}
                value={form.puntoExpedicion}
                onChange={(e) => setForm({ ...form, puntoExpedicion: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label>Timbrado *</label>
            <Dropdown
              className="w-full"
              value={form.timbradoId}
              options={opcionesTimbrado}
              placeholder="Seleccione timbrado"
              emptyMessage="No hay timbrados activos (cargarlos en Timbrados)"
              disabled={editando !== null && yaEmitio(editando)}
              onChange={(e) => setForm({ ...form, timbradoId: e.value })}
            />
            {editando !== null && yaEmitio(editando) && (
              <small className="text-color-secondary">
                El punto ya emitió documentos: su timbrado no se puede cambiar.
              </small>
            )}
          </div>

          <div>
            <label>Descripción</label>
            <InputText
              className="w-full"
              maxLength={100}
              placeholder="Ej.: Caja 1 - Casa central"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          {editando === null && (
            <small className="text-color-secondary">
              Se habilita la numeración de factura, autofactura, notas de crédito, débito y remisión.
            </small>
          )}

          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" outlined onClick={() => setOpen(false)} />
            <Button label="Guardar" icon="pi pi-check" loading={guardando} onClick={guardar} />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Inutilizar rango de numeración"
        visible={inutilizarTarget !== null}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "480px", maxWidth: "95vw" }}
        onHide={() => setInutilizarTarget(null)}
      >
        {inutilizarTarget && (
          <div className="flex flex-column gap-3">
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Cierra ante SIFEN un rango de {NOMBRES_TIPO[inutilizarTarget.numeracion.tipoDocumento]} del punto{" "}
              {codigoPunto(inutilizarTarget.punto)} (timbrado {inutilizarTarget.punto.timbrado.numeroTimbrado}) que
              todavía no se usó. No se puede deshacer.
            </p>

            <div>
              <label>Próximo número disponible</label>
              <InputText
                className="w-full"
                value={String(inutilizarTarget.numeracion.ultimoNumeroUsado + 1).padStart(7, "0")}
                disabled
              />
            </div>

            <div>
              <label>Inutilizar hasta *</label>
              <InputText
                className="w-full"
                type="number"
                min={inutilizarTarget.numeracion.ultimoNumeroUsado + 1}
                max={MAXIMO_NUMERO_SIN_SERIE}
                placeholder={String(inutilizarTarget.numeracion.ultimoNumeroUsado + 1)}
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
          <Button label="Cancelar" severity="secondary" onClick={() => setInutilizarTarget(null)} />
          <Button label="Inutilizar" icon="pi pi-eraser" severity="warning" loading={inutilizando} onClick={confirmarInutilizar} />
        </div>
      </Dialog>
    </div>
  );
}
