import { publicApi, api } from "./api";
import { type Dish, type Category, type PublicMenu } from "../types/menu";

export const RESTAURANT_SLUG = "demo-restaurant";

export async function fetchPublicMenu(slug: string = RESTAURANT_SLUG, mode: "takeout" | "dine_in" = "takeout"): Promise<{
  menus: PublicMenu[];
  restaurant: { id: number; name: string; logoUrl?: string; isOpen: boolean };
}> {
  // El backend excluye /menu/:slug del prefijo global /api/v1
  const { data } = await publicApi.get(`/menu/${slug}`, { params: { mode } });
  const { restaurant, menus } = data.data;

  const mappedMenus: PublicMenu[] = (menus ?? []).map((m: any) => ({
    id: String(m.id),
    name: m.name,
    isActiveNow: Boolean(m.isActiveNow),
    isOrderableNow: Boolean(m.isOrderableNow),
    availabilityNote: m.availabilityNote,
    categories: (m.categories ?? []).filter((c: any) => c.isActive).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      emoji: c.icon ?? c.emoji ?? "tag",
      dishes: (c.dishes ?? [])
        .filter((d: any) => !d.deletedAt && (d.isAvailable !== false))
        .map((d: any) => ({
          id: String(d.id),
          name: d.name,
          description: d.description ?? "",
          price: Number(d.price),
          prepTime: Number(d.prepTimeMin ?? 15),
          imageUrl: Array.isArray(d.images) ? d.images[0] : (d.imageUrl ?? ""),
          images: Array.isArray(d.images) ? d.images : (d.imageUrl ? [d.imageUrl] : []),
          isAvailable: Boolean(d.isAvailable ?? true),
          categoryId: String(c.id),
          soldCount: Number(d.soldCount ?? 0),
        })),
    })),
  }));

  // Consideramos el restaurante "abierto" si al menos un menú está activo ahora
  const isRestaurantOpen = mappedMenus.some(m => m.isActiveNow);

  return {
    menus: mappedMenus,
    restaurant: {
      id: Number(restaurant?.id ?? 1),
      name: restaurant?.name ?? "Foodify",
      logoUrl: restaurant?.logoUrl,
      isOpen: isRestaurantOpen,
    },
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
          emoji: c.icon ?? c.emoji ?? "tag"
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

export async function getAdminMenusApi(): Promise<{ id: string; name: string }[]> {
  const { data } = await api.get("/menus");
  const items = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  return items.map((m: any) => ({
    id: String(m.id),
    name: m.name,
  }));
}

export async function createCategoryApi(menuId: string, name: string): Promise<Category> {
  const { data } = await api.post(`/menus/${menuId}/categories`, {
    name,
    description: "",
    sortOrder: 0,
  });
  const c = data.data;
  return {
    id: String(c.id),
    name: c.name,
    emoji: c.icon || "tag",
  };
}

