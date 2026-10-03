import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { categories } from "../data/categories";
import { getFeaturedProducts } from "../data/products";

export default function Home() {
  const featuredProducts = getFeaturedProducts(4);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    navigate(`/catalogo${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      <Header variant="home" />
      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-6">
        {/* Search Bar */}
        <section className="mb-8">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute inset-y-0 left-0 pl-4 flex items-center"
            >
              <span className="material-symbols-outlined text-primary">search</span>
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pill-search block w-full pl-12 pr-4 py-4 bg-white border border-outline-variant rounded-full font-body-md text-body-md focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
              placeholder="Buscar remeras, pantalones, accesorios..."
              type="text"
            />
          </form>
        </section>

        {/* Hero */}
        <section className="mb-10 overflow-hidden rounded-xl hero-gradient text-on-primary relative h-48 md:h-64 flex items-center">
          <div className="relative z-10 px-8 w-full md:w-1/2">
            <span className="inline-block bg-secondary-container text-on-secondary-container font-label-md text-label-md px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              Nueva Colección
            </span>
            <h2 className="font-headline-lg text-headline-lg mb-2 leading-tight">
              20% de descuento en tu primera compra
            </h2>
            <p className="font-body-md text-body-md opacity-90 mb-4">
              Descubrí las últimas tendencias en ropa y accesorios.
            </p>
            <button className="bg-secondary-container text-on-secondary-container font-label-md px-6 py-2 rounded-lg font-bold hover:brightness-105 transition-all">
              Ver Colección
            </button>
          </div>
          <div className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 w-48 h-48 items-center justify-center">
            <span className="material-symbols-outlined text-on-primary/30 text-[10rem]">
              checkroom
            </span>
          </div>
        </section>

        {/* Categories */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-headline-md">Categorías</h3>
            <Link to="/catalogo" className="text-primary font-label-md hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/catalogo?categoria=${category.id}`}
                className="flex flex-col items-center gap-2 min-w-[80px] group"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-secondary-container transition-colors">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {category.icon}
                  </span>
                </div>
                <span className="font-label-md text-label-md">{category.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured products */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-md text-headline-md">Productos Destacados</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Health tips banner */}
        <section className="bg-surface-container rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="font-headline-md text-headline-md mb-2">
              Novedades y Tips de Estilo
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4">
              Suscríbete para recibir lanzamientos, ofertas exclusivas y
              recomendaciones de outfits cada semana.
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-2 rounded-lg border-outline-variant focus:ring-primary focus:border-primary"
                placeholder="Tu correo electrónico"
                type="email"
              />
              <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:opacity-90">
                Suscribirse
              </button>
            </div>
          </div>
          <div className="w-32 h-32 flex-shrink-0 bg-white rounded-full flex items-center justify-center shadow-inner">
            <span
              className="material-symbols-outlined text-secondary text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              styler
            </span>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
