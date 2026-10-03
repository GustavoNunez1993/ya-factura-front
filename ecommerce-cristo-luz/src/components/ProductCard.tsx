import { useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types/product";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/currency";
import ProductImage from "./ProductImage";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd(event: MouseEvent) {
    event.preventDefault();
    addToCart(product.id, 1, product.sizes[0], product.colors?.[0]?.name);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className="product-card bg-white border border-outline-variant rounded-xl p-4 flex flex-col"
    >
      <div className="relative w-full aspect-square rounded-lg mb-4 overflow-hidden">
        <ProductImage icon={product.icon} image={product.image} alt={product.name} />
        {product.badge && (
          <span
            className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              product.badge.tone === "new"
                ? "bg-primary text-on-primary"
                : "bg-secondary text-on-secondary"
            }`}
          >
            {product.badge.label}
          </span>
        )}
      </div>
      <h4 className="font-body-md text-body-md font-bold mb-1 truncate">
        {product.name}
      </h4>
      <p className="text-on-surface-variant text-body-sm mb-3">{product.subtitle}</p>
      <div className="mt-auto flex items-center justify-between">
        {product.oldPrice ? (
          <div className="flex flex-col">
            <span className="text-outline text-xs line-through">
              {formatCurrency(product.oldPrice)}
            </span>
            <span className="text-primary font-bold text-lg">
              {formatCurrency(product.price)}
            </span>
          </div>
        ) : (
          <span className="text-primary font-bold text-lg">
            {formatCurrency(product.price)}
          </span>
        )}
        <button
          onClick={handleAdd}
          aria-label="Agregar al carrito"
          className={`w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${
            justAdded
              ? "bg-primary text-on-primary"
              : "bg-secondary-container text-on-secondary-container"
          }`}
        >
          <span className="material-symbols-outlined">
            {justAdded ? "check_circle" : "add_shopping_cart"}
          </span>
        </button>
      </div>
    </Link>
  );
}
