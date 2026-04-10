"use client";
import { MenuSkeleton } from "@/components/ui/Skeletons";

import { useState, useMemo, useEffect } from "react";
import { useGuestOrders } from "@/lib/useGuestOrders";
import { useTheme } from "@/context/ThemeContext";
import { PageHeader } from "@/components/layout/TabBar";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { ErrorAlert } from "@/components/ErrorAlert";
import { EmptyState } from "@/components/EmptyState";
import { fetchPublicMenu, RESTAURANT_SLUG } from "@/lib/menuApi";
import { createPublicOrderApi } from "@/lib/ordersApi";
import type { Dish, CartItem } from "@/types/menu";
import {
  IconBag, IconSearch, IconFilter,
  IconGrid, IconList, IconTrash, IconX,
} from "@/components/ui/Icons";

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Detalle de platillo
// ─────────────────────────────────────────────────────────────────────────────
function DishModal({
  dish,
  onClose,
  onAdd,
  dark,
}: {
  dish: Dish;
  onClose: () => void;
  onAdd: (dish: Dish, qty: number) => void;
  dark: boolean;
}) {
  const [qty, setQty] = useState(1);

  const bg     = dark ? "#1e1e1e" : "#ffffff";
  const text   = dark ? "#f0ede8" : "#1a1a1a";
  const mutedC = dark ? "#6b7280" : "#6b7280";
  const chipBg = dark ? "#2e2e2e" : "#f3f4f6";
  const catName = categories.find((c) => c.id === dish.categoryId)?.name ?? "Platillo";

  return (
    <div
      className="anim-fade-in"
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="anim-slide-up"
        style={{
          background: bg,
          borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 480,
          maxHeight: "92vh", overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen hero */}
        <div style={{ position: "relative", height: 220, background: "#F3E5D5", overflow: "hidden" }}>
          {dish.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dish.imageUrl}
              alt={dish.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "5rem" }}>
              {dish.emoji ?? "🍽️"}
            </div>
          )}
          {/* botón cerrar arriba */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 12, right: 12,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <IconX size={14} color="white" />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: "20px 24px 40px" }}>
          {/* Nombre + precio */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: text, marginBottom: 6 }}>
                {dish.name}
              </h2>
              <span style={{
                background: chipBg, color: mutedC,
                fontSize: "0.75rem", padding: "3px 12px",
                borderRadius: 999, fontWeight: 600,
              }}>
                {catName}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "#FF6B35" }}>${dish.price}</p>
              {dish.isAvailable && (
                <p style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600 }}>● Disponible</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <p style={{ color: mutedC, fontSize: "0.9375rem", lineHeight: 1.6, margin: "14px 0 24px" }}>
            {dish.description}
          </p>

          {/* Cantidad */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <span style={{ color: text, fontWeight: 600, fontSize: "0.9375rem" }}>Cantidad:</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: chipBg, border: "none", cursor: "pointer",
                  fontSize: "1.25rem", color: text,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >−</button>
              <span style={{ fontSize: "1.125rem", fontWeight: 700, color: text, minWidth: 20, textAlign: "center" }}>
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: chipBg, border: "none", cursor: "pointer",
                  fontSize: "1.25rem", color: text,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
            </div>
          </div>

          {/* CTAs */}
          <button
            onClick={() => { onAdd(dish, qty); onClose(); }}
            style={{
              width: "100%", background: "#FF6B35", color: "white",
              border: "none", padding: "16px", borderRadius: 16,
              fontSize: "1rem", fontWeight: 700, cursor: "pointer", marginBottom: 12,
            }}
          >
            Agregar al Carrito — ${dish.price * qty}
          </button>
          <button
            onClick={onClose}
            style={{
              width: "100%", background: chipBg, color: text,
              border: "none", padding: "14px", borderRadius: 16,
              fontSize: "1rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: Carrito
// ─────────────────────────────────────────────────────────────────────────────
function CartModal({
  cart,
  onClose,
  onUpdateQty,
  onDelete,
  onOrder,
  dark,
}: {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
  onOrder: () => void;
  dark: boolean;
}) {
  const total  = cart.reduce((s, i) => s + i.dish.price * i.qty, 0);
  const bg     = dark ? "#1e1e1e" : "#ffffff";
  const text   = dark ? "#f0ede8" : "#1a1a1a";
  const mutedC = dark ? "#6b7280" : "#6b7280";
  const chipBg = dark ? "#2a2a2a" : "#f9f9f9";
  const btnBg  = dark ? "#2e2e2e" : "#e5e7eb";

  return (
    <div
      className="anim-fade-in"
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="anim-fade-up"
        style={{
          background: bg, borderRadius: 24,
          width: "100%", maxWidth: 440,
          maxHeight: "80vh", overflowY: "auto",
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconBag size={22} color="#FF6B35" />
            <div>
              <p style={{ fontWeight: 800, color: text, fontSize: "1.125rem" }}>Carrito</p>
              <p style={{ fontSize: "0.8rem", color: mutedC }}>
                {cart.length} producto{cart.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: mutedC, fontSize: "1.5rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Vacío */}
        {cart.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <IconBag size={56} color="#d1d5db" />
            <p style={{ color: mutedC, marginTop: 12 }}>Tu carrito está vacío</p>
          </div>
        )}

        {/* Items */}
        {cart.map((item) => (
          <div key={item.dish.id} style={{ background: chipBg, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {/* thumbnail */}
              <div style={{
                width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                background: "#F3E5D5", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
              }}>
                {item.dish.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.dish.imageUrl} alt={item.dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span>{item.dish.emoji ?? "🍽️"}</span>}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontWeight: 700, color: text, fontSize: "0.9375rem" }}>{item.dish.name}</p>
                  <button onClick={() => onDelete(item.dish.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <IconTrash size={16} color="#ef4444" />
                  </button>
                </div>
                <p style={{ color: "#FF6B35", fontWeight: 600, fontSize: "0.875rem", marginTop: 2 }}>
                  ${item.dish.price}
                </p>
                {/* stepper */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <button
                    onClick={() => onUpdateQty(item.dish.id, -1)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: btnBg, border: "none", cursor: "pointer",
                      color: text, fontWeight: 700, fontSize: "1rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >−</button>
                  <span style={{ fontWeight: 700, color: text }}>{item.qty}</span>
                  <button
                    onClick={() => onUpdateQty(item.dish.id, 1)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: btnBg, border: "none", cursor: "pointer",
                      color: text, fontWeight: 700, fontSize: "1rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Total + CTA */}
        {cart.length > 0 && (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0",
              borderTop: `1px solid ${dark ? "#2e2e2e" : "#e5e7eb"}`,
              marginTop: 4,
            }}>
              <span style={{ fontWeight: 600, color: text }}>Total:</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#FF6B35" }}>${total}</span>
            </div>
            <button
              onClick={onOrder}
              style={{
                width: "100%", background: "#FF6B35", color: "white",
                border: "none", padding: "16px", borderRadius: 16,
                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
              }}
            >
              Realizar Orden
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA: vista lista (móvil)
// ─────────────────────────────────────────────────────────────────────────────
function CardList({ dish, onTap, dark }: { dish: Dish; onTap: () => void; dark: boolean }) {
  const bg     = dark ? "#1e1e1e" : "#ffffff";
  const text   = dark ? "#f0ede8" : "#1a1a1a";
  const mutedC = dark ? "#6b7280" : "#9B7B6B";
  const chipBg = dark ? "#2e2e2e" : "#f3f4f6";
  const catName = categories.find((c) => c.id === dish.categoryId)?.name ?? "";

  return (
    <div
      onClick={onTap}
      style={{
        background: bg, borderRadius: 16, padding: 16,
        display: "flex", gap: 14, cursor: "pointer",
        opacity: dish.isAvailable ? 1 : 0.55,
        boxShadow: dark ? "none" : "0 1px 8px rgba(44,24,16,0.06)",
        marginBottom: 12,
      }}
    >
      {/* thumbnail */}
      <div style={{
        width: 100, height: 80, borderRadius: 12, flexShrink: 0,
        background: "#F3E5D5", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem",
      }}>
        {dish.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={dish.imageUrl} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span>{dish.emoji ?? "🍽️"}</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <p style={{ fontWeight: 700, color: text, fontSize: "1rem", marginBottom: 4 }}>{dish.name}</p>
          <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>
            ● {dish.isAvailable ? "Disponible" : "Agotado"}
          </span>
        </div>
        <p style={{
          fontSize: "0.8125rem", color: mutedC, lineHeight: 1.45, marginBottom: 8,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {dish.description}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#FF6B35" }}>${dish.price}</span>
          <span style={{ background: chipBg, color: mutedC, fontSize: "0.7rem", padding: "2px 10px", borderRadius: 999, fontWeight: 600 }}>
            {catName}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA: vista grid (tablet+)
// ─────────────────────────────────────────────────────────────────────────────
function CardGrid({ dish, onTap, dark }: { dish: Dish; onTap: () => void; dark: boolean }) {
  const bg     = dark ? "#1e1e1e" : "#ffffff";
  const text   = dark ? "#f0ede8" : "#1a1a1a";
  const mutedC = dark ? "#6b7280" : "#9B7B6B";
  const chipBg = dark ? "#2e2e2e" : "#f3f4f6";
  const catName = categories.find((c) => c.id === dish.categoryId)?.name ?? "";

  return (
    <div
      onClick={onTap}
      style={{
        background: bg, borderRadius: 16, overflow: "hidden", cursor: "pointer",
        opacity: dish.isAvailable ? 1 : 0.55,
        boxShadow: dark ? "none" : "0 1px 8px rgba(44,24,16,0.06)",
      }}
    >
      {/* imagen */}
      <div style={{
        height: 140, background: "#F3E5D5", overflow: "hidden", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem",
      }}>
        {dish.imageUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={dish.imageUrl} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span>{dish.emoji ?? "🍽️"}</span>}
        <span style={{
          position: "absolute", top: 8, right: 8,
          background: "rgba(0,0,0,0.6)", color: "#22c55e",
          fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
        }}>
          ● {dish.isAvailable ? "Disponible" : "Agotado"}
        </span>
      </div>

      <div style={{ padding: 12 }}>
        <p style={{ fontWeight: 700, color: text, fontSize: "0.9375rem", marginBottom: 4 }}>{dish.name}</p>
        <p style={{
          fontSize: "0.75rem", color: mutedC, marginBottom: 8,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {dish.description}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, color: "#FF6B35" }}>${dish.price}</span>
          <span style={{ background: chipBg, color: mutedC, fontSize: "0.65rem", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
            {catName}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function ParaLlevarPage() {
  const { dark } = useTheme();

  // T41 — Skeleton: mostrar skeleton hasta que el componente hidrate en cliente
  const [mounted] = useState(true);

  // States y hooks primero
  const [activeCat, setActiveCat]     = useState("todos");
  const [search, setSearch]           = useState("");
  const [viewMode, setViewMode]       = useState<"grid" | "list">("grid");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showCart, setShowCart]       = useState(false);
  const [cart, setCart]               = useState<CartItem[]>([]);
  const { addOrder } = useGuestOrders();
  const [orderDone, setOrderDone]     = useState(false);

  // Datos del menú desde el backend
  const { data: menuData, loading, error, empty, refetch } = useFetchWithState<{ dishes: Dish[]; categories: Category[] }>("/menu/demo-restaurant?mode=takeout");

  const dishes = menuData?.dishes ?? [];
  const categories = menuData?.categories ?? [];
  const restaurantId = 1; // placeholder if needed

  // Colores según tema
  const bg      = dark ? "#121212" : "#FFF0DC";
  const cardBg  = dark ? "#1a1a1a" : "#ffffff";
  const text    = dark ? "#f0ede8" : "#1a1a1a";
  const mutedC  = dark ? "#6b7280" : "#9B7B6B";
  const border  = dark ? "#2e2e2e" : "#e5e0d8";

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  // Categorías con "Todos" al inicio — debe ir ANTES del early return (Rules of Hooks)
  const cats = [{ id: "todos", name: "Todos", emoji: "" }, ...categories];

  // Platillos filtrados — useMemo siempre antes de cualquier early return
  const filteredDishes = useMemo(() => {
    let list = dishes;
    if (activeCat !== "todos") list = list.filter((d) => d.categoryId === activeCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    return list;
  }, [activeCat, search, dishes]);

  // Top 3 más vendidos para "Recomendaciones"
  const topDishes = [...dishes]
    .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
    .slice(0, 3);

  // T41 — Skeleton mientras hidrata (DESPUÉS de todos los hooks)
  if (!mounted) return <MenuSkeleton dark={dark} />;

  // Carrito: agregar
  const addToCart = (dish: Dish, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish.id === dish.id);
      if (existing) return prev.map((i) => i.dish.id === dish.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { dish, qty }];
    });
  };

  // Carrito: actualizar cantidad
  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.dish.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  // Carrito: realizar orden — guarda en backend y localStorage
  const handleOrder = async () => {
    try {
      // Intentar crear en backend (público, sin JWT)
      const backendOrder = await createPublicOrderApi({
        restaurantId,
        customerName: "Comensal",
        items: cart.map((item) => ({
          dishId:   Number(item.dish.id),
          quantity: item.qty,
        })),
      });
      // Guardar en localStorage para seguimiento local
      addOrder({
        id:        backendOrder.id,
        folio:     backendOrder.folio,
        status:    "nuevo",
        createdAt: backendOrder.createdAt,
        attendedBy: "—",
        branch:    "Restaurante",
        items: cart.map((item) => ({
          dishId:    item.dish.id,
          dishName:  item.dish.name,
          name:      item.dish.name,
          qty:       item.qty,
          unitPrice: item.dish.price,
        })),
      });
    } catch {
      // Si el backend falla, guardar solo en localStorage
      addOrder({
        id:        `ord-${Date.now()}`,
        folio:     String(Math.floor(Math.random() * 9000) + 1000),
        status:    "nuevo",
        createdAt: new Date().toISOString(),
        attendedBy: "—",
        branch:    "Restaurante",
        items: cart.map((item) => ({
          dishId:    item.dish.id,
          dishName:  item.dish.name,
          name:      item.dish.name,
          qty:       item.qty,
          unitPrice: item.dish.price,
        })),
      });
    }
    setShowCart(false);
    setCart([]);
    setOrderDone(true);
    setTimeout(() => setOrderDone(false), 3000);
  };

  return (
    <div style={{ background: bg, minHeight: "100dvh" }}>

      {/* ── Header ── */}
      <PageHeader
        title="Para Llevar"
        subtitle="Ordena y recoge en restaurante"
        right={
          <button
            onClick={() => setShowCart(true)}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#FF6B35", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}
          >
            <IconBag size={20} color="white" />
            {totalItems > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                background: "#22c55e", color: "white",
                width: 18, height: 18, borderRadius: "50%",
                fontSize: "0.6rem", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {totalItems}
              </span>
            )}
          </button>
        }
      />

      <div style={{ padding: "12px 16px 0" }}>

        {/* ── Card de categorías ── */}
        <div style={{ background: cardBg, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <IconFilter size={14} color={mutedC} />
            <span style={{ fontSize: "0.875rem", color: mutedC, fontWeight: 600 }}>Categorías</span>
          </div>
          <div className="scrollbar-hide" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {cats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                style={{
                  flexShrink: 0, padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: activeCat === cat.id ? "#FF6B35" : dark ? "#2e2e2e" : "#f3f4f6",
                  color:      activeCat === cat.id ? "white"    : mutedC,
                  fontWeight: activeCat === cat.id ? 700        : 500,
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Búsqueda + toggle vista ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{
            flex: 1, background: cardBg, borderRadius: 999,
            display: "flex", alignItems: "center", padding: "0 16px", gap: 8,
            border: `1px solid ${border}`,
          }}>
            <IconSearch size={16} color={mutedC} />
            <input
              type="text"
              placeholder="Buscar platillos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                color: text, fontSize: "0.9375rem", padding: "12px 0", fontFamily: "inherit",
              }}
            />
          </div>
          {/* Botón grid */}
          <button
            onClick={() => setViewMode("grid")}
            style={{
              width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
              background: viewMode === "grid" ? "#FF6B35" : cardBg,
              color:      viewMode === "grid" ? "white"   : mutedC,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <IconGrid size={18} color={viewMode === "grid" ? "white" : mutedC} />
          </button>
          {/* Botón lista */}
          <button
            onClick={() => setViewMode("list")}
            style={{
              width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
              background: viewMode === "list" ? "#FF6B35" : cardBg,
              color:      viewMode === "list" ? "white"   : mutedC,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <IconList size={18} color={viewMode === "list" ? "white" : mutedC} />
          </button>
        </div>

        {/* ── Recomendaciones (solo cuando no hay búsqueda y cat = todos) ── */}
        {!search && activeCat === "todos" && (
          <div style={{
            background: dark ? "#1a1a1a" : "#fff8f0",
            borderRadius: 16, padding: 16, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: "#FF6B35",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "1rem" }}>⭐</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, color: text, fontSize: "0.9375rem" }}>
                  Recomendaciones de la Casa ✨
                </p>
                <p style={{ fontSize: "0.75rem", color: mutedC }}>
                  Los platillos más populares y deliciosos
                </p>
              </div>
            </div>

            <div className="scrollbar-hide" style={{ display: "flex", gap: 12, overflowX: "auto" }}>
              {topDishes.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => setSelectedDish(dish)}
                  style={{
                    flexShrink: 0, width: 148, borderRadius: 14, overflow: "hidden", cursor: "pointer",
                    background: dark ? "#2a2a2a" : "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{
                    height: 96, background: "#F3E5D5", overflow: "hidden", position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem",
                  }}>
                    {dish.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={dish.imageUrl} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span>{dish.emoji ?? "🍽️"}</span>}
                    <div style={{ position: "absolute", bottom: 4, left: 4, display: "flex", gap: 3 }}>
                      <span style={{ background: "#22c55e", color: "white", fontSize: "0.58rem", fontWeight: 700, padding: "1px 6px", borderRadius: 999 }}>
                        ⭐ Popular
                      </span>
                      <span style={{ background: "#FF6B35", color: "white", fontSize: "0.58rem", fontWeight: 700, padding: "1px 6px", borderRadius: 999 }}>
                        📈 {dish.soldCount} vendidos
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ fontWeight: 700, color: text, fontSize: "0.8rem", marginBottom: 2 }}>{dish.name}</p>
                    <p style={{ color: "#FF6B35", fontWeight: 700, fontSize: "0.875rem" }}>${dish.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Platillos ── */}
        {filteredDishes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: mutedC }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🍽️</div>
            <p>No encontramos platillos</p>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filteredDishes.map((dish, i) => (
              <div key={dish.id} className="anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <CardGrid dish={dish} onTap={() => setSelectedDish(dish)} dark={dark} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {filteredDishes.map((dish, i) => (
              <div key={dish.id} className="anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <CardList dish={dish} onTap={() => setSelectedDish(dish)} dark={dark} />
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {/* ── Toast orden exitosa ── */}
      {orderDone && (
        <div
          className="anim-fade-up"
          style={{
            position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
            background: "#22c55e", color: "white",
            padding: "12px 24px", borderRadius: 999,
            fontWeight: 700, zIndex: 200,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
          }}
        >
          ✅ ¡Orden realizada con éxito!
        </div>
      )}

      {/* ── Modal platillo ── */}
      {selectedDish && (
        <DishModal
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
          onAdd={addToCart}
          dark={dark}
        />
      )}

      {/* ── Modal carrito ── */}
      {showCart && (
        <CartModal
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQty={updateQty}
          onDelete={(id) => setCart((p) => p.filter((i) => i.dish.id !== id))}
          onOrder={handleOrder}
          dark={dark}
        />
      )}
    </div>
  );
}

