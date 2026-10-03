export type BadgeTone = "new" | "offer";

export type Department = "damas" | "caballeros" | "ninos" | "unisex";

export interface ProductBadge {
  label: string;
  tone: BadgeTone;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  highlights: string[];
  careInstructions: string;
  category: string;
  department: Department;
  icon: string;
  image?: string;
  price: number;
  oldPrice?: number;
  badge?: ProductBadge;
  rating: number;
  reviewsCount: number;
  stock: number;
  tags: string[];
  sizes: string[];
  colors?: ProductColor[];
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}
