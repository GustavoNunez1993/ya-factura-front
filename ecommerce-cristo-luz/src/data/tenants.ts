import type { TenantConfig } from "../types/tenant";
import pharmacyLogo from "../assets/logo.png";

function initialsLogo(initial: string, color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='${color}'/><text x='32' y='43' font-family='Arial, sans-serif' font-size='30' font-weight='700' fill='white' text-anchor='middle'>${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const defaultTenant: TenantConfig = {
  id: "urban-threads",
  storeName: "Urban Threads",
  logoUrl: initialsLogo("U", "#a8402c"),
  heroImageUrl:
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80&auto=format&fit=crop",
  theme: {
    primary: "#a8402c",
    onPrimary: "#ffffff",
    primaryContainer: "#f4d9cf",
    secondary: "#5c5a3d",
    secondaryContainer: "#e8c468",
    onSecondaryContainer: "#3a2f04",
    background: "#f5f1ea",
    surface: "#ffffff",
    error: "#ba1a1a",
  },
  address: "Avenida España 123, Asunción, Paraguay",
  contactPhone: "+595 981 123 456",
  contactEmail: "contacto@urbanthreads.com",
};

/**
 * Segundo tenant de ejemplo (paleta original de la farmacia). Sirve como
 * referencia para confirmar que el motor de theming soporta más de un
 * "cliente"; no se expone todavía en ninguna UI de producción.
 */
export const referenceTenant: TenantConfig = {
  id: "farmacia-cristo-luz",
  storeName: "Farmacia Cristo Luz",
  logoUrl: pharmacyLogo,
  heroImageUrl:
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80&auto=format&fit=crop",
  theme: {
    primary: "#001f71",
    onPrimary: "#ffffff",
    primaryContainer: "#1a3691",
    secondary: "#4e6700",
    secondaryContainer: "#c8f163",
    onSecondaryContainer: "#536d00",
    background: "#f8f9ff",
    surface: "#f8f9ff",
    error: "#ba1a1a",
  },
  address: "5ta Avenida 12-34, Zona 10, Ciudad de Guatemala",
  contactPhone: "+502 2345-6789",
  contactEmail: "contacto@farmaciacristoluz.com",
};

export function getDefaultTenant(): TenantConfig {
  return defaultTenant;
}
