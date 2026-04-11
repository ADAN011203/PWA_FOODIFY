import { publicApi, api } from "./api";
import { MOCK_DISHES, MOCK_CATEGORIES } from "./mockData";
import { type Dish, type Category } from "../types/menu";

export const USE_MOCK_MENU = false;
export const RESTAURANT_SLUG = "demo-restaurant";

export async function fetchPublicMenu(slug: string = RESTAURANT_SLUG, mode: "takeout" | "dine_in" = "takeout"): Promise<{
  dishes: Dish[];
  categories: Category[];
  restaurantName: string;
  restaurantId: number;
}> {
  if (USE_MOCK_MENU) {
    return { dishes: MOCK_DISHES, categories: MOCK_CATEGORIES, restaurantName: "Foodify Demo", restaurantId: 1 };
  }

  try {
    // IMPORTANTE: Según src/main.ts del backend, /menu/:slug está EXCLUIDO del prefijo global /api/v1
    const { data } = await publicApi.get(`/menu/${slug}`, { params: { mode } });
    const { restaurant, menus } = data.data;

    const allDishes: Dish[] = [];
    const categoryMap = new Map<string, Category>();

    for (const menu of (menus ?? [])) {
      if (!menu.isActiveNow && mode !== "takeout") continue;
      for (const cat of (menu.categories ?? [])) {
        if (!categoryMap.has(String(cat.id))) {
          categoryMap.set(String(cat.id), {
            id:    String(cat.id),
            name:  cat.name,
            emoji: cat.icon ?? cat.emoji ?? "",
          });
        }
        for (const d of (cat.dishes ?? [])) {
          allDishes.push({
            id:              String(d.id),
            name:            d.name,
            description:     d.description ?? "",
            price:           Number(d.price),
            prepTime:        Number(d.prepTimeMin ?? d.prep_time_min ?? 15),
            images:          Array.isArray(d.images) ? d.images : [],
            isAvailable:     Boolean(d.isAvailable ?? true),
            available:       Boolean(d.isAvailable ?? true),
            categoryId:      String(cat.id),
            soldCount:       Number(d.soldCount ?? d.sold_count ?? 0),
            allergens:       Array.isArray(d.allergens) ? d.allergens : [],
            availabilityNote: d.availabilityNote,
          });
        }
      }
    }

    if (allDishes.length === 0) {
      return { dishes: MOCK_DISHES, categories: MOCK_CATEGORIES, restaurantName: restaurant?.name ?? "Foodify", restaurantId: Number(restaurant?.id ?? 1) };
    }

    return {
      dishes:         allDishes,
      categories:     Array.from(categoryMap.values()),
      restaurantName: restaurant?.name ?? "Foodify",
      restaurantId:   Number(restaurant?.id ?? 1),
    };
  } catch {
    return { dishes: MOCK_DISHES, categories: MOCK_CATEGORIES, restaurantName: "Foodify Demo", restaurantId: 1 };
  }
}

// ─── ADMIN: Platillos CRUD ──────────────────────────────────────────────────
export async function getDishesApi(): Promise<Dish[]> {
  try {
    const { data } = await api.get("/dishes");
    const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
    return list.map((d: any) => ({
      id:              String(d.id),
      name:            d.name,
      description:     d.description ?? "",
      price:           Number(d.price),
      prepTime:        Number(d.prepTimeMin ?? d.prep_time_min ?? 15),
      imageUrl:        Array.isArray(d.images) ? d.images[0] : "",
      images:          Array.isArray(d.images) ? d.images : [],
      isAvailable:     Boolean(d.isAvailable ?? true),
      categoryId:      String(d.categoryId ?? d.category?.id ?? ""),
      soldCount:       Number(d.soldCount ?? d.sold_count ?? 0),
      allergens:       Array.isArray(d.allergens) ? d.allergens : [],
      badge:           d.badge ?? undefined,
    }));
  } catch {
    return MOCK_DISHES;
  }
}

export async function createDishApi(payload: Partial<Dish>): Promise<Dish> {
  const backendPayload = {
    name: payload.name,
    price: payload.price,
    prepTimeMin: payload.prepTime,
    description: payload.description,
    categoryId: Number(payload.categoryId), // El backend require numérico
    isAvailable: payload.isAvailable,
    images: payload.imageUrl ? [payload.imageUrl] : undefined,
    badge: payload.badge,
  };
  const { data } = await api.post("/dishes", backendPayload);
  return data.data as unknown as Dish;
}

export async function updateDishApi(id: string, payload: Partial<Dish>): Promise<Dish> {
  const backendPayload = {
    name: payload.name,
    price: payload.price,
    prepTimeMin: payload.prepTime,
    description: payload.description,
    categoryId: Number(payload.categoryId),
    isAvailable: payload.isAvailable,
    images: payload.imageUrl ? [payload.imageUrl] : undefined,
    badge: payload.badge,
  };
  const { data } = await api.put(`/dishes/${id}`, backendPayload);
  return data.data as unknown as Dish;
}

export async function deleteDishApi(id: string): Promise<void> {
  await api.delete(`/dishes/${id}`);
}

export async function toggleDishAvailabilityApi(id: string, status: boolean): Promise<void> {
  await api.patch(`/dishes/${id}/availability`, { isAvailable: status });
}
