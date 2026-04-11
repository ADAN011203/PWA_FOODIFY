import { publicApi, api } from "./api";
import { type Dish, type Category } from "../types/menu";

export const RESTAURANT_SLUG = "demo-restaurant";

export async function fetchPublicMenu(slug: string = RESTAURANT_SLUG, mode: "takeout" | "dine_in" = "takeout"): Promise<{
  dishes: Dish[];
  categories: Category[];
  restaurantName: string;
  restaurantId: number;
}> {
  // IMPORTANTE: El backend excluye /menu/:slug del prefijo global /api/v1
  const { data } = await publicApi.get(`/menu/${slug}`, { params: { mode } });
  const { restaurant, menus, isActiveNow: globalIsActive } = data.data;
  const isRestaurantOpen = globalIsActive ?? true;

  const allDishes: Dish[] = [];
  const categoryMap = new Map<string, Category>();

  for (const menu of (menus ?? [])) {
    const isMenuVisible = (menu.isActiveNow ?? isRestaurantOpen) || mode === "takeout";
    if (!isMenuVisible) continue;
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

  return {
    dishes:         allDishes,
    categories:     Array.from(categoryMap.values()),
    restaurantName: restaurant?.name ?? "Foodify",
    restaurantId:   Number(restaurant?.id ?? 1),
  };
}

// ─── ADMIN: Platillos CRUD ──────────────────────────────────────────────────

export async function getAdminCategoriesApi(): Promise<Category[]> {
  const { data: menuData } = await api.get("/menus");
  const menus = Array.isArray(menuData.data) ? menuData.data : menuData.data?.items ?? [];
  const categories: Category[] = [];
  
  for (const m of menus) {
    try {
      const { data: catData } = await api.get(`/menus/${m.id}/categories`);
      const cats = Array.isArray(catData.data) ? catData.data : catData.data?.items ?? [];
      for (const c of cats) {
        categories.push({
          id: String(c.id),
          name: c.name,
          emoji: c.icon ?? c.emoji ?? "🏷️"
        });
      }
    } catch {
      // Continue if one menu fails
    }
  }
  return categories;
}

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
  } catch (e) {
    throw e;
  }
}

export async function createDishApi(payload: Partial<Dish>): Promise<Dish> {
  const backendPayload = {
    name: payload.name,
    price: payload.price,
    prep_time_min: payload.prepTime,
    description: payload.description,
    category_id: Number(payload.categoryId) || undefined,
    is_active: payload.isAvailable,
    images: payload.imageUrl ? [payload.imageUrl] : undefined,
  };
  const { data } = await api.post("/dishes", backendPayload);
  return data.data as unknown as Dish;
}

export async function updateDishApi(id: string, payload: Partial<Dish>): Promise<Dish> {
  const backendPayload = {
    name: payload.name,
    price: payload.price,
    prep_time_min: payload.prepTime,
    description: payload.description,
    category_id: Number(payload.categoryId) || undefined,
    is_active: payload.isAvailable,
    images: payload.imageUrl ? [payload.imageUrl] : undefined,
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
