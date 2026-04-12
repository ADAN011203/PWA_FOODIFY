"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Order, OrderStatus } from "@/types/orders";
import { getActiveOrdersApi, updateOrderStatusApi, getKitchenOrdersApi, updateKitchenStatusApi } from "@/lib/ordersApi";

const STORAGE_KEY = "foodify_guest_orders";
const POLL_INTERVAL = 3000; // 3s

function readLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocalOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

// Hook para staff — intenta cargar desde backend, fallback a localStorage
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
    } catch {
      // Backend no disponible — usar localStorage
      setUseBackend(false);
    }
  }, [mode]);

  const refreshLocal = useCallback(() => {
    const current = localStorage.getItem(STORAGE_KEY) ?? "[]";
    if (current !== lastSnapshotRef.current) {
      lastSnapshotRef.current = current;
      try { setOrders(JSON.parse(current)); } catch { setOrders([]); }
    }
  }, []);

  useEffect(() => {
    // Carga inicial
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFromBackend().then(() => setIsReady(true));

    // Polling cada 3s
    const poll = setInterval(() => {
      if (useBackend) fetchFromBackend();
      else refreshLocal();
    }, POLL_INTERVAL);

    // Storage event para sincronización entre pestañas (localStorage)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && !useBackend) refreshLocal();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(poll);
      window.removeEventListener("storage", onStorage);
    };
  }, [fetchFromBackend, refreshLocal, useBackend]);

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    // Actualizar UI optimistamente
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));

    if (useBackend) {
      try {
        if (mode === "kitchen") await updateKitchenStatusApi(id, status);
        else await updateOrderStatusApi(id, status);
      } catch {
        // Si falla el backend, actualizar localStorage
        const updated = readLocalOrders().map((o) => o.id === id ? { ...o, status } : o);
        writeLocalOrders(updated);
      }
    } else {
      // Modo localStorage
      const updated = readLocalOrders().map((o) => o.id === id ? { ...o, status } : o);
      writeLocalOrders(updated);
      lastSnapshotRef.current = JSON.stringify(updated);
    }
  }, [useBackend, mode]);

  return { orders, updateStatus, isReady };
}
