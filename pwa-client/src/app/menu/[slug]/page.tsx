"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api, publicApi } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { 
  UtensilsCrossed, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  ChefHat, 
  Star, 
  Search,
  ChevronRight,
  Plus,
  Minus,
  Phone,
  Globe,
  Share2,
  MessageCircle
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

// Types based on the specification
interface Restaurant {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  hero_image: string;
  address: string;
  phone: string;
  description: string;
  business_hours: string;
}

interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  preparation_time_min: number;
  allergens: string[];
}

interface Category {
  id: number;
  name: string;
  icon: string;
  dishes: Dish[];
}

interface Menu {
  id: number;
  name: string;
  categories: Category[];
  is_active: boolean;
  schedule_active?: boolean;
}

export default function PublicMenuPage() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { items, addItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // En un escenario real, el endpoint sería algo como /public/restaurant/:slug
        const res = await api.get(`/public/menu/${slug}`);
        const { restaurant, menus } = res.data.data;
        
        setRestaurant(restaurant);
        setMenus(menus);
        if (menus.length > 0) {
          setActiveMenu(menus[0]);
          if (menus[0].categories.length > 0) {
            setActiveCategory(menus[0].categories[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
        toast.error("No se pudo cargar el menú");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const scrollToCategory = (id: number) => {
    setActiveCategory(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const offset = 120; // Sticky header height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-foodify-orange/20 rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-foodify-orange animate-spin" />
          </div>
          <p className="text-text-secondary font-medium">Cargando menú delicioso...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <div className="p-10 text-center">Restaurante no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-app pb-32">
      {/* SECTION 1 — HERO */}
      <section className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        <Image
          src={restaurant.hero_image || "/brand/hero-bg.png"}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col items-center md:items-start md:flex-row gap-6">
          <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-xl translate-y-12 md:translate-y-0">
             <Image 
                src={restaurant.logo_url || "/icons/icon-192x192.png"} 
                alt="Logo" 
                fill 
                className="object-contain"
             />
          </div>
          <div className="flex flex-col gap-1 text-white items-center md:items-start pt-12 md:pt-0">
            <h1 className="text-3xl md:text-4xl font-black drop-shadow-lg">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1.5 backdrop-blur-md bg-black/20 px-3 py-1 rounded-full">
                <MapPin className="w-4 h-4 text-foodify-orange" />
                {restaurant.address}
              </span>
              <span className="flex items-center gap-1.5 backdrop-blur-md bg-black/20 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 text-foodify-orange" />
                {restaurant.business_hours}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — MENU TABS (STIKCY) */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide flex gap-8">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => setActiveMenu(menu)}
              className={cn(
                "py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                activeMenu?.id === menu.id 
                  ? "border-foodify-orange text-foodify-orange" 
                  : "border-transparent text-text-secondary"
              )}
            >
              {menu.name}
              {!menu.is_active && <Clock className="inline ml-1 w-3 h-3 opacity-50" />}
            </button>
          ))}
        </div>

        {/* SECTION 3 — CATEGORY CHIPS */}
        <div className="bg-white px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-t">
          {activeMenu?.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all",
                activeCategory === cat.id
                  ? "bg-foodify-orange text-white shadow-md shadow-foodify-orange/20"
                  : "bg-gray-100 text-text-secondary hover:bg-gray-200"
              )}
            >
              {/* Aquí iría el mapeo de cat.icon a Lucide component */}
              <ChefHat className="w-4 h-4" />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4 — DISH GRID */}
      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-12">
        {activeMenu?.categories.map((cat) => (
          <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-32">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-foodify-orange rounded-full" />
              {cat.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.dishes.map((dish) => {
                const cartItem = items.find(i => i.id === dish.id);
                
                return (
                  <div 
                    key={dish.id} 
                    className={cn(
                      "bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex",
                      !dish.is_available && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div className="relative w-32 min-w-[128px] h-32 md:w-40 md:h-40 bg-foodify-orange-light flex items-center justify-center">
                      {dish.image_url ? (
                        <Image src={dish.image_url} alt={dish.name} fill className="object-cover" />
                      ) : (
                        <UtensilsCrossed className="w-10 h-10 text-foodify-orange opacity-40" />
                      )}
                      {!dish.is_available && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                           <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-red-600 px-2 py-0.5 rounded">
                              No disponible
                           </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-base md:text-lg mb-1 leading-tight">{dish.name}</h3>
                        <p className="text-text-secondary text-sm line-clamp-2 md:line-clamp-3 mb-2">{dish.description}</p>
                        <div className="flex items-center gap-4 text-[10px] md:text-xs text-text-secondary font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {dish.preparation_time_min} min
                          </span>
                          {dish.allergens.length > 0 && (
                             <span className="flex items-center gap-1">
                               <Star className="w-3 h-3" /> {dish.allergens[0]}
                             </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-black text-foodify-orange">
                          ${dish.price.toFixed(2)}
                        </span>
                        
                        {cartItem ? (
                          <div className="flex items-center gap-3 bg-gray-50 rounded-full border px-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(dish.id, cartItem.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-bold text-sm min-w-[1ch] text-center">
                              {cartItem.quantity}
                            </span>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(dish.id, cartItem.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            disabled={!dish.is_available}
                            onClick={() => addItem({ ...dish, quantity: 1 })}
                            className="rounded-full px-4 h-9 font-bold bg-foodify-orange text-white hover:bg-foodify-orange-dark active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Agregar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* SECTION 8 — CONTACTO */}
      <footer id="contacto" className="max-w-7xl mx-auto px-4 mt-20 pt-10 border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Info */}
          <div className="space-y-6">
            <Logo />
            <p className="text-text-secondary">{restaurant.description}</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-foodify-orange shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-text-primary">Dirección</p>
                  <p className="text-sm text-text-secondary">{restaurant.address}</p>
                </div>
              </div>
              
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 hover:text-foodify-orange transition-colors">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-foodify-orange shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-text-primary">Teléfono</p>
                    <p className="text-sm text-text-secondary">{restaurant.phone}</p>
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-foodify-orange shrink-0" />
                <div>
                  <p className="font-bold text-sm text-text-primary">Horario de atención</p>
                  <p className="text-sm text-text-secondary">{restaurant.business_hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social & Map */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Síguenos en redes</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-full gap-2 border-gray-200">
                <Globe className="w-4 h-4 text-gray-400" /> Instagram
              </Button>
              <Button variant="outline" className="rounded-full gap-2 border-gray-200">
                <Share2 className="w-4 h-4 text-gray-400" /> Facebook
              </Button>
              <Button variant="outline" className="rounded-full gap-2 border-gray-200">
                <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
              </Button>
            </div>
            
            <div className="w-full h-48 bg-gray-100 rounded-2xl relative overflow-hidden border border-gray-200">
               {/* Map Placeholder */}
               <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary gap-2">
                 <MapPin className="w-8 h-8 opacity-20" />
                 <span className="text-xs uppercase font-bold tracking-widest opacity-40">Ver mapa interactivo</span>
               </div>
            </div>
          </div>
        </div>

        <div className="pb-10 border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-secondary font-medium">
          <p>© 2026 {restaurant.name}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <Logo className="scale-75 origin-left" />
          </div>
        </div>
      </footer>

      {/* SECTION 4 — FLOATING CART BUTTON */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-50">
          <CartDrawer onCheckout={(notes: string) => router.push(`/menu/${slug}/checkout?notes=${encodeURIComponent(notes)}`)}>
            <Button 
               className="w-full h-14 bg-foodify-orange text-white shadow-2xl rounded-2xl flex justify-between items-center px-6 hover:bg-foodify-orange-dark hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-white text-foodify-orange text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                    {getItemCount()}
                  </span>
                </div>
                <span className="font-bold">Ver orden</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">${getTotal().toFixed(2)}</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
          </CartDrawer>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
