import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { useAuth } from "../context/AuthContext";

/** Pantalla para una ruta a la que el rol del usuario no tiene acceso. */
export default function SinPermiso({ inicio = false }: { inicio?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <div className="card text-center p-5">
      <i className={`pi ${inicio ? "pi-home" : "pi-lock"} text-4xl text-color-secondary mb-3`} />
      {inicio ? (
        <>
          <h2 className="mt-0">Hola{user?.nombre ? `, ${user.nombre}` : ""}</h2>
          <p className="text-color-secondary">Elegí una opción del menú para empezar.</p>
        </>
      ) : (
        <>
          <h2 className="mt-0">Sin acceso</h2>
          <p className="text-color-secondary">
            Tu rol{user?.permisos?.rolNombre ? ` (${user.permisos.rolNombre})` : ""} no tiene permiso para esta pantalla.
            Pedile a un administrador que lo habilite en Configuraciones → Roles y permisos.
          </p>
          <Button label="Volver" icon="pi pi-arrow-left" outlined onClick={() => navigate(-1)} />
        </>
      )}
    </div>
  );
}
