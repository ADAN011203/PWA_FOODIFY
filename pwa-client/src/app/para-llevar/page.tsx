"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useTheme } from "@/context/ThemeContext";
import { PageHeader } from "@/components/layout/TabBar";
import { fetchPublicMenu, RESTAURANT_SLUG } from "@/lib/menuApi";
import { createPublicOrderApi } from "@/lib/ordersApi";
import { useGuestOrders } from "@/lib/useGuestOrders";
import { 
  IconSearch, 
  IconGrid, 
  IconList, 
  IconBag, 
  IconClock, 
  IconAlertCircle,
  IconCheck,
  IconUtensils,
  IconTag,
  IconSmartphone,
  IconMapPin,
  IconChevronRight,
} from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";
import { MenuSkeleton } from "@/components/ui/Skeletons";
import type { PublicMenu, Dish, Category, CartItem } from "@/types/menu";
import { useSearchParams } from "next/navigation";
import { getRestaurantDetailsApi } from "@/lib/restaurantApi";

// CSS Module
import s from "./para-llevar.module.css";

// Components
import DishModal from "./components/DishModal";
import CartModal from "./components/CartModal";

function ParaLlevarContent() {
  const { dark } = useTheme();
  const { addOrder } = useGuestOrders();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const urlSlug = searchParams.get("slug");

  // State
  const [data, setData] = useState<{
    menus: PublicMenu[];
    restaurant: { id: number; name: string; logoUrl?: string; isOpen: boolean };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeCatId, setActiveCatId] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [orderDone, setOrderDone] = useState(false);

  // Load Data
  useEffect(() => {
    async function load() {
      // Esperar a que cargue la sesión si no hay slug en URL
      if (authLoading && !urlSlug) return;

      try {
        // Si hay una sesión cargada pero aún no tiene slug, esperamos un momento a que AuthContext la resuelva
        if (user && !user.slug && !urlSlug) {
          console.log("[ParaLlevar] Auth exists but no slug yet. Waiting for resolution...");
          return; 
        }

        let slugToUse = urlSlug || user?.slug || RESTAURANT_SLUG;
        console.log(`[ParaLlevar] Resolving slug. URL: "${urlSlug}", User: "${user?.slug}", Fallback: "${RESTAURANT_SLUG}" -> Final: "${slugToUse}"`);

        // Si el usuario está logueado pero no tiene slug persistida, intentamos resolverla
        if (!urlSlug && !user?.slug && user?.restaurantId) {
          console.log(`[ParaLlevar] Missing slug for authenticated user, attempting dynamic lookup for restaurantId: ${user.restaurantId}`);
          try {
            const rest = await getRestaurantDetailsApi(user.restaurantId);
            if (rest.slug) slugToUse = rest.slug;
          } catch (e) {
            console.warn("Could not fetch restaurant slug, using fallback.");
          }
        }

        const res = await fetchPublicMenu(slugToUse, "takeout");
        setData(res);
        if (res.menus.length > 0) {
          const firstActive = res.menus.find(m => m.isActiveNow) || res.menus[0];
          setActiveMenuId(firstActive.id);
        }
      } catch (err) {
        console.error("Error loading menu:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [urlSlug, user?.restaurantId, user?.slug, authLoading]);

  // Derived State
  const activeMenu = useMemo(() => 
    data?.menus.find(m => m.id === activeMenuId) || null
  , [data, activeMenuId]);

  const filteredCategories = useMemo(() => {
    if (!activeMenu) return [];
    if (activeCatId === "todos") return activeMenu.categories;
    return activeMenu.categories.filter(c => c.id === activeCatId);
  }, [activeMenu, activeCatId]);

  const itemsToShow = useMemo(() => {
    const dishes: Dish[] = [];
    filteredCategories.forEach(cat => {
      cat.dishes?.forEach(d => {
        if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return;
        dishes.push(d);
      });
    });
    return dishes;
  }, [filteredCategories, search]);

  // Cart Handlers
  const addToCart = (dish: Dish, qty: number) => {
    setCart((prev) => {
      const idx = prev.findIndex(i => i.dish.id === dish.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += qty;
        return next;
      }
      return [...prev, { dish, qty }];
    });
    setSelectedDish(null);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => 
      i.dish.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    ));
  };

  const handleOrder = async (customerName: string) => {
    if (!data) return;
    try {
      const orderData = {
        restaurantId: data.restaurant.id,
        items: cart.map(i => ({ dishId: Number(i.dish.id), quantity: i.qty })),
        customerName,
        mode: "takeout" as const,
      };
      const res = await createPublicOrderApi(orderData);
      
      // Guardar en local para rastreo
      addOrder({
        id: String(res.id),
        folio: res.folio,
        status: "nuevo",
        createdAt: new Date().toISOString(),
        items: cart.map(i => ({
          dishId: i.dish.id,
          dishName: i.dish.name,
          qty: i.qty,
          unitPrice: i.dish.price
        }))
      });

      setCart([]);
      setShowCart(false);
      setOrderDone(true);
      setTimeout(() => setOrderDone(false), 3000);
    } catch (err) {
      alert("Error al crear la orden. Inténtalo de nuevo.");
    }
  };

  if (loading) return <MenuSkeleton />;
  if (!data) return <div className={s.container}>Error al cargar el menú.</div>;

  return (
    <div className={`${s.container} ${dark ? "dark" : ""}`}>
      {/* ─── Hero Header ─── */}
      <div className={s.hero}>
        <div className={s.heroOverlay} />
        <div className={s.heroContent}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
            <div>
              <span className={s.brandBadge}>PREMIUM</span>
              <h1 className={s.heroTitle}>{data.restaurant.name}</h1>
              <div className={s.statusPill}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: data.restaurant.isOpen ? "#4ade80" : "#fb7185" }} />
                {data.restaurant.isOpen ? "Abierto ahora" : "Cerrado"}
              </div>
            </div>
            <button onClick={() => window.location.href = "/login"} style={{
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)", width: 40, height: 40,
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}>
              <IconSmartphone size={18} color="white" />
            </button>
          </div>
          
          <div className={s.heroFooter}>
            <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.9, display: "flex", alignItems: "center", gap: 4 }}>
              <IconMapPin size={12} /> Centro Histórico, CDMX
            </p>
          </div>
        </div>
      </div>

      <main className={s.mainContent}>
        {/* Menus Tabs (Filter Pills) */}
        {data.menus.length > 1 && (
          <div className={s.chipRow}>
            {data.menus.map(m => (
              <button
                key={m.id}
                className={`${s.chip} ${activeMenuId === m.id ? s.chipActive : s.chipInactive}`}
                onClick={() => {
                  setActiveMenuId(m.id);
                  setActiveCatId("todos");
                }}
              >
                {m.name}
                {!m.isActiveNow && <IconClock size={12} style={{ marginLeft: 6 }} />}
              </button>
            ))}
          </div>
        )}

        {/* Menu Info Banner */}
        {activeMenu && !activeMenu.isActiveNow && (
          <div className={`${s.statusBanner} ${s.statusBannerClosed}`}>
            <IconClock size={18} />
            <span>{activeMenu.availabilityNote || "Este menú no está disponible por ahora"}</span>
          </div>
        )}

        {/* Category Tabs (Icon Chips) */}
        {activeMenu && (
          <div className={s.chipRow}>
            <button
              className={`${s.chip} ${activeCatId === "todos" ? s.chipActive : s.chipInactive}`}
              onClick={() => setActiveCatId("todos")}
            >
              <IconGrid size={14} /> Todos
            </button>
            {activeMenu.categories.map(c => (
              <button
                key={c.id}
                className={`${s.chip} ${activeCatId === c.id ? s.chipActive : s.chipInactive}`}
                onClick={() => setActiveCatId(c.id)}
              >
                <IconTag size={14} /> {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Search & View Toggle */}
        <div className={s.controls}>
          <div className={s.searchWrapper}>
            <IconSearch size={18} color={dark ? "#6b7280" : "#9B7B6B"} />
            <input 
              className={s.searchInput}
              placeholder="Buscar platillos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            className={`${s.viewToggle} ${viewMode === "grid" ? s.viewToggleActive : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <IconGrid size={20} />
          </button>
          <button 
            className={`${s.viewToggle} ${viewMode === "list" ? s.viewToggleActive : ""}`}
            onClick={() => setViewMode("list")}
          >
            <IconList size={20} />
          </button>
        </div>

        {/* Dishes Grid/List */}
        <div className={viewMode === "grid" ? s.dishGrid : s.dishList}>
          {itemsToShow.map(dish => (
            <div 
              key={dish.id} 
              className={`${s.card} ${viewMode === "list" ? s.cardList : ""} anim-fade-up`}
              onClick={() => setSelectedDish(dish)}
            >
              <div className={`${s.imageWrapper} ${viewMode === "list" ? s.imageList : ""}`}>
                {dish.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dish.imageUrl} alt={dish.name} className={s.dishImage} />
                ) : (
                  <div style={{ color: dark ? "#333" : "#e5e7eb" }}>
                    <IconUtensils size={40} />
                  </div>
                )}
                
                {dish.badge && <span className={s.badge} style={{ background: "#FF6B35" }}>{dish.badge}</span>}
                
                {!dish.isAvailable && (
                  <div className={s.soldOutOverlay}>
                    <span className={s.soldOutLabel}>AGOTADO</span>
                  </div>
                )}
              </div>

              <div className={s.cardInfo}>
                <h3 className={s.dishName}>{dish.name}</h3>
                <p className={s.price}>${dish.price}</p>
                {viewMode === "list" && <p style={{ fontSize: "0.8rem", color: dark ? "#6b7280" : "#9B7B6B" }}>{dish.description}</p>}
              </div>
            </div>
          ))}
        </div>

        {itemsToShow.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: dark ? "#6b7280" : "#9B7B6B" }}>
            <div style={{ marginBottom: 16, opacity: 0.5 }}>
              <IconAlertCircle size={48} />
            </div>
            <p>No se encontraron platillos en esta sección.</p>
          </div>
        )}
      </main>

      {/* Floating Cart Bar (Modern Bottom Bar) */}
      {cart.length > 0 && !showCart && (
        <div className={s.bottomBar} onClick={() => setShowCart(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className={s.cartCount}>{cart.length}</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 800 }}>Ver Carrito</span>
              <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                {cart.reduce((s, i) => s + i.qty, 0)} items · ${cart.reduce((s, i) => s + i.dish.price * i.qty, 0)}
              </span>
            </div>
          </div>
          <IconChevronRight size={20} />
        </div>
      )}

      {/* Modals */}
      {selectedDish && (
        <DishModal 
          dish={selectedDish} 
          onClose={() => setSelectedDish(null)} 
          onAdd={addToCart}
          dark={dark}
        />
      )}

      {showCart && (
        <CartModal
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQty={updateQty}
          onRemove={(id) => setCart(p => p.filter(i => i.dish.id !== id))}
          onOrder={handleOrder}
          dark={dark}
        />
      )}

      {/* Success Toast */}
      {orderDone && (
        <div style={{
          position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
          background: "#22c55e", color: "white", padding: "12px 24px", borderRadius: 999,
          fontWeight: 700, zIndex: 1000, boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <IconCheck size={18} /> ¡Orden realizada con éxito!
        </div>
      )}
    </div>
  );
}

export default function ParaLlevarPage() {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <ParaLlevarContent />
    </Suspense>
  );
}
