import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/CartContext";
import { useTenant } from "../context/TenantContext";
import { getProductById } from "../data/products";
import { formatCurrency } from "../utils/currency";

const SHIPPING_COST = 25000;

export default function Cart() {
  const { items, increment, decrement, removeFromCart, clearCart, subtotal } = useCart();
  const { tenant } = useTenant();
  const [coupon, setCoupon] = useState("");

  const cartRows = items
    .map((item) => ({ item, product: getProductById(item.productId) }))
    .filter((row): row is { item: typeof row.item; product: NonNullable<typeof row.product> } =>
      Boolean(row.product),
    );

  const shipping = cartRows.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  return (
    <div className="bg-surface-bright text-on-surface min-h-screen">
      <Header variant="sub" />
      <main className="pb-32 md:pb-20 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto min-h-screen pt-6">
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-xs">
            Mi Carrito
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Revisa tus productos seleccionados antes de finalizar tu compra.
          </p>
        </div>

        {cartRows.length === 0 ? (
          <div className="bento-card rounded-xl p-lg flex flex-col items-center text-center gap-4">
            <span className="material-symbols-outlined text-primary text-6xl">
              shopping_cart
            </span>
            <h3 className="font-headline-md text-headline-md text-primary">
              Tu carrito está vacío
            </h3>
            <p className="text-on-surface-variant">
              Explora nuestro catálogo y encuentra lo que necesitas.
            </p>
            <Link
              to="/"
              className="bg-primary text-on-primary font-bold px-6 py-3 rounded-xl hover:bg-primary-container transition-all"
            >
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <section className="lg:col-span-8 space-y-sm">
              {cartRows.map(({ item, product }) => (
                <div
                  key={`${item.productId}:${item.size ?? ""}:${item.color ?? ""}`}
                  className="bento-card rounded-xl p-md flex flex-col md:flex-row items-center gap-md"
                >
                  <Link
                    to={`/producto/${product.id}`}
                    className="w-24 h-24 rounded-lg flex-shrink-0 overflow-hidden"
                  >
                    <ProductImage
                      icon={product.icon}
                      image={product.image}
                      alt={product.name}
                      iconClassName="text-4xl"
                    />
                  </Link>
                  <div className="flex-grow text-center md:text-left">
                    <Link to={`/producto/${product.id}`}>
                      <h3 className="font-headline-md text-headline-md text-primary mb-1 hover:underline">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
                      {product.subtitle}
                      {item.size && ` · Talle ${item.size}`}
                      {item.color && ` · ${item.color}`}
                    </p>
                    <button
                      onClick={() => removeFromCart(product.id, item.size, item.color)}
                      className="text-error font-label-sm hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-2">
                    <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1">
                      <button
                        onClick={() => decrement(product.id, item.size, item.color)}
                        aria-label="Disminuir cantidad"
                        className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <span className="w-10 text-center font-bold text-primary">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increment(product.id, item.size, item.color)}
                        aria-label="Aumentar cantidad"
                        className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    <p className="font-headline-md text-headline-md text-primary font-bold">
                      {formatCurrency(product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="py-md border-t border-outline-variant mt-md flex justify-between items-center">
                <Link
                  to="/"
                  className="text-primary font-bold flex items-center gap-2 hover:underline"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  Continuar Comprando
                </Link>
                <button
                  onClick={clearCart}
                  className="text-error font-bold flex items-center gap-2 hover:underline"
                >
                  <span className="material-symbols-outlined">delete_sweep</span>
                  Vaciar Carrito
                </button>
              </div>
            </section>

            <aside className="lg:col-span-4">
              <div className="bento-card rounded-xl p-md lg:sticky lg:top-24">
                <h3 className="font-headline-md text-headline-md text-primary mb-md">
                  Resumen del Pedido
                </h3>
                <div className="space-y-sm mb-lg">
                  <div className="flex justify-between items-center text-body-md text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-semibold text-on-surface">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-body-md text-on-surface-variant">
                    <span>Envío a domicilio</span>
                    <span className="font-semibold text-secondary">
                      {formatCurrency(shipping)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-outline-variant pt-md mb-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-headline-md text-headline-md text-primary">
                      Total
                    </span>
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant mt-1 text-right italic">
                    Precios incluyen IVA
                  </p>
                </div>
                <div className="space-y-sm">
                  <button className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-lg hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-2">
                    <span>Proceder al Pago</span>
                    <span className="material-symbols-outlined">shopping_bag</span>
                  </button>
                  <div className="p-3 bg-surface-container-low rounded-lg flex items-start gap-3 mt-4">
                    <span className="material-symbols-outlined text-secondary font-bold">
                      verified_user
                    </span>
                    <p className="text-body-sm text-on-surface-variant leading-tight">
                      Tu transacción es segura con encriptación de 256 bits. Garantía
                      de {tenant.storeName}.
                    </p>
                  </div>
                </div>
                <div className="mt-md pt-md border-t border-outline-variant">
                  <p className="font-label-md text-label-md text-on-surface-variant mb-2">
                    ¿Tienes un cupón?
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={coupon}
                      onChange={(event) => setCoupon(event.target.value)}
                      className="flex-grow bg-surface-container rounded-lg px-4 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Código de descuento"
                      type="text"
                    />
                    <button className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg font-bold text-label-md hover:brightness-95">
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-md p-md bento-card rounded-xl border-dashed border-2 border-outline-variant flex items-center gap-4">
                <span className="material-symbols-outlined text-primary text-4xl">
                  local_shipping
                </span>
                <div>
                  <h4 className="font-label-md text-primary">Envío Inmediato</h4>
                  <p className="text-body-sm text-on-surface-variant">
                    Tu pedido llegará en aproximadamente 45-60 min.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
