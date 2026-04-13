"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Star, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2,
  ChevronRight,
  Info
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPublicMenu, RESTAURANT_SLUG } from "@/lib/menuApi";
import { createPublicOrderApi } from "@/lib/ordersApi";
import { useGuestOrders } from "@/lib/useGuestOrders";
import { MenuSkeleton } from "@/components/ui/Skeletons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PublicMenu, Dish, CartItem } from "@/types/menu";
import toast from "react-hot-toast";

// ─── COMPONENTES INTERNOS ───────────────────────────────────────────────────

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [modalQty, setModalQty] = useState(1);

  // Reset modal quantity when opening a new dish
  useEffect(() => {
    if (selectedDish) setModalQty(1);
  }, [selectedDish]);

  // Load Data
  useEffect(() => {
    async function load() {
      if (authLoading && !urlSlug) return;
      try {
        const slugToUse = urlSlug || user?.slug || RESTAURANT_SLUG;
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
  }, [urlSlug, user?.slug, authLoading]);

  // Derived State
  const activeMenu = useMemo(() => 
    data?.menus.find(m => m.id === activeMenuId) || null
  , [data, activeMenuId]);

  const dishes = useMemo(() => {
    if (!activeMenu) return [];
    let items: Dish[] = [];
    activeMenu.categories.forEach(cat => {
      if (activeCatId !== "todos" && cat.id !== activeCatId) return;
      cat.dishes?.forEach(d => {
        if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return;
        items.push(d);
      });
    });
    return items;
  }, [activeMenu, activeCatId, search]);

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
    toast.success(`${dish.name} agregado`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => 
      i.dish.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.dish.id !== id));
    toast.error("Producto eliminado");
  };
  const handleCreateOrder = async (name: string) => {
    if (!data || cart.length === 0) return;
    try {
      const res = await createPublicOrderApi({
        restaurantId: data.restaurant.id,
        items: cart.map(i => ({ dishId: Number(i.dish.id), quantity: i.qty })),
        customerName: name,
      });
      
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
      toast.custom((t) => (
        <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-6 h-6" />
          <div className="flex flex-col">
            <span className="font-black">¡Pedido enviado!</span>
            <span className="text-xs opacity-90">Sigue tu orden con el folio #{res.folio}</span>
          </div>
        </div>
      ), { duration: 5000 });
    } catch {
      toast.error("Error al crear el pedido");
    }
  };

  if (loading) return <MenuSkeleton />;
  if (!data) return <div className="p-12 text-center font-bold">Sin conexión con el restaurante.</div>;

  const cartTotal = cart.reduce((acc, i) => acc + (i.dish.price * i.qty), 0);

  return (
    <div className={cn(
      "min-h-screen pb-24 transition-colors",
      dark ? "bg-zinc-950 text-white" : "bg-gray-50 text-zinc-900"
    )}>
      {/* ─── HERO HEADER ─── */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-foodify-orange" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black tracking-widest text-white uppercase border border-white/20">
              Premium Takeout
            </span>
            {data.restaurant.isOpen ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Abierto
              </span>
            ) : (
              <span className="text-[10px] font-bold text-red-400 uppercase">Cerrado</span>
            )}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
            {data.restaurant.name}
          </h1>
          <div className="flex items-center gap-4 text-white/70 text-xs">
             <span className="flex items-center gap-1"><Star className="w-3 h-3 text-foodify-orange fill-foodify-orange" /> 4.9 (500+)</span>
             <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 25-35 min</span>
             <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 2.1 km</span>
          </div>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-6 mt-8 space-y-8">
        {/* BUSCADOR GLASSMORPHISM */}
        <div className="sticky top-4 z-40">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-foodify-orange transition-colors" />
            <input 
              type="text"
              placeholder="¿Qué se te antoja hoy?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full pl-12 pr-6 py-4 rounded-2xl border-none outline-none text-sm font-bold shadow-xl shadow-black/5 transition-all",
                dark ? "bg-white/10 backdrop-blur-xl focus:bg-white/20" : "bg-white focus:ring-1 focus:ring-foodify-orange"
              )}
            />
          </div>
        </div>

        {/* CATEGORIAS HORIZONTAL */}
        {activeMenu && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-6 px-6">
            <button
               onClick={() => setActiveCatId("todos")}
               className={cn(
                 "whitespace-nowrap px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                 activeCatId === "todos" 
                   ? "bg-foodify-orange text-white shadow-lg shadow-foodify-orange/20" 
                   : (dark ? "bg-white/5 text-gray-400" : "bg-white text-gray-500 border")
               )}
            >
              Todos
            </button>
            {activeMenu.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(cat.id)}
                className={cn(
                  "whitespace-nowrap px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                  activeCatId === cat.id 
                    ? "bg-foodify-orange text-white shadow-lg shadow-foodify-orange/20" 
                    : (dark ? "bg-white/5 text-gray-400" : "bg-white text-gray-500 border")
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* GRID DE DISHES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {dishes.map((dish) => (
            <div 
              key={dish.id}
              onClick={() => setSelectedDish(dish)}
              className={cn(
                "group relative overflow-hidden rounded-[2rem] border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                dark ? "bg-zinc-900/50 border-white/5" : "bg-white border-gray-100 shadow-sm"
              )}
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                {dish.imageUrl ? (
                  <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className={cn("w-full h-full flex items-center justify-center", dark ? "bg-white/5" : "bg-gray-50")}>
                    <ShoppingBag className="w-12 h-12 text-gray-200" />
                  </div>
                )}
                {dish.badge && (
                  <span className="absolute top-4 left-4 bg-foodify-orange text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                    {dish.badge}
                  </span>
                )}
                {!dish.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white font-black uppercase tracking-widest text-sm border-2 border-white px-4 py-2">
                       Agotado
                    </span>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="bg-foodify-orange text-white p-3 rounded-2xl shadow-xl">
                      <Plus className="w-5 h-5" />
                    </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-lg leading-tight group-hover:text-foodify-orange transition-colors">{dish.name}</h3>
                  <span className="text-lg font-black text-foodify-orange">${dish.price}</span>
                </div>
                <p className={cn("text-xs line-clamp-2", dark ? "text-gray-400" : "text-gray-500")}>
                  {dish.description || "Un platillo preparado con los mejores ingredientes de la casa."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FLOATING CART BAR (GLASSMORPHISM) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-50">
          <div 
            onClick={() => setShowCart(true)}
            className="max-w-screen-md mx-auto bg-foodify-orange text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-4">
               <div className="bg-white/20 p-3 rounded-2xl relative">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-white text-foodify-orange w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
                    {cart.reduce((s, i) => s + i.qty, 0)}
                  </span>
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tight">Ver Carrito</span>
                  <span className="text-[10px] uppercase font-black tracking-widest opacity-80">Total: ${cartTotal}</span>
               </div>
            </div>
            <ChevronRight className="w-6 h-6 opacity-70" />
          </div>
        </div>
      )}

      {/* DISH DETAIL MODAL */}
      {selectedDish && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedDish(null)} />
           <div className={cn(
             "relative w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom duration-300",
             dark ? "bg-zinc-900" : "bg-white"
           )}>
             <button onClick={() => setSelectedDish(null)} className="absolute top-6 right-6 z-10 p-2 bg-black/20 rounded-full text-white backdrop-blur-md">
                <X className="w-5 h-5" />
             </button>
             
             <div className="h-64 sm:h-80 relative">
               {selectedDish.imageUrl ? (
                 <img src={selectedDish.imageUrl} alt={selectedDish.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-foodify-orange/10 flex items-center justify-center text-foodify-orange">
                   <ShoppingBag className="w-20 h-20 opacity-20" />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
               <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-black text-white">{selectedDish.name}</h2>
                  <span className="text-foodify-orange font-black text-xl">${selectedDish.price}</span>
               </div>
             </div>

             <div className="p-8 space-y-6">
               <div className="space-y-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Descripción</h4>
                 <p className={cn("text-sm", dark ? "text-gray-400" : "text-gray-500")}>
                   {selectedDish.description || "Disfruta de nuestra receta especial preparada al momento."}
                 </p>
               </div>

               <div className="flex items-center justify-between pt-6">
                  <div className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 p-2 rounded-2xl">
                    <button 
                      onClick={() => setModalQty(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-white/10 rounded-xl shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black w-8 text-center text-lg">{modalQty}</span>
                    <button 
                      onClick={() => setModalQty(prev => prev + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-foodify-orange text-white rounded-xl shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button 
                    onClick={() => addToCart(selectedDish, modalQty)}
                    className="flex-1 ml-6 h-14 bg-foodify-orange text-white font-black text-lg rounded-2xl shadow-xl shadow-foodify-orange/30"
                  >
                    Agregar a la orden
                  </Button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* CART MODAL */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCart(false)} />
          <div className={cn(
            "relative w-full max-w-lg h-[80vh] sm:h-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col animate-in slide-in-from-bottom duration-400",
            dark ? "bg-zinc-900" : "bg-white"
          )}>
            <div className="p-8 border-b dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black tracking-tight">Tu Carrito</h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <p className="text-xs text-text-secondary uppercase tracking-widest font-black">Sabor artesanal directo a tu casa</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={item.dish.imageUrl || ""} alt={item.dish.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h5 className="font-black text-sm">{item.dish.name}</h5>
                      <span className="font-black text-foodify-orange text-sm">${(item.dish.price * item.qty).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                       <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-xl">
                          <button onClick={() => updateQty(item.dish.id, -1)} className="p-1"><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.dish.id, 1)} className="p-1"><Plus className="w-3 h-3" /></button>
                       </div>
                       <button 
                         onClick={() => removeFromCart(item.dish.id)}
                         className="text-[10px] font-black text-red-500 uppercase tracking-widest"
                       >
                         Eliminar
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 space-y-4 bg-gray-50 dark:bg-white/20">
              <div className="flex justify-between items-center text-lg font-black tracking-tight">
                <span>Total a pagar</span>
                <span className="text-foodify-orange">${cartTotal}</span>
              </div>
              <Button 
                onClick={() => handleCreateOrder("Cliente Foodify")}
                className="w-full h-16 bg-foodify-orange text-white font-black text-xl rounded-2xl shadow-2xl shadow-foodify-orange/40"
              >
                Completar Pedido
              </Button>
            </div>
          </div>
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
