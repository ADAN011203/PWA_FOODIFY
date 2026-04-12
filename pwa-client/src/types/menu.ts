export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Dish {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  emoji?: string;
  isAvailable: boolean;
  available?: boolean;
  soldCount?: number;
  badge?: "Popular" | "Nuevo" | "Chef";
  prepTime?: number;
  allergens?: string[];
  availabilityNote?: string;
}

export interface CartItem {
  dish: Dish;
  qty: number;
}