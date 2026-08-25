import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";

import { useAuth } from "../../context/AuthContext";
import { UserProfileService, type UserProfile } from "../../services/UserProfileService";
import { resolveAssetUrl } from "../../services/api";

export default function PerfilPage() {
  const { user, updateUser } = useAuth();

  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [direccion, setDireccion] = useState("");
  const [celular, setCelular] = useState("");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await UserProfileService.getMe();
        aplicarPerfil(data);
      } catch (error) {
        console.error(error);
        if (user) aplicarPerfil(user);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const aplicarPerfil = (data: UserProfile) => {
    setPerfil(data);
    setNombre(data.nombre ?? "");
    setApellido(data.apellido ?? "");
    setDireccion(data.direccion ?? "");
    setCelular(data.celular ?? "");
  };

  const aplicarPerfilActualizado = (actualizado: UserProfile) => {
    aplicarPerfil(actualizado);
    updateUser({ ...user, ...actualizado });
  };

  const seleccionarFoto = () => {
    fileInputRef.current?.click();
  };

  const onFotoSeleccionada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      Swal.fire("Atención", "El archivo debe ser una imagen", "warning");
      return;
    }

    try {
      setSubiendoFoto(true);
      const actualizado = await UserProfileService.actualizarFoto(archivo);
      aplicarPerfilActualizado(actualizado);
      Swal.fire("Listo", "Foto de perfil actualizada", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo actualizar la foto de perfil", "error");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarPerfil = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      Swal.fire("Atención", "El nombre y el apellido son obligatorios", "warning");
      return;
    }

    try {
      setGuardandoPerfil(true);
      const actualizado = await UserProfileService.actualizarPerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        direccion: direccion.trim(),
        celular: celular.trim()
      });
      aplicarPerfilActualizado(actualizado);
      Swal.fire("Listo", "Datos actualizados correctamente", "success");
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo actualizar el perfil";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const cambiarPassword = async () => {
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      Swal.fire("Atención", "Complete todos los campos de contraseña", "warning");
      return;
    }

    if (passwordNueva.length < 6) {
      Swal.fire("Atención", "La nueva contraseña debe tener al menos 6 caracteres", "warning");
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      Swal.fire("Atención", "La nueva contraseña y su confirmación no coinciden", "warning");
      return;
    }

    try {
      setGuardandoPassword(true);
      await UserProfileService.cambiarPassword(passwordActual, passwordNueva);
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
      Swal.fire("Listo", "Contraseña actualizada correctamente", "success");
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo actualizar la contraseña";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardandoPassword(false);
    }
  };

  const fotoUrl = resolveAssetUrl(perfil?.fotoUrl ?? undefined);
  const iniciales = (perfil?.nombre?.[0] ?? user?.nombre?.[0] ?? "").toUpperCase() || "U";

  if (loading) {
    return <div className="text-color-secondary">Cargando perfil...</div>;
  }

  return (
    <div>
      <style>
        {`
          .perfil-card {
            border: 1px solid var(--surface-border);
            border-radius: 10px;
            background: var(--surface-card);
          }
          .perfil-field {
            flex: 1 1 220px;
            min-width: 0;
          }
          .perfil-field label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-color-secondary);
            margin-bottom: 6px;
          }
          .perfil-field .p-inputtext,
          .perfil-field .p-password,
          .perfil-field .p-password input {
            width: 100%;
          }
          .perfil-form-row {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
          }
        `}
      </style>

      <div className="mb-4">
        <h2 className="m-0">Mi Perfil</h2>
        <small className="text-color-secondary">Gestioná tu información personal y contraseña</small>
      </div>

      <div className="grid">
        <div className="col-12 md:col-4">
          <div className="perfil-card flex flex-column align-items-center gap-3 p-4">
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: "#6366f1",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 600,
                overflow: "hidden"
              }}
            >
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Foto de perfil"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                iniciales
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={onFotoSeleccionada}
            />

            <Button
              label="Cambiar foto"
              icon="pi pi-camera"
              severity="secondary"
              outlined
              size="small"
              loading={subiendoFoto}
              onClick={seleccionarFoto}
            />

            <div className="text-center">
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {perfil?.nombre} {perfil?.apellido}
              </div>
              <div className="text-color-secondary text-sm">{perfil?.email}</div>
              {perfil?.empresaNombre && (
                <div className="text-color-secondary text-sm mt-1">{perfil.empresaNombre}</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 md:col-8 flex flex-column gap-3">
          <div className="perfil-card p-4">
            <div className="text-lg font-semibold mb-3">Información de contacto</div>

            <div className="perfil-form-row">
              <div className="perfil-field">
                <label>Nombre</label>
                <InputText value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="perfil-field">
                <label>Apellido</label>
                <InputText value={apellido} onChange={(e) => setApellido(e.target.value)} />
              </div>
            </div>

            <div className="perfil-form-row">
              <div className="perfil-field">
                <label>Dirección</label>
                <InputText
                  value={direccion}
                  placeholder="Ej: Av. España 123"
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
              <div className="perfil-field">
                <label>Celular</label>
                <InputText
                  value={celular}
                  placeholder="Ej: 0981 123 456"
                  onChange={(e) => setCelular(e.target.value)}
                />
              </div>
            </div>

            <Button
              label="Guardar cambios"
              icon="pi pi-save"
              severity="success"
              loading={guardandoPerfil}
              onClick={guardarPerfil}
            />
          </div>

          <div className="perfil-card p-4">
            <div className="text-lg font-semibold mb-3">Cambiar contraseña</div>

            <div className="perfil-form-row">
              <div className="perfil-field" style={{ flexBasis: "100%" }}>
                <label>Contraseña actual</label>
                <Password
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  feedback={false}
                  toggleMask
                />
              </div>
            </div>

            <div className="perfil-form-row">
              <div className="perfil-field">
                <label>Nueva contraseña</label>
                <Password
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  toggleMask
                />
              </div>
              <div className="perfil-field">
                <label>Confirmar nueva contraseña</label>
                <Password
                  value={passwordConfirmar}
                  onChange={(e) => setPasswordConfirmar(e.target.value)}
                  feedback={false}
                  toggleMask
                />
              </div>
            </div>

            <Button
              label="Actualizar contraseña"
              icon="pi pi-lock"
              severity="success"
              loading={guardandoPassword}
              onClick={cambiarPassword}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
