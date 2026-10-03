import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import LocationPicker from "../components/LocationPicker";
import { useUser } from "../context/UserContext";
import type { UserLocation } from "../types/user";

const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";

function generateStrongPassword(length = 14): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join("");
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<UserLocation | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  function handleGeneratePassword() {
    const generated = generateStrongPassword();
    setPassword(generated);
    setConfirmPassword(generated);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    register({ email, address, phone, location });
    setShowToast(true);
    setTimeout(() => navigate("/perfil"), 1200);
  }

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      <Header variant="sub" title="Crear Cuenta" />
      <main className="max-w-screen-md mx-auto px-margin-mobile md:px-margin-desktop py-6">
        <div className="bg-primary-container text-on-primary-container rounded-xl p-4 text-body-sm flex items-start gap-3 mb-lg">
          <span className="material-symbols-outlined">info</span>
          <p>
            Por ahora esta alta se guarda solo en este navegador (localStorage), a modo de vista
            previa. Cuando conectemos el backend, tu cuenta quedará guardada de verdad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-lg">
          <section className="bg-surface rounded-xl shadow-soft border border-outline-variant/30 p-6 space-y-md">
            <h2 className="font-headline-md text-headline-md text-primary">Datos de acceso</h2>

            <label className="block space-y-1">
              <span className="font-label-md text-label-md text-on-surface-variant">Correo electrónico</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
                placeholder="tu@correo.com"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-label-md text-label-md text-on-surface-variant">Contraseña</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
                placeholder="Mínimo 8 caracteres"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-label-md text-label-md text-on-surface-variant">Repetir contraseña</span>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
                placeholder="Repetí la contraseña"
              />
            </label>

            <button
              type="button"
              onClick={handleGeneratePassword}
              className="flex items-center gap-2 text-primary font-label-md hover:underline"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              Generar contraseña sugerida
            </button>

            {error && <p className="text-error font-label-md text-label-md">{error}</p>}
          </section>

          <section className="bg-surface rounded-xl shadow-soft border border-outline-variant/30 p-6 space-y-md">
            <h2 className="font-headline-md text-headline-md text-primary">Datos de contacto</h2>

            <label className="block space-y-1">
              <span className="font-label-md text-label-md text-on-surface-variant">Dirección particular</span>
              <input
                type="text"
                required
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
                placeholder="Calle, número, ciudad"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-label-md text-label-md text-on-surface-variant">Teléfono particular</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
                placeholder="+595 9XX XXX XXX"
              />
            </label>
          </section>

          <section className="bg-surface rounded-xl shadow-soft border border-outline-variant/30 p-6 space-y-md">
            <h2 className="font-headline-md text-headline-md text-primary">Ubicación (opcional)</h2>
            <LocationPicker value={location} onChange={setLocation} />
          </section>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-lg hover:bg-primary-container transition-all active:scale-95"
          >
            Crear Cuenta
          </button>
        </form>
      </main>

      <div
        className={`fixed bottom-28 left-1/2 -translate-x-1/2 bg-on-surface text-surface-container-lowest px-6 py-3 rounded-full flex items-center gap-3 transition-opacity duration-300 pointer-events-none z-[70] ${
          showToast ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="material-symbols-outlined text-secondary-container">check_circle</span>
        <span className="font-label-md">Cuenta creada correctamente</span>
      </div>

      <BottomNav />
    </div>
  );
}
