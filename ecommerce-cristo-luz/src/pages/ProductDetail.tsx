import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import ProductImage from "../components/ProductImage";
import { getProductById, getRelatedProducts } from "../data/products";
import { useCart } from "../context/CartContext";
import { useTenant } from "../context/TenantContext";
import { formatCurrency } from "../utils/currency";

const tabs = ["Descripción", "Talles y Cuidado", "Detalles"] as const;

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const product = productId ? getProductById(productId) : undefined;
  const { addToCart } = useCart();
  const { tenant } = useTenant();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Descripción");
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product?.sizes[0]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors?.[0]?.name,
  );
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setActiveTab("Descripción");
    setSelectedSize(product?.sizes[0]);
    setSelectedColor(product?.colors?.[0]?.name);
  }, [productId, product]);

  useEffect(() => {
    if (!showToast) return;
    const timeout = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timeout);
  }, [showToast]);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const relatedProducts = getRelatedProducts(product, 4);
  const fullStars = Math.floor(product.rating);

  function handleBuyNow() {
    if (!product) return;
    addToCart(product.id, quantity, selectedSize, selectedColor);
    setShowToast(true);
  }

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pb-40">
      <Header variant="sub" />
      <main className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter p-margin-mobile md:p-margin-desktop">
          {/* Image */}
          <section className="space-y-sm">
            <div className="bg-white rounded-xl shadow-soft overflow-hidden aspect-square border border-outline-variant/30">
              <ProductImage
                icon={product.icon}
                image={product.image}
                alt={product.name}
                iconClassName="text-9xl"
              />
            </div>
          </section>

          {/* Details */}
          <section className="flex flex-col space-y-md">
            <div className="space-y-xs">
              <div className="flex gap-xs flex-wrap">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-surface-container-highest text-primary font-label-sm rounded text-xs uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="font-headline-lg text-headline-lg text-primary">
                {product.name}
              </h2>
              <div className="flex items-center gap-1 text-secondary">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: `'FILL' ${index < fullStars ? 1 : 0}` }}
                  >
                    star
                  </span>
                ))}
                <span className="text-on-surface-variant font-label-sm ml-2">
                  ({product.reviewsCount} reseñas)
                </span>
              </div>
            </div>

            <div className="py-xs">
              <p className="font-headline-xl text-headline-xl text-primary">
                {formatCurrency(product.price)}{" "}
                <span className="text-body-md text-on-surface-variant font-normal">
                  / {product.subtitle}
                </span>
              </p>
              {product.stock <= 10 && (
                <p className="text-error font-label-md text-label-md mt-1">
                  Solo quedan {product.stock} unidades en stock
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="space-y-sm">
              <div className="flex border-b border-outline-variant">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-label-md transition-colors ${
                      activeTab === tab
                        ? "border-b-2 border-primary text-primary"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="space-y-sm text-on-surface-variant font-body-md leading-relaxed">
                {activeTab === "Descripción" && <p>{product.description}</p>}
                {activeTab === "Talles y Cuidado" && (
                  <div className="space-y-md">
                    <div>
                      <p className="font-label-md text-on-surface mb-2">Talle</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-lg border font-label-md transition-colors ${
                              selectedSize === size
                                ? "bg-primary text-on-primary border-primary"
                                : "border-outline-variant text-on-surface hover:border-primary"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <div>
                        <p className="font-label-md text-on-surface mb-2">Color</p>
                        <div className="flex flex-wrap gap-3">
                          {product.colors.map((color) => (
                            <button
                              key={color.name}
                              onClick={() => setSelectedColor(color.name)}
                              aria-label={color.name}
                              title={color.name}
                              className={`w-9 h-9 rounded-full border-2 transition-transform ${
                                selectedColor === color.name
                                  ? "border-primary scale-110"
                                  : "border-outline-variant"
                              }`}
                              style={{ backgroundColor: color.hex }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <p>{product.careInstructions}</p>
                  </div>
                )}
                {activeTab === "Detalles" && (
                  <ul className="space-y-xs">
                    {product.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary mt-1">
                          check_circle
                        </span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-md py-xs border-t border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  local_shipping
                </span>
                <div>
                  <p className="font-label-sm text-on-surface">Envío Gratis</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Hoy mismo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified</span>
                <div>
                  <p className="font-label-sm text-on-surface">Garantía {tenant.storeName}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    Producto Original
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="p-margin-mobile md:p-margin-desktop bg-surface-bright">
            <h3 className="font-headline-md text-headline-md text-primary mb-md">
              Productos que podrían interesarte
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  to={`/producto/${related.id}`}
                  className="bg-white p-4 rounded-xl shadow-soft border border-outline-variant/20 hover:border-primary transition-all"
                >
                  <div className="aspect-square rounded-lg mb-2 overflow-hidden">
                    <ProductImage
                      icon={related.icon}
                      image={related.image}
                      alt={related.name}
                      iconClassName="text-4xl"
                    />
                  </div>
                  <p className="font-label-md text-on-surface truncate">
                    {related.name}
                  </p>
                  <p className="font-bold text-primary">
                    {formatCurrency(related.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Fixed bottom action bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-outline-variant z-[60] h-24 flex items-center px-margin-mobile md:px-margin-desktop">
        <div className="max-w-screen-xl mx-auto w-full flex items-center justify-between gap-md">
          <div className="hidden md:flex flex-col">
            <p className="font-label-sm text-on-surface-variant">Total Estimado</p>
            <p className="font-headline-md text-primary">
              {formatCurrency(product.price * quantity)}
            </p>
          </div>
          <div className="flex items-center bg-surface-container rounded-full px-2 py-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary-container/10 rounded-full transition-colors"
              aria-label="Disminuir cantidad"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="w-8 text-center font-bold text-primary">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary-container/10 rounded-full transition-colors"
              aria-label="Aumentar cantidad"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <button
            onClick={handleBuyNow}
            className="flex-1 max-w-md bg-secondary-container text-on-secondary-container hover:brightness-95 active:scale-95 transition-all h-14 rounded-full flex items-center justify-center gap-2 font-bold text-lg shadow-md"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            Comprar Ahora
          </button>
        </div>
      </footer>

      <div
        className={`fixed bottom-28 left-1/2 -translate-x-1/2 bg-on-surface text-surface-container-lowest px-6 py-3 rounded-full flex items-center gap-3 transition-opacity duration-300 pointer-events-none z-[70] ${
          showToast ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="material-symbols-outlined text-secondary-container">
          check_circle
        </span>
        <span className="font-label-md">Agregado al carrito correctamente</span>
      </div>
    </div>
  );
}
