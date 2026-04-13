"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { 
  BarChart3, 
  UtensilsCrossed, 
  Package, 
  Users, 
  FileText, 
  Grid, 
  Settings, 
  LogOut,
  Menu as MenuIcon,
  X,
  Bell,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const navItems = [
  { icon: BarChart3, label: "Dashboard", href: "/admin/dashboard" },
  { icon: UtensilsCrossed, label: "Menú", href: "/admin/menu" },
  { icon: Package, label: "Inventario", href: "/admin/inventory" },
  { icon: Users, label: "Staff", href: "/admin/staff" },
  { icon: FileText, label: "Pedidos", href: "/admin/orders" },
  { icon: Grid, label: "Mesas", href: "/admin/tables" },
  { icon: Settings, label: "Configuración", href: "/admin/config" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    router.push("/login");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={cn("min-h-screen bg-app flex transition-colors", isDarkMode && "dark")}>
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-white dark:bg-zinc-950 border-r border-border sticky top-0 h-screen z-50">
        <div className="p-6">
          <Logo />
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-1 opacity-50">
            Panel Administrativo
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  isActive 
                    ? "bg-foodify-orange text-white shadow-lg shadow-foodify-orange/20" 
                    : "text-text-secondary hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-text-primary"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-text-secondary font-bold hover:text-red-500 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
           className="fixed inset-0 bg-black/50 z-[60] lg:hidden" 
           onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR PANEL */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-950 z-[70] lg:hidden transition-transform duration-300 transform border-r border-border",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <Logo />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
             <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  pathname === item.href ? "bg-foodify-orange text-white" : "text-text-secondary"
                )}
             >
               <item.icon className="w-5 h-5" />
               {item.label}
             </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="h-16 bg-white dark:bg-zinc-950 border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon className="w-5 h-5" />
            </Button>
            <h2 className="font-black text-lg truncate">
              {user?.restaurantId ? "Restaurante" : "Foodify"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-foodify-orange rounded-full border-2 border-white" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black">{user?.name || "Admin"}</p>
                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">
                  {user?.role === 'restaurant_admin' ? 'Dueño' : 'Staff'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-foodify-orange-light flex items-center justify-center text-foodify-orange font-black">
                {user?.name?.charAt(0) || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-zinc-900/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
