import type { Order, OrderStatus } from "@/types/orders";

export interface OrdersResponse {
  data: any[];
  total: number;
}

export async function getOrdersApi(params?: any): Promise<Order[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", String(params.limit));

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1"}/orders?${searchParams.toString()}`
    );
    if (!res.ok) return [];

    const json = await res.json();
    const data = Array.isArray(json) ? json : (json?.data ?? []);
    if (!Array.isArray(data)) return [];

    return data.map((o: any) => {
      const rawItems = o.items ?? o.order_items ?? [];
      const mappedItems = Array.isArray(rawItems)
        ? rawItems.map((item: any) => ({
            id:        item.id,
            dishId:    item.dishId ?? item.dish_id,
            dishName:  item.dish?.name ?? item.dish_name ?? "Platillo",
            quantity:  Number(item.quantity ?? item.qty ?? 1),
            qty:       Number(item.qty ?? item.quantity ?? 1),
            unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
          }))
        : [];

      return {
        id:         o.id,
        folio:      o.folio ?? String(o.id).slice(0, 8),
        status:     o.status,
        total:      Number(o.total ?? 0),
        createdAt:  String(o.createdAt ?? o.created_at ?? new Date().toISOString()),
        items:      mappedItems,
        waiterName: o.waiter?.fullName ?? o.waiterName ?? "Admin",
      };
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function getActiveOrdersApi(): Promise<Order[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1"}/orders?status=active&limit=100`
    );
    if (!res.ok) return [];

    const json = await res.json();
    const data = Array.isArray(json) ? json : (json?.data ?? []);
    if (!Array.isArray(data)) return [];

    return data.map((o: any) => {
      const rawItems = o.items ?? o.order_items ?? [];
      const mappedItems = Array.isArray(rawItems)
        ? rawItems.map((item: any) => ({
            id:        item.id,
            dishId:    item.dishId ?? item.dish_id,
            dishName:  item.dish?.name ?? item.dish_name ?? "Platillo",
            quantity:  Number(item.quantity ?? item.qty ?? 1),
            qty:       Number(item.qty ?? item.quantity ?? 1),
            unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
          }))
        : [];

      return {
        id:         o.id,
        folio:      o.folio ?? String(o.id).slice(0, 8),
        status:     o.status,
        total:      Number(o.total ?? 0),
        createdAt:  String(o.createdAt ?? o.created_at ?? new Date().toISOString()),
        items:      mappedItems,
        waiterName: o.waiter?.fullName ?? o.waiterName ?? "Admin",
      };
    });
  } catch (error) {
    console.error("Error fetching active orders:", error);
    return [];
  }
}

export async function getKitchenOrdersApi(): Promise<Order[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1"}/orders?status=en_preparacion&limit=100`
    );
    if (!res.ok) return [];

    const json = await res.json();
    const data = Array.isArray(json) ? json : (json?.data ?? []);
    if (!Array.isArray(data)) return [];

    return data.map((o: any) => {
      const rawItems = o.items ?? o.order_items ?? [];
      const mappedItems = Array.isArray(rawItems)
        ? rawItems.map((item: any) => ({
            id:        item.id,
            dishId:    item.dishId ?? item.dish_id,
            dishName:  item.dish?.name ?? item.dish_name ?? "Platillo",
            quantity:  Number(item.quantity ?? item.qty ?? 1),
            qty:       Number(item.qty ?? item.quantity ?? 1),
            unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
          }))
        : [];

      return {
        id:         o.id,
        folio:      o.folio ?? String(o.id).slice(0, 8),
        status:     o.status,
        total:      Number(o.total ?? 0),
        createdAt:  String(o.createdAt ?? o.created_at ?? new Date().toISOString()),
        items:      mappedItems,
        waiterName: o.waiter?.fullName ?? o.waiterName ?? "Admin",
      };
    });
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return [];
  }
}

export async function updateOrderStatusApi(id: string, status: OrderStatus): Promise<void> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1"}/orders/${id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    if (!res.ok) throw new Error(`Error actualizando orden: ${res.status}`);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

export async function updateKitchenStatusApi(id: string, status: OrderStatus): Promise<void> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1"}/orders/${id}/kitchen-status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    if (res.status === 404) {
      await updateOrderStatusApi(id, status);
    } else if (!res.ok) {
      throw new Error(`Error actualizando estado cocina: ${res.status}`);
    }
  } catch (error) {
    console.error("Error updating kitchen status:", error);
    throw error;
  }
}

export async function cancelOrderApi(id: string): Promise<void> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1"}/orders/${id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelado" }),
      }
    );
    if (!res.ok) throw new Error(`Error cancelando orden: ${res.status}`);
  } catch (error) {
    console.error("Error canceling order:", error);
    throw error;
  }
}

export async function createPublicOrderApi(data: any): Promise<any> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1"}/orders/public`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error(`Error creando orden pública: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error creating public order:", error);
    throw error;
  }
}

export async function getOrderByFolioApi(slug: string, folio: string): Promise<Order | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api_proxy/api/v1"}/orders/folio/${folio}?slug=${slug}`
    );
    if (!res.ok) return null;

    const json = await res.json();
    const o = json?.data || json;
    if (!o || !o.id) return null;

    const rawItems = o.items ?? o.order_items ?? [];
    const mappedItems = Array.isArray(rawItems)
      ? rawItems.map((item: any) => ({
          id:        item.id,
          dishId:    item.dishId ?? item.dish_id,
          dishName:  item.dish?.name ?? item.dish_name ?? "Platillo",
          quantity:  Number(item.quantity ?? item.qty ?? 1),
          qty:       Number(item.qty ?? item.quantity ?? 1),
          unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
        }))
      : [];

    return {
      id:         o.id,
      folio:      o.folio ?? String(o.id).slice(0, 8),
      status:     o.status,
      total:      Number(o.total ?? 0),
      createdAt:  String(o.createdAt ?? o.created_at ?? new Date().toISOString()),
      items:      mappedItems,
      waiterName: o.waiter?.fullName ?? o.waiterName ?? "Admin",
    };
  } catch (error) {
    console.error("Error fetching order by folio:", error);
    return null;
  }
}