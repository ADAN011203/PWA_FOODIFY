"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { FoodSpinner } from "@/components/ui/FoodSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { EmptyState } from "@/components/EmptyState";
import type { OrderStatus, Order } from "@/types/orders";

function useRoleGuard(allowed: string[]) {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    // Esperar a que termine de leer localStorage antes de redirigir
    if (!isLoading && (!user || !allowed.includes(user.role))) {
      window.location.href = "/login";
    }
  }, [isLoading, user, allowed]);
  return { user, isLoading };
}



const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  nuevo:          { label: "Nuevo",     color: "#3b82f6", bg: "#1e3a5f", icon: "🆕" },
  en_preparacion: { label: "En cocina", color: "#f59e0b", bg: "#3d2e0a", icon: "👨‍🍳" },
  listo:          { label: "¡Listo!",   color: "#22c55e", bg: "#0d3320", icon: "🔔" },
  entregado:      { label: "Entregado", color: "#6b7280", bg: "#1f2937", icon: "✅" },
  cancelado:      { label: "Cancelado", color: "#ef4444", bg: "#3d1010", icon: "❌" },
};

export default function MeseroPage() {
  const { user, isLoading } = useRoleGuard(["mesero", "admin"]);
  const { logout } = useAuth();
  const { data: orders, setData: setOrders, loading, error, empty, refetch } = useFetchWithState<Order[]>("/orders");
  
  const [tab, setTab] = useState<"activos" | "entregados">("activos");

  if (isLoading || loading) return <FoodSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={refetch} />;

  const ativos    = (orders ?? []).filter(o => o.status === "nuevo" || o.status === "en_preparacion" || o.status === "listo");
  const entregados = (orders ?? []).filter(o => o.status === "entregado" || o.status === "cancelado");
  const displayed  = tab === "activos" ? ativos : entregados;

  const markEntregado = (id: string) => {
    if (setOrders) {
      setOrders(prev => (prev ?? []).map(o => o.id === id ? { ...o, status: "entregado" as OrderStatus } : o));
    }
  };

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ minHeight: "100dvh", background: "#111214", fontFamily: "'Outfit', sans-serif", color: "#f0ede8" }}>

      {/* Header */}
      <div style={{ background: "#1a1d21", borderBottom: "1px solid #2e3238", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🛎️</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: 0 }}>Vista Mesero</p>
            <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0 }}>🛎️ {user?.name} · {user?.branch}</p>
          </div>
        </div>
        <button onClick={logout} style={{ background: "#2e3238", color: "#f0ede8", border: "none", padding: "7px 14px", borderRadius: 8, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
          Salir
        </button>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {([
            { key: "activos",    label: `Activos (${ativos.length})` },
            { key: "entregados", label: `Entregados (${entregados.length})` },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "12px", borderRadius: 999, cursor: "pointer",
              background: tab === key ? "#FF6B35" : "#1a1d21",
              color: tab === key ? "white" : "#6b7280",
              fontWeight: 700, fontSize: "0.875rem", fontFamily: "inherit",
              border: tab === key ? "none" : "1px solid #2e3238",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Lista de órdenes */}
        {displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>🍽️</p>
            <p>Sin órdenes en esta sección</p>
          </div>
        ) : displayed.map((order) => {
          const cfg   = STATUS_CFG[order.status];
          const total = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
          const isListo = order.status === "listo";

          return (
            <div key={order.id} style={{
              background: "#1a1d21", borderRadius: 16, padding: "16px",
              marginBottom: 12, border: isListo ? "1.5px solid #22c55e" : "1px solid #2e3238",
              animation: isListo ? "pulse 2s infinite" : "none",
            }}>
              {/* Top */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <p style={{ fontWeight: 800, margin: "0 0 4px" }}>#{order.folio.slice(-6)}</p>
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>🕐 {fmtTime(order.createdAt)}</p>
                </div>
                <span style={{ background: cfg.bg, color: cfg.color, fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>

              {/* Items */}
              <div style={{ background: "#22262c", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < order.items.length - 1 ? 6 : 0 }}>
                    <span style={{ fontSize: "0.875rem", color: "#f0ede8" }}>
                      <strong style={{ color: "#FF6B35" }}>{item.qty}x</strong>{"  "}{item.dishName}
                    </span>
                    <span style={{ fontSize: "0.875rem", color: "#8a8f98" }}>${item.unitPrice * item.qty}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #2e3238", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: "#8a8f98" }}>Total</span>
                  <span style={{ fontWeight: 800, color: "#FF6B35" }}>${total}</span>
                </div>
              </div>

              {/* Acción: marcar entregado si está listo */}
              {isListo && (
                <button onClick={() => markEntregado(order.id)} style={{
                  width: "100%", background: "#22c55e", color: "white",
                  border: "none", padding: "12px", borderRadius: 12,
                  fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit",
                }}>
                  ✅ Marcar como entregado
                </button>
              )}
            </div>
          );
        })}

        <div style={{ height: 24 }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.3); }
          50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0);  }
        }
      `}</style>
    </div>
  );
}

