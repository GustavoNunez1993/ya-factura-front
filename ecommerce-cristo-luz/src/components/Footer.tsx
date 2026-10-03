import { useTenant } from "../context/TenantContext";

export default function Footer() {
  const { tenant } = useTenant();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-container border-t border-outline-variant/30 mt-10">
      <div className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-10">
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0 shadow-soft">
              <img
                src={tenant.logoUrl}
                alt={tenant.storeName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary">
              {tenant.storeName}
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Contacto
            </h4>
            <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-lg">
                location_on
              </span>
              {tenant.address}
            </p>
            <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-lg">call</span>
              {tenant.contactPhone}
            </p>
            <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-lg">mail</span>
              {tenant.contactEmail}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-outline-variant/30">
        <p className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-4 text-center text-[12px] text-on-surface-variant">
          © {year} DatPy Informática. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
