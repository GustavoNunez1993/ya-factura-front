import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useTenant } from "../context/TenantContext";
import { categories } from "../data/categories";
import SideDrawer from "./SideDrawer";

interface HeaderProps {
  variant?: "home" | "sub";
  title?: string;
  categoryMenu?: boolean;
}

const menuLinks = [
  { to: "/", label: "Inicio", icon: "home" },
  { to: "/catalogo", label: "Catálogo", icon: "checkroom" },
  { to: "/carrito", label: "Carrito", icon: "shopping_cart" },
  { to: "/perfil", label: "Mi Perfil", icon: "person" },
  { to: "/admin", label: "Panel de administración", icon: "tune" },
];

export default function Header({ variant = "home", title, categoryMenu = false }: HeaderProps) {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { tenant } = useTenant();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryMenuOpen]);

  return (
    <>
    <header className="bg-primary text-on-primary shadow-md sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16">
      <div className="flex items-center gap-3">
        {variant === "sub" && (
          <>
            <button
              aria-label="Volver"
              onClick={() => navigate(-1)}
              className="material-symbols-outlined text-on-primary hover:bg-primary-container/20 p-2 rounded-full transition-transform active:scale-95 duration-150"
            >
              arrow_back
            </button>
            <Link
              to="/"
              aria-label="Ir al inicio"
              className="material-symbols-outlined text-on-primary hover:bg-primary-container/20 p-2 rounded-full transition-transform active:scale-95 duration-150"
            >
              home
            </Link>
          </>
        )}
        {variant === "home" && (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={tenant.logoUrl} alt={tenant.storeName} className="w-full h-full object-cover" />
          </div>
        )}
        {categoryMenu ? (
          <div className="relative" ref={categoryMenuRef}>
            <button
              onClick={() => setCategoryMenuOpen((open) => !open)}
              className="flex items-center gap-1 hover:bg-primary-container/20 rounded-lg px-1 py-0.5 -mx-1 transition-colors"
            >
              <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-on-primary">
                {title ?? tenant.storeName}
              </h1>
              <span className="material-symbols-outlined text-on-primary">
                {categoryMenuOpen ? "expand_less" : "expand_more"}
              </span>
            </button>
            {categoryMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white text-on-surface rounded-xl shadow-soft border border-outline-variant/30 overflow-hidden z-50">
                <Link
                  to="/catalogo"
                  onClick={() => setCategoryMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined text-primary">apps</span>
                  Todas las categorías
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/catalogo?categoria=${category.id}`}
                    onClick={() => setCategoryMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary">
                      {category.icon}
                    </span>
                    <span className="font-label-md text-label-md">{category.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-on-primary">
            {title ?? tenant.storeName}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/carrito"
          aria-label="Ver carrito"
          className="relative text-on-primary hover:bg-primary-container/20 p-2 rounded-full duration-150"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {itemCount}
            </span>
          )}
        </Link>
        <Link
          to="/registro"
          aria-label="Registrarse"
          className="text-on-primary hover:bg-primary-container/20 p-2 rounded-full duration-150"
        >
          <span className="material-symbols-outlined">person_add</span>
        </Link>
        <button
          aria-label="Menú"
          onClick={() => setMenuOpen(true)}
          className="text-on-primary hover:bg-primary-container/20 p-2 rounded-full duration-150"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </header>

    <SideDrawer
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      title={tenant.storeName}
      leading={
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0">
          <img src={tenant.logoUrl} alt={tenant.storeName} className="w-full h-full object-cover" />
        </div>
      }
      footer={
        <button
          onClick={() => {
            setMenuOpen(false);
            navigate("/");
          }}
          className="w-full flex items-center gap-3 px-5 py-4 border-t border-outline-variant/50 text-error hover:bg-error-container/20 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-label-md">Salir</span>
        </button>
      }
    >
      {menuLinks.map((link) => (
        <Link
          key={link.label}
          to={link.to}
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 px-5 py-4 hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-primary">{link.icon}</span>
          <span className="font-label-md text-label-md">{link.label}</span>
        </Link>
      ))}
      <div className="border-t border-outline-variant/50 px-5 pt-3 pb-1 mt-1">
        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">
          Categorías
        </span>
      </div>
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/catalogo?categoria=${category.id}`}
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 px-5 py-4 hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-primary">{category.icon}</span>
          <span className="font-label-md text-label-md">{category.label}</span>
        </Link>
      ))}
    </SideDrawer>
    </>
  );
}
