import { useState, useEffect, useCallback, useRef } from "react";
import type { Order, OrderStatus } from "@/types/orders";
import { getActiveOrdersApi, updateOrderStatusApi, getKitchenOrdersApi, updateKitchenStatusApi } from "@/lib/ordersApi";
import { getRestaurantSocket } from "@/lib/api/socket";

const STORAGE_KEY = "foodify_guest_orders";
const POLL_FALLBACK_INTERVAL = 15000; // 15sfallback if socket fails

function readLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocalOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

// Hook para staff — Real-time con Sockets (T38)
export function useSharedOrders(mode: "orders" | "kitchen" = "orders") {
  const [orders, setOrders]   = useState<Order[]>(() => readLocalOrders());
  const [isReady, setIsReady] = useState(false);
  const [useBackend, setUseBackend] = useState(false);
  const lastSnapshotRef = useRef<string>("");

  const fetchFromBackend = useCallback(async () => {
    try {
      const data = mode === "kitchen"
        ? await getKitchenOrdersApi()
        : await getActiveOrdersApi();

      const snapshot = JSON.stringify(data);
      if (snapshot !== lastSnapshotRef.current) {
        lastSnapshotRef.current = snapshot;
        setOrders(data);
      }
      setUseBackend(true);
      return data;
    } catch {
      setUseBackend(false);
      return [];
    }
  }, [mode]);

  useEffect(() => {
    // 1. Carga inicial
    fetchFromBackend().then(() => setIsReady(true));

    // 2. Conectar Sockets (T38 — Paridad con Android)
    const socket = getRestaurantSocket();
    
    const handleNewOrder = (newOrder: any) => {
      console.log("Socket: New Order received", newOrder);
      fetchFromBackend(); // Refresh full list to ensure consistency
    };

    const handleOrderUpdated = (updatedOrder: any) => {
      console.log("Socket: Order update received", updatedOrder);
      fetchFromBackend();
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_updated", handleOrderUpdated);
    socket.on("status_changed", handleOrderUpdated);

    // 3. Polling Fallback (mucho más lento, solo por seguridad)
    const fallback = setInterval(() => {
      if (!socket.connected) {
        console.log("Socket disconnected, using fallback polling...");
        fetchFromBackend();
      }
    }, POLL_FALLBACK_INTERVAL);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_updated", handleOrderUpdated);
      socket.off("status_changed", handleOrderUpdated);
      clearInterval(fallback);
    };
  }, [fetchFromBackend]);

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    // Optimistic update
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));

    try {
      if (mode === "kitchen") await updateKitchenStatusApi(id, status);
      else await updateOrderStatusApi(id, status);
      // Backend status is definitive
    } catch (e) {
      console.error("Error updating status:", e);
      fetchFromBackend(); // Rollback to actual backend state
    }
  }, [mode, fetchFromBackend]);

  return { orders, updateStatus, isReady };
}
