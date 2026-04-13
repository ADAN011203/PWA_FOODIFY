"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { getActiveOrdersApi, updateOrderStatusApi, cancelOrderApi } from "@/lib/ordersApi";
import type { Order, OrderStatus } from "@/types/orders";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import ui from "@/components/ui/AdminUI.module.css";
import {
  IconReceipt,
  IconUser,
  IconBuilding,
  IconClock,
  IconClipboard,
  IconSearch,
  IconArrowLeft,
  IconChevronRight,
} from "@/components/ui/Icons";

function StatusDot({ color }: { color: string }) {
  return (
    <div 
      style={{ 
        width: 8, 
        height: 8, 
        borderRadius: "50%", 
        background: color,
        boxShadow: `0 0 6px ${color}`
      }} 
    />
  );
}

// ─── Guard ────────────────────────────────────────────────────────────────────
function useAdminGuard() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin"))
      window.location.href = "/login";
  }, [isLoading, user]);
  return { user, isLoading };
}

// ─── Config de estados ────────────────────────────────────────────────────────
const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  nuevo:          { label: "Nuevo",        color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  en_preparacion: { label: "En Cocina",    color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  listo:          { label: "Listo",        color: "#22c55e", bg: "rgba(34,197,94,0.15)"  },
  entregado:      { label: "Entregado",    color: "#8a8f98", bg: "rgba(138,143,152,0.15)"},
  cancelado:      { label: "Cancelado",    color: "#ef4444", bg: "rgba(239,68,68,0.15)"  },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  nuevo:          "en_preparacion",
  en_preparacion: "listo",
  listo:          "entregado",
};

const PAGE_SIZE = 8;

// ─── Recibo / Ticker de una orden ─────────────────────────────────────────────
function OrderTotals({ order }: { order: Order }) {
  const subtotal = (order.items ?? []).reduce((s, i) => s + i.unitPrice * i.qty, 0);
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: "var(--radius-md)",
        padding: 16,
        marginBottom: 16,
      }}
    >
      <p
        style={{
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <IconReceipt size={14} /> Detalle de la orden
      </p>
      {(order.items ?? []).map((item, i) => (
        <div
          key={i}
          style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
        >
          <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
            {item.qty}× {item.dishName}
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
            ${(item.unitPrice * item.qty).toLocaleString("es-MX")}
          </p>
        </div>
      ))}
      <div
        style={{
          borderTop: "1px solid var(--border-light)",
          marginTop: 10,
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <p style={{ fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Total</p>
        <p style={{ fontWeight: 900, color: "var(--color-primary)", fontSize: "1.1rem", margin: 0 }}>
          ${subtotal.toLocaleString("es-MX")}
        </p>
      </div>
    </div>
  );
}

// ─── Modal detalle de orden ───────────────────────────────────────────────────
function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onAdvance,
  onCancel,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvance: (id: string, status: OrderStatus) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  if (!order) return null;

  const cfg = STATUS_CFG[order.status];
  const nextStatus = NEXT_STATUS[order.status];

  const handleAction = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pedido #${(order.folio ?? "").slice(-6)}`}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: cfg.bg,
          color: cfg.color,
          padding: "4px 14px",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: "0.8rem",
          marginBottom: 16,
        }}
      >
        <StatusDot color={cfg.color} /> {cfg.label}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          { icon: <IconUser size={14} />, label: "Atendido por", value: order.attendedBy ?? "—" },
          { icon: <IconBuilding size={14} />, label: "Sucursal", value: order.branch ?? "—" },
          {
            icon: <IconClock size={14} />,
            label: "Hora",
            value: new Date(order.createdAt).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          {
            icon: <IconClipboard size={14} />,
            label: "Artículos",
            value: `${(order.items ?? []).reduce((s, i) => s + i.qty, 0)} pzas`,
          },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
            }}
          >
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "0 0 3px" }}>
              {icon} {label}
            </p>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <OrderTotals order={order} />

      {/* Acciones */}
      {nextStatus && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={() => handleAction(() => onAdvance(order.id, nextStatus))}
          style={{ marginBottom: 10 }}
        >
          Avanzar a {STATUS_CFG[nextStatus].label}
        </Button>
      )}
      {order.status !== "cancelado" && order.status !== "entregado" && (
        <Button
          variant="danger"
          size="md"
          fullWidth
          loading={loading}
          onClick={() => handleAction(() => onCancel(order.id))}
          style={{ marginBottom: 10 }}
        >
          Cancelar orden
        </Button>
      )}
      <Button variant="secondary" size="md" fullWidth onClick={onClose}>
        Cerrar
      </Button>
    </Modal>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onTap }: { order: Order; onTap: () => void }) {
  const cfg = STATUS_CFG[order.status];
  const subtotal = (order.items ?? []).reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const time = new Date(order.createdAt).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card hoverable onClick={onTap} style={{ marginBottom: 10 }}>
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 800,
                fontSize: "0.9375rem",
                color: "var(--text-primary)",
                margin: "0 0 4px",
              }}
            >
              #{order.folio.slice(-6)}
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <IconClock size={12} /> {time} · <IconUser size={12} /> {order.attendedBy ?? "Sin atender"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: cfg.bg,
                color: cfg.color,
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 999,
                marginBottom: 4,
              }}
            >
              <StatusDot color={cfg.color} /> {cfg.label}
            </span>
            <p
              style={{
                fontWeight: 900,
                color: "var(--color-primary)",
                fontSize: "0.9375rem",
                margin: 0,
              }}
            >
              ${subtotal.toLocaleString("es-MX")}
            </p>
          </div>
        </div>
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--text-secondary)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {order.items.map((i) => `${i.qty}× ${i.dishName}`).join(" · ")}
        </p>
      </div>
    </Card>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function AdminPedidosPage() {
  const { user, isLoading } = useAdminGuard();
  const toast = useToast();

  const {
    data: ordersData,
    loading: initLoading,
    error: ordersError,
    refetch,
  } = useFetchWithState<Order[]>("/orders/active", getActiveOrdersApi, 15000);

  const [filterStatus, setFilterStatus] = useState<OrderStatus | "todos">("todos");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [page, setPage] = useState(1);

  const orders = ordersData ?? [];

  const filtered = useMemo(() => {
    let list = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filterStatus !== "todos") list = list.filter((o) => o.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.folio.includes(q) ||
          (o.items ?? []).some((i) => (i.dishName || "").toLowerCase().includes(q)) ||
          (o.attendedBy ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filterStatus, search]);

  if (isLoading || !user || initLoading) {
    return (
      <div className={ui.spinnerPage}>
        <div className={ui.spinner} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const changeStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusApi(id, newStatus);
      refetch();
      toast.success(`Orden → ${STATUS_CFG[newStatus].label}`);
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || "Error desconocido";
      toast.error(`Error: ${msg}`);
      console.error("Order update failed:", e);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      await cancelOrderApi(id);
      refetch();
      toast.success("Orden cancelada");
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || "Error desconocido";
      toast.error(`Error: ${msg}`);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPIs
  const kpis = (["nuevo", "en_preparacion", "listo", "entregado"] as OrderStatus[]).map(
    (s) => ({ status: s, count: orders.filter((o) => o.status === s).length })
  );

  return (
    <AdminLayout
      title="Pedidos"
      subtitle={
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconClipboard size={14} /> {orders.length} pedidos · {orders.filter(o => o.status !== "entregado" && o.status !== "cancelado").length} activos
        </div>
      }
    >
      {/* KPIs */}
      <div className={`${ui.grid} ${ui.cols4}`}>
        {kpis.map(({ status, count }) => {
          const cfg = STATUS_CFG[status];
          return (
            <div key={status} className={ui.kpi}>
              <p className={ui.kpiValue} style={{ color: cfg.color }}>
                {count}
              </p>
              <p className={ui.kpiLabel}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Búsqueda */}
      <div className={ui.searchBar}>
        <IconSearch size={18} color="var(--text-muted)" style={{ marginLeft: 12 }} />
        <input
          className={ui.searchInput}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por folio, platillo o mesero..."
        />
      </div>

      {/* Filtros */}
      <div className={ui.filterRow}>
        <button
          className={`${ui.chip} ${filterStatus === "todos" ? ui.active : ""}`}
          onClick={() => {
            setFilterStatus("todos");
            setPage(1);
          }}
        >
          Todos
        </button>
        {(Object.keys(STATUS_CFG) as OrderStatus[]).map((s) => (
          <button
            key={s}
            className={`${ui.chip} ${filterStatus === s ? ui.active : ""}`}
            onClick={() => {
              setFilterStatus(s);
              setPage(1);
            }}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <StatusDot color={STATUS_CFG[s].color} /> {STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {paginated.length === 0 ? (
        <div className={ui.emptyState}>
          <div style={{ color: "var(--text-muted)", marginBottom: 12 }}>
            <IconClipboard size={48} />
          </div>
          <p className={ui.emptyText}>No hay pedidos para mostrar</p>
        </div>
      ) : (
        paginated.map((order) => (
          <OrderCard key={order.id} order={order} onTap={() => setSelected(order)} />
        ))
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <IconArrowLeft size={16} /> Ant
          </Button>
          <span
            style={{
              padding: "0 12px",
              lineHeight: "32px",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
            }}
          >
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            Sig <IconChevronRight size={16} />
          </Button>
        </div>
      )}

      <div style={{ height: 24 }} />

      {/* Modal detalle */}
      <OrderDetailModal
        order={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onAdvance={changeStatus}
        onCancel={cancelOrder}
      />
    </AdminLayout>
  );
}