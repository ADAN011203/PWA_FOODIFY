import { api } from "./api";

export interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  logoUrl: string | null;
  isActive: boolean;
  ownerId: string;
}

/**
 * Obtiene la lista de restaurantes que pertenecen al administrador actual.
 */
export async function getOwnedRestaurantsApi(): Promise<Restaurant[]> {
  try {
    const { data } = await api.get("/restaurants");
    // El backend retorna un array directamente o dentro de data.data
    return Array.isArray(data) ? data : (data.data ?? []);
  } catch (e) {
    console.error("Error fetching owned restaurants:", e);
    throw e;
  }
}

/**
 * Cambia el contexto del administrador a un nuevo restaurante.
 * Esto actualiza el campo restaurant_id en la tabla users para el usuario logueado.
 */
export async function switchActiveRestaurantApi(userId: string, restaurantId: string): Promise<void> {
  try {
    await api.patch(`/users/${userId}`, {
      restaurantId: parseInt(restaurantId, 10),
    });
  } catch (e) {
    console.error("Error switching restaurant:", e);
    throw e;
  }
}
