import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import ProductCard from "../components/ProductCard";
import SideDrawer from "../components/SideDrawer";
import { categories } from "../data/categories";
import { departments } from "../data/departments";
import { products } from "../data/products";
import { formatCurrency } from "../utils/currency";

const LETTER_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function sizeSortKey(size: string): [number, number, string] {
  if (size === "Único") return [3, 0, size];
  const letterIndex = LETTER_SIZE_ORDER.indexOf(size);
  if (letterIndex !== -1) return [1, letterIndex, size];
  const numeric = Number(size);
  if (!Number.isNaN(numeric)) return [0, numeric, size];
  return [2, 0, size];
}

function compareSizes(a: string, b: string): number {
  const [groupA, orderA] = sizeSortKey(a);
  const [groupB, orderB] = sizeSortKey(b);
  if (groupA !== groupB) return groupA - groupB;
  if (orderA !== orderB) return orderA - orderB;
  return a.localeCompare(b);
}

const allSizes = Array.from(new Set(products.flatMap((product) => product.sizes))).sort(
  compareSizes,
);

const allColors = Array.from(
  products
    .flatMap((product) => product.colors ?? [])
    .reduce((map, color) => (map.has(color.name) ? map : map.set(color.name, color.hex)), new Map<string, string>()),
).map(([name, hex]) => ({ name, hex }));

function parseListParam(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get("categoria"),
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setActiveCategory(searchParams.get("categoria"));
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const activeDepartments = parseListParam(searchParams.get("seccion"));
  const activeSizes = parseListParam(searchParams.get("talles"));
  const activeColors = parseListParam(searchParams.get("colores"));
  const minPrice = searchParams.get("precioMin");
  const maxPrice = searchParams.get("precioMax");

  function selectCategory(categoryId: string | null) {
    setActiveCategory(categoryId);
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set("categoria", categoryId);
    } else {
      params.delete("categoria");
    }
    setSearchParams(params);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  }

  function setListParam(key: string, list: string[]) {
    const params = new URLSearchParams(searchParams);
    if (list.length > 0) {
      params.set(key, list.join(","));
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  }

  function toggleDepartment(id: string) {
    setListParam(
      "seccion",
      activeDepartments.includes(id)
        ? activeDepartments.filter((value) => value !== id)
        : [...activeDepartments, id],
    );
  }

  function toggleSize(size: string) {
    setListParam(
      "talles",
      activeSizes.includes(size)
        ? activeSizes.filter((value) => value !== size)
        : [...activeSizes, size],
    );
  }

  function toggleColor(name: string) {
    setListParam(
      "colores",
      activeColors.includes(name)
        ? activeColors.filter((value) => value !== name)
        : [...activeColors, name],
    );
  }

  function setPriceParam(key: "precioMin" | "precioMax", value: string) {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams);
    params.delete("seccion");
    params.delete("talles");
    params.delete("colores");
    params.delete("precioMin");
    params.delete("precioMax");
    setSearchParams(params, { replace: true });
  }

  const activeFilterCount =
    activeDepartments.length +
    activeSizes.length +
    activeColors.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const filteredProducts = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    return products.filter((product) => {
      const matchesCategory = !activeCategory || product.category === activeCategory;
      const matchesQuery = product.name
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      const matchesDepartment =
        activeDepartments.length === 0 || activeDepartments.includes(product.department);
      const matchesSize =
        activeSizes.length === 0 || product.sizes.some((size) => activeSizes.includes(size));
      const matchesColor =
        activeColors.length === 0 ||
        (product.colors ?? []).some((color) => activeColors.includes(color.name));
      const matchesPrice =
        (min === null || product.price >= min) && (max === null || product.price <= max);
      return (
        matchesCategory &&
        matchesQuery &&
        matchesDepartment &&
        matchesSize &&
        matchesColor &&
        matchesPrice
      );
    });
  }, [activeCategory, query, activeDepartments, activeSizes, activeColors, minPrice, maxPrice]);

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      <Header variant="sub" title="Catálogo" categoryMenu />
      <main className="max-w-screen-xl mx-auto px-margin-mobile md:px-margin-desktop py-6">
        <section className="mb-6 flex gap-3 max-w-2xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-primary">search</span>
            </div>
            <input
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              className="pill-search block w-full pl-12 pr-4 py-4 bg-white border border-outline-variant rounded-full font-body-md text-body-md focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
              placeholder="Buscar remeras, pantalones, accesorios..."
              type="text"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="relative flex items-center gap-2 px-5 rounded-full border border-outline-variant bg-white hover:bg-surface-container-low transition-colors font-label-md flex-shrink-0"
          >
            <span className="material-symbols-outlined text-primary">tune</span>
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-on-primary text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </section>

        <section className="mb-8">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            <button
              onClick={() => selectCategory(null)}
              className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap transition-colors ${
                activeCategory === null
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => selectCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {category.icon}
                </span>
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-md text-headline-md">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"}
            </h2>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="text-on-surface-variant">
              No encontramos productos que coincidan con tu búsqueda.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav />

      <SideDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros"
        side="left"
        footer={
          <div className="flex items-center gap-3 p-4 border-t border-outline-variant/30">
            <button
              onClick={clearFilters}
              className="flex-1 text-error font-label-md py-3 rounded-xl border border-error/30 hover:bg-error-container/20 transition-colors"
            >
              Limpiar filtros
            </button>
            <button
              onClick={() => setFiltersOpen(false)}
              className="flex-1 bg-primary text-on-primary font-label-md py-3 rounded-xl hover:bg-primary-container transition-colors"
            >
              Ver resultados ({filteredProducts.length})
            </button>
          </div>
        }
      >
        <div className="px-5 py-4 space-y-2">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Sección
          </h3>
          {departments.map((department) => (
            <label
              key={department.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={activeDepartments.includes(department.id)}
                onChange={() => toggleDepartment(department.id)}
                className="w-5 h-5 accent-primary"
              />
              <span className="material-symbols-outlined text-primary">{department.icon}</span>
              <span className="font-body-md text-body-md">{department.label}</span>
            </label>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-outline-variant/30 space-y-3">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Talles
          </h3>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`px-3 py-1.5 rounded-lg border font-label-md transition-colors ${
                  activeSizes.includes(size)
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant text-on-surface hover:border-primary"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-outline-variant/30 space-y-3">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Colores
          </h3>
          <div className="flex flex-wrap gap-3">
            {allColors.map((color) => (
              <button
                key={color.name}
                onClick={() => toggleColor(color.name)}
                aria-label={color.name}
                title={color.name}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-transform ${
                  activeColors.includes(color.name)
                    ? "border-primary scale-110"
                    : "border-outline-variant"
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {activeColors.includes(color.name) && (
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: color.hex === "#ffffff" || color.hex === "#f5f5f0" ? "#1a1a1a" : "#ffffff" }}
                  >
                    check
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-outline-variant/30 space-y-3">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Precio ({formatCurrency(0)} - {formatCurrency(700000)})
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Mínimo"
              value={minPrice ?? ""}
              onChange={(event) => setPriceParam("precioMin", event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
            />
            <span className="text-on-surface-variant">—</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Máximo"
              value={maxPrice ?? ""}
              onChange={(event) => setPriceParam("precioMax", event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-secondary-container focus:border-primary transition-all"
            />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
