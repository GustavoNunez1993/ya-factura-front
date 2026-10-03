import type { Product } from "../types/product";

const NEUTRAL_COLORS = [
  { name: "Negro", hex: "#1a1a1a" },
  { name: "Blanco", hex: "#f5f5f0" },
  { name: "Gris", hex: "#8a8a8a" },
];

export const products: Product[] = [
  {
    id: "remera-basica-algodon",
    name: "Remera Básica de Algodón",
    subtitle: "100% algodón peinado",
    description:
      "Remera esencial de algodón peinado 24/1, corte clásico y tacto suave. La base perfecta para combinar con cualquier look.",
    highlights: [
      "Algodón peinado de alta calidad.",
      "Corte clásico, no se deforma con el lavado.",
      "Disponible en varios colores.",
    ],
    careInstructions:
      "Lavar a máquina en agua fría con colores similares. No usar cloro. Secar a la sombra y planchar a temperatura media.",
    category: "remeras",
    department: "unisex",
    icon: "checkroom",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&auto=format&fit=crop",
    price: 129000,
    badge: { label: "Nuevo", tone: "new" },
    rating: 4.6,
    reviewsCount: 58,
    stock: 60,
    tags: ["Básico", "Algodón"],
    sizes: ["S", "M", "L", "XL"],
    colors: NEUTRAL_COLORS,
  },
  {
    id: "remera-oversize-grafica",
    name: "Remera Oversize Estampada",
    subtitle: "Fit oversize - Estampa exclusiva",
    description:
      "Remera de corte oversize con estampa gráfica exclusiva. Ideal para un look urbano y relajado.",
    highlights: [
      "Corte oversize de tendencia.",
      "Estampa serigrafiada de alta durabilidad.",
      "Tela reforzada en cuello y puños.",
    ],
    careInstructions:
      "Lavar del revés en agua fría. No planchar sobre la estampa. Secar en percha, lejos del sol directo.",
    category: "remeras",
    department: "unisex",
    icon: "checkroom",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80&auto=format&fit=crop",
    price: 165000,
    oldPrice: 195000,
    badge: { label: "Oferta", tone: "offer" },
    rating: 4.7,
    reviewsCount: 84,
    stock: 34,
    tags: ["Oversize", "Estampada"],
    sizes: ["S", "M", "L", "XL"],
    colors: [NEUTRAL_COLORS[0], NEUTRAL_COLORS[1]],
  },
  {
    id: "remera-cuello-v",
    name: "Remera Cuello V Premium",
    subtitle: "Algodón pima",
    description:
      "Remera de cuello en V confeccionada en algodón pima ultra suave, con caída premium y acabado prolijo.",
    highlights: [
      "Algodón pima de fibra larga.",
      "Cuello en V favorecedor.",
      "Costuras reforzadas.",
    ],
    careInstructions:
      "Lavar a máquina en agua fría, ciclo suave. Secar a la sombra. Planchar del revés si es necesario.",
    category: "remeras",
    department: "damas",
    icon: "checkroom",
    image:
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80&auto=format&fit=crop",
    price: 142000,
    rating: 4.5,
    reviewsCount: 29,
    stock: 40,
    tags: ["Premium"],
    sizes: ["S", "M", "L", "XL"],
    colors: NEUTRAL_COLORS,
  },
  {
    id: "remera-manga-larga",
    name: "Remera Manga Larga Térmica",
    subtitle: "Interior afelpado",
    description:
      "Remera de manga larga con interior ligeramente afelpado, ideal para los días de entretiempo.",
    highlights: [
      "Interior afelpado para mayor abrigo.",
      "Puños elastizados.",
      "Tela que no pierde forma.",
    ],
    careInstructions:
      "Lavar a máquina en agua fría. No usar secadora. Planchar a temperatura baja.",
    category: "remeras",
    department: "caballeros",
    icon: "checkroom",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80&auto=format&fit=crop",
    price: 178000,
    rating: 4.4,
    reviewsCount: 21,
    stock: 25,
    tags: ["Entretiempo"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "jean-slim-fit",
    name: "Jean Slim Fit",
    subtitle: "Denim elastizado",
    description:
      "Jean de corte slim con denim elastizado que acompaña el movimiento sin perder forma durante todo el día.",
    highlights: [
      "Denim elastizado 4 direcciones.",
      "Corte slim moderno.",
      "Cinco bolsillos clásicos.",
    ],
    careInstructions:
      "Lavar a máquina del revés en agua fría. Evitar secadora para conservar la elasticidad.",
    category: "pantalones",
    department: "caballeros",
    icon: "styler",
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80&auto=format&fit=crop",
    price: 285000,
    badge: { label: "Nuevo", tone: "new" },
    rating: 4.6,
    reviewsCount: 47,
    stock: 30,
    tags: ["Denim", "Slim"],
    sizes: ["36", "38", "40", "42", "44"],
    colors: [
      { name: "Azul oscuro", hex: "#2c3e5c" },
      { name: "Negro", hex: "#1a1a1a" },
    ],
  },
  {
    id: "jean-mom-fit",
    name: "Jean Mom Fit",
    subtitle: "Tiro alto - Fit relajado",
    description:
      "Jean de tiro alto con fit relajado en la pierna, un clásico atemporal que combina comodidad y estilo retro.",
    highlights: [
      "Tiro alto favorecedor.",
      "Fit relajado en la pierna.",
      "Denim resistente de alta durabilidad.",
    ],
    careInstructions:
      "Lavar a máquina del revés en agua fría, con colores similares. Secar a la sombra.",
    category: "pantalones",
    department: "damas",
    icon: "styler",
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80&auto=format&fit=crop",
    price: 265000,
    rating: 4.5,
    reviewsCount: 33,
    stock: 22,
    tags: ["Denim", "Tiro alto"],
    sizes: ["36", "38", "40", "42"],
  },
  {
    id: "pantalon-cargo",
    name: "Pantalón Cargo Urbano",
    subtitle: "Bolsillos laterales",
    description:
      "Pantalón cargo de gabardina resistente con bolsillos laterales funcionales y cintura ajustable.",
    highlights: [
      "Bolsillos cargo laterales.",
      "Gabardina resistente al uso diario.",
      "Cintura con cordón ajustable.",
    ],
    careInstructions:
      "Lavar a máquina en agua fría. Secar a la sombra. Planchar a temperatura media.",
    category: "pantalones",
    department: "caballeros",
    icon: "styler",
    image:
      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80&auto=format&fit=crop",
    price: 245000,
    rating: 4.4,
    reviewsCount: 19,
    stock: 28,
    tags: ["Cargo"],
    sizes: ["36", "38", "40", "42", "44"],
  },
  {
    id: "pantalon-jogger",
    name: "Jogger Deportivo",
    subtitle: "Puños elastizados",
    description:
      "Pantalón jogger de algodón con puños elastizados en tobillo, ideal para uso diario o entrenamiento.",
    highlights: [
      "Tela suave y liviana.",
      "Puños elastizados en el tobillo.",
      "Bolsillos con cierre.",
    ],
    careInstructions:
      "Lavar a máquina en agua fría. No planchar sobre los elastizados.",
    category: "pantalones",
    department: "unisex",
    icon: "styler",
    image:
      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80&auto=format&fit=crop",
    price: 189000,
    oldPrice: 219000,
    badge: { label: "Oferta", tone: "offer" },
    rating: 4.6,
    reviewsCount: 52,
    stock: 45,
    tags: ["Deportivo"],
    sizes: ["S", "M", "L", "XL"],
    colors: NEUTRAL_COLORS,
  },
  {
    id: "campera-denim",
    name: "Campera de Jean",
    subtitle: "Denim rígido clásico",
    description:
      "Campera de jean de corte clásico, atemporal y versátil, perfecta para todas las estaciones intermedias.",
    highlights: [
      "Denim rígido de alta calidad.",
      "Botones metálicos.",
      "Bolsillos delanteros funcionales.",
    ],
    careInstructions:
      "Lavar a máquina del revés, agua fría. Secar a la sombra para evitar que destiña.",
    category: "camperas",
    department: "unisex",
    icon: "dry_cleaning",
    image:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=600&q=80&auto=format&fit=crop",
    price: 385000,
    rating: 4.7,
    reviewsCount: 41,
    stock: 18,
    tags: ["Denim", "Clásico"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "campera-inflable",
    name: "Campera Bomber",
    subtitle: "Satinada - Puños elastizados",
    description:
      "Campera bomber satinada con puños y cintura elastizados, un básico urbano que suma estilo a cualquier look.",
    highlights: [
      "Tela satinada resistente.",
      "Puños y cintura elastizados.",
      "Bolsillo interior con cierre.",
    ],
    careInstructions:
      "Lavar a máquina en ciclo suave, agua fría. Secar en posición horizontal, no colgar mojada.",
    category: "camperas",
    department: "caballeros",
    icon: "dry_cleaning",
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&auto=format&fit=crop",
    price: 495000,
    badge: { label: "Nuevo", tone: "new" },
    rating: 4.8,
    reviewsCount: 63,
    stock: 15,
    tags: ["Invierno", "Térmica"],
    sizes: ["S", "M", "L", "XL"],
    colors: NEUTRAL_COLORS,
  },
  {
    id: "abrigo-lana",
    name: "Abrigo de Paño",
    subtitle: "Corte largo - Doble botonadura",
    description:
      "Abrigo de paño con corte largo y doble botonadura, una pieza elegante que eleva cualquier outfit de invierno.",
    highlights: [
      "Paño de calidad superior.",
      "Doble botonadura clásica.",
      "Forro interior completo.",
    ],
    careInstructions: "Limpieza en seco recomendada. No lavar en agua. Guardar en percha ancha.",
    category: "camperas",
    department: "damas",
    icon: "dry_cleaning",
    image:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80&auto=format&fit=crop",
    price: 620000,
    rating: 4.9,
    reviewsCount: 27,
    stock: 10,
    tags: ["Elegante", "Invierno"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "buzo-canguro",
    name: "Buzo Canguro con Capucha",
    subtitle: "Friza interior",
    description:
      "Buzo con capucha y bolsillo canguro, friza interior afelpada para máxima comodidad en el día a día.",
    highlights: [
      "Friza interior afelpada.",
      "Bolsillo canguro delantero.",
      "Capucha con cordón ajustable.",
    ],
    careInstructions: "Lavar a máquina en agua fría. Secar a la sombra, evitar secadora.",
    category: "camperas",
    department: "unisex",
    icon: "dry_cleaning",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80&auto=format&fit=crop",
    price: 235000,
    rating: 4.5,
    reviewsCount: 39,
    stock: 32,
    tags: ["Casual"],
    sizes: ["S", "M", "L", "XL"],
    colors: NEUTRAL_COLORS,
  },
  {
    id: "vestido-floral",
    name: "Vestido Floral Midi",
    subtitle: "Tela liviana - Estampa floral",
    description:
      "Vestido midi de tela liviana con estampa floral, corte fluido y tiras ajustables. Perfecto para el día.",
    highlights: [
      "Tela liviana y fresca.",
      "Estampa floral exclusiva.",
      "Tiras ajustables en los hombros.",
    ],
    careInstructions: "Lavar a mano en agua fría. Secar a la sombra, sin retorcer.",
    category: "vestidos",
    department: "damas",
    icon: "woman",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80&auto=format&fit=crop",
    price: 298000,
    badge: { label: "Nuevo", tone: "new" },
    rating: 4.7,
    reviewsCount: 45,
    stock: 20,
    tags: ["Floral", "Verano"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "vestido-negro",
    name: "Vestido Bordó Elegante",
    subtitle: "Corte entallado",
    description:
      "Vestido en un profundo tono bordó, de corte entallado, ideal para ocasiones especiales. Tela con caída elegante y acabado premium.",
    highlights: [
      "Corte entallado favorecedor.",
      "Tela con caída premium.",
      "Botonadura decorativa delantera.",
    ],
    careInstructions: "Limpieza en seco recomendada. Planchar a baja temperatura del revés.",
    category: "vestidos",
    department: "damas",
    icon: "woman",
    image:
      "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80&auto=format&fit=crop",
    price: 365000,
    rating: 4.8,
    reviewsCount: 31,
    stock: 14,
    tags: ["Elegante"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "vestido-denim",
    name: "Vestido de Jean",
    subtitle: "Botonadura frontal",
    description:
      "Vestido de jean con botonadura frontal completa y cinturón a tono, un básico versátil para looks casuales.",
    highlights: [
      "Denim de buena caída.",
      "Botonadura frontal funcional.",
      "Incluye cinturón a tono.",
    ],
    careInstructions: "Lavar a máquina del revés en agua fría. Secar a la sombra.",
    category: "vestidos",
    department: "damas",
    icon: "woman",
    image:
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&q=80&auto=format&fit=crop",
    price: 275000,
    oldPrice: 320000,
    badge: { label: "Oferta", tone: "offer" },
    rating: 4.4,
    reviewsCount: 18,
    stock: 16,
    tags: ["Denim", "Casual"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "zapatillas-urbanas",
    name: "Zapatillas Urbanas Blancas",
    subtitle: "Cuero sintético",
    description:
      "Zapatillas urbanas de cuero sintético con suela liviana, un clásico que combina con todo tipo de outfits.",
    highlights: [
      "Cuero sintético de fácil limpieza.",
      "Suela liviana y flexible.",
      "Plantilla con espuma de confort.",
    ],
    careInstructions: "Limpiar con paño húmedo. No sumergir en agua. Dejar secar a temperatura ambiente.",
    category: "calzado",
    department: "unisex",
    icon: "footprint",
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80&auto=format&fit=crop",
    price: 385000,
    badge: { label: "Nuevo", tone: "new" },
    rating: 4.7,
    reviewsCount: 72,
    stock: 26,
    tags: ["Urbano"],
    sizes: ["37", "38", "39", "40", "41", "42"],
  },
  {
    id: "zapatillas-running",
    name: "Zapatillas Running",
    subtitle: "Amortiguación reactiva",
    description:
      "Zapatillas deportivas con entresuela de amortiguación reactiva, diseñadas para acompañar tus entrenamientos.",
    highlights: [
      "Amortiguación reactiva en cada pisada.",
      "Malla transpirable.",
      "Suela con agarre multidireccional.",
    ],
    careInstructions: "Limpiar con paño húmedo y jabón neutro. No lavar en lavarropas.",
    category: "calzado",
    department: "unisex",
    icon: "footprint",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop",
    price: 465000,
    rating: 4.6,
    reviewsCount: 54,
    stock: 20,
    tags: ["Deportivo"],
    sizes: ["37", "38", "39", "40", "41", "42"],
  },
  {
    id: "botas-cuero",
    name: "Botas de Cuero",
    subtitle: "Cuero genuino",
    description:
      "Botas de cuero genuino con suela de goma antideslizante, resistentes y de estilo atemporal.",
    highlights: [
      "Cuero genuino de primera calidad.",
      "Suela de goma antideslizante.",
      "Costuras reforzadas.",
    ],
    careInstructions: "Limpiar con cepillo y crema para cuero. Evitar exposición prolongada al agua.",
    category: "calzado",
    department: "caballeros",
    icon: "footprint",
    image:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80&auto=format&fit=crop",
    price: 545000,
    rating: 4.8,
    reviewsCount: 22,
    stock: 12,
    tags: ["Cuero", "Invierno"],
    sizes: ["38", "39", "40", "41", "42", "43"],
  },
  {
    id: "gorra-visera",
    name: "Gorra con Visera Curva",
    subtitle: "Ajuste trasero regulable",
    description:
      "Gorra de algodón con visera curva y cierre trasero regulable, el complemento ideal para looks urbanos.",
    highlights: [
      "Algodón resistente.",
      "Cierre trasero regulable.",
      "Visera curva pre-formada.",
    ],
    careInstructions: "Limpiar con paño húmedo. No lavar en máquina para mantener la forma de la visera.",
    category: "accesorios",
    department: "unisex",
    icon: "diamond",
    image:
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80&auto=format&fit=crop",
    price: 89000,
    rating: 4.5,
    reviewsCount: 37,
    stock: 50,
    tags: ["Urbano"],
    sizes: ["Único"],
    colors: NEUTRAL_COLORS,
  },
  {
    id: "cinturon-cuero",
    name: "Cinturón de Cuero",
    subtitle: "Hebilla metálica",
    description:
      "Cinturón de cuero genuino con hebilla metálica, un básico versátil que combina con jeans y pantalones de vestir.",
    highlights: [
      "Cuero genuino.",
      "Hebilla metálica resistente.",
      "Disponible en varios largos.",
    ],
    careInstructions: "Limpiar con paño seco. Aplicar crema para cuero cada tanto para conservarlo.",
    category: "accesorios",
    department: "caballeros",
    icon: "diamond",
    image:
      "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80&auto=format&fit=crop",
    price: 95000,
    rating: 4.4,
    reviewsCount: 16,
    stock: 40,
    tags: ["Cuero"],
    sizes: ["S", "M", "L"],
  },
  {
    id: "mochila-urbana",
    name: "Mochila Urbana",
    subtitle: "Compartimento para notebook",
    description:
      "Mochila urbana con compartimento acolchado para notebook, bolsillos organizadores y tela resistente al agua.",
    highlights: [
      "Compartimento acolchado para notebook.",
      "Tela resistente a salpicaduras.",
      "Bolsillos organizadores internos.",
    ],
    careInstructions: "Limpiar con paño húmedo. No sumergir en agua.",
    category: "accesorios",
    department: "unisex",
    icon: "diamond",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&auto=format&fit=crop",
    price: 245000,
    badge: { label: "Nuevo", tone: "new" },
    rating: 4.7,
    reviewsCount: 29,
    stock: 24,
    tags: ["Urbano"],
    sizes: ["Único"],
    colors: NEUTRAL_COLORS,
  },
  {
    id: "lentes-sol",
    name: "Lentes de Sol",
    subtitle: "Protección UV400",
    description:
      "Lentes de sol con protección UV400 y marco liviano, el accesorio ideal para completar cualquier look.",
    highlights: [
      "Protección UV400.",
      "Marco liviano y resistente.",
      "Incluye estuche rígido.",
    ],
    careInstructions: "Limpiar con paño de microfibra. Guardar siempre en su estuche.",
    category: "accesorios",
    department: "unisex",
    icon: "diamond",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80&auto=format&fit=crop",
    price: 135000,
    oldPrice: 165000,
    badge: { label: "Oferta", tone: "offer" },
    rating: 4.6,
    reviewsCount: 40,
    stock: 35,
    tags: ["Verano"],
    sizes: ["Único"],
  },
  {
    id: "remera-infantil-estampada",
    name: "Remera Infantil Estampada",
    subtitle: "100% algodón",
    description:
      "Remera infantil de algodón suave con estampa divertida, pensada para el uso diario y el juego sin límites.",
    highlights: [
      "Algodón 100% hipoalergénico.",
      "Costuras planas, no irritan la piel.",
      "Resiste lavados frecuentes sin destiñir.",
    ],
    careInstructions: "Lavar a máquina en agua fría. Secar a la sombra. No usar secadora.",
    category: "remeras",
    department: "ninos",
    icon: "checkroom",
    image:
      "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=80&auto=format&fit=crop",
    price: 65000,
    badge: { label: "Nuevo", tone: "new" },
    rating: 4.8,
    reviewsCount: 24,
    stock: 40,
    tags: ["Infantil", "Algodón"],
    sizes: ["2", "4", "6", "8", "10"],
  },
  {
    id: "short-infantil-casual",
    name: "Short Infantil Casual",
    subtitle: "Cintura elastizada",
    description:
      "Short infantil liviano con cintura elastizada y cordón ajustable, ideal para el día a día y la escuela.",
    highlights: [
      "Cintura elastizada con cordón.",
      "Tela liviana y transpirable.",
      "Bolsillos laterales funcionales.",
    ],
    careInstructions: "Lavar a máquina en agua fría. Secar a la sombra.",
    category: "pantalones",
    department: "ninos",
    icon: "styler",
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80&auto=format&fit=crop",
    price: 75000,
    rating: 4.6,
    reviewsCount: 15,
    stock: 30,
    tags: ["Infantil"],
    sizes: ["2", "4", "6", "8", "10"],
  },
  {
    id: "campera-infantil-capucha",
    name: "Campera Infantil con Capucha",
    subtitle: "Sherpa afelpado",
    description:
      "Campera infantil de sherpa afelpado con capucha, súper abrigada y suave para los días fríos de los más chicos.",
    highlights: [
      "Sherpa afelpado por dentro y por fuera.",
      "Capucha con orejitas.",
      "Cierre de broches, fácil de poner y sacar.",
    ],
    careInstructions: "Lavar a máquina en ciclo suave, agua fría. Secar a la sombra.",
    category: "camperas",
    department: "ninos",
    icon: "dry_cleaning",
    image:
      "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&q=80&auto=format&fit=crop",
    price: 135000,
    badge: { label: "Nuevo", tone: "new" },
    rating: 4.9,
    reviewsCount: 12,
    stock: 18,
    tags: ["Infantil", "Invierno"],
    sizes: ["3-6M", "6-12M", "12-18M", "24M"],
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}

export function getFeaturedProducts(limit = 4): Product[] {
  return products.slice(0, limit);
}
