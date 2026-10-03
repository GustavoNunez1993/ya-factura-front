import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

const navItems = [
  { to: "/", label: "Inicio", icon: "home" },
  { to: "/catalogo", label: "Catálogo", icon: "checkroom" },
  { to: "/carrito", label: "Carrito", icon: "shopping_cart" },
  { to: "/perfil", label: "Perfil", icon: "person" },
];

export default function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav className="bg-surface-container fixed bottom-0 w-full z-50 rounded-t-xl shadow-lg flex justify-around items-center h-20 px-4 border-t border-outline-variant">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        const isCartWithItems = item.to === "/carrito" && itemCount > 0;

        return (
          <Link
            key={item.label}
            to={item.to}
            className={`relative flex flex-col items-center justify-center rounded-full px-4 py-1 transition-transform active:scale-90 ${
              isActive
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="font-label-sm text-label-sm">{item.label}</span>
            {isCartWithItems && (
              <span className="absolute top-0 right-2 w-2 h-2 bg-error rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
