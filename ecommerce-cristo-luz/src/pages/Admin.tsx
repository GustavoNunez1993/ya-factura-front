import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useTenant } from "../context/TenantContext";
import type { ThemeTokens } from "../types/tenant";

const colorFields: { key: keyof ThemeTokens; label: string }[] = [
  { key: "primary", label: "Color primario" },
  { key: "onPrimary", label: "Texto sobre primario" },
  { key: "primaryContainer", label: "Primario (contenedor)" },
  { key: "secondary", label: "Color secundario" },
  { key: "secondaryContainer", label: "Secundario (contenedor / botón CTA)" },
  { key: "onSecondaryContainer", label: "Texto sobre botón CTA" },
  { key: "background", label: "Fondo de la tienda" },
  { key: "surface", label: "Fondo de tarjetas" },
  { key: "error", label: "Color de alertas" },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Admin() {
  const { tenant, updateTenant, resetTenant } = useTenant();
  const [storeName, setStoreName] = useState(tenant.storeName);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  function handleStoreNameBlur() {
    if (storeName.trim() && storeName !== tenant.storeName) {
      updateTenant({ storeName: storeName.trim() });
    }
  }

  function handleColorChange(key: keyof ThemeTokens, value: string) {
    updateTenant({ theme: { [key]: value } as Partial<ThemeTokens> });
  }

  async function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateTenant({ logoUrl: dataUrl });
  }

  async function handleHeroFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateTenant({ heroImageUrl: dataUrl });
  }

  function handleReset() {
    resetTenant();
    setStoreName(tenant.storeName);
  }

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      <Header variant="sub" title="Panel de administración" />
      <main className="max-w-screen-md mx-auto px-margin-mobile md:px-margin-desktop py-6 space-y-lg">
        <div className="bg-primary-container text-on-primary-container rounded-xl p-4 text-body-sm flex items-start gap-3">
          <span className="material-symbols-outlined">info</span>
          <p>
            Estos cambios se guardan solo en este navegador (localStorage) a modo de vista previa.
            Cuando conectemos el backend, quedarán guardados en la cuenta del comercio y visibles
            para todos los visitantes.
          </p>
        </div>

        <section className="bg-surface rounded-xl shadow-soft border border-outline-variant/30 p-6 space-y-md">
          <h2 className="font-headline-md text-headline-md text-primary">Datos de la tienda</h2>
          <label className="block space-y-1">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Nombre de la tienda
            </span>
            <input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              onBlur={handleStoreNameBlur}
              className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
              type="text"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="space-y-2">
              <span className="font-label-md text-label-md text-on-surface-variant">Logo</span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0">
                  <img src={tenant.logoUrl} alt="Logo actual" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    placeholder="URL de la imagen"
                    className="w-full px-3 py-2 text-body-sm rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
                    type="text"
                    onBlur={(event) => {
                      if (event.target.value.trim()) {
                        updateTenant({ logoUrl: event.target.value.trim() });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-primary font-label-sm hover:underline"
                  >
                    O subir un archivo
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFile}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Imagen de portada
              </span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0">
                  <img
                    src={tenant.heroImageUrl}
                    alt="Portada actual"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    placeholder="URL de la imagen"
                    className="w-full px-3 py-2 text-body-sm rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
                    type="text"
                    onBlur={(event) => {
                      if (event.target.value.trim()) {
                        updateTenant({ heroImageUrl: event.target.value.trim() });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => heroInputRef.current?.click()}
                    className="text-primary font-label-sm hover:underline"
                  >
                    O subir un archivo
                  </button>
                  <input
                    ref={heroInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeroFile}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-xl shadow-soft border border-outline-variant/30 p-6 space-y-md">
          <h2 className="font-headline-md text-headline-md text-primary">Colores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {colorFields.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between gap-3">
                <span className="font-body-sm text-body-sm">{label}</span>
                <input
                  type="color"
                  value={tenant.theme[key]}
                  onChange={(event) => handleColorChange(key, event.target.value)}
                  className="w-12 h-9 rounded-md border border-outline-variant cursor-pointer"
                />
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 text-error font-bold hover:underline"
          >
            <span className="material-symbols-outlined">restart_alt</span>
            Restaurar valores por defecto
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
