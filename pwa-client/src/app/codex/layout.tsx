'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Store, 
  CreditCard, 
  DollarSign, 
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronRight,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/codex/dashboard' },
  { id: 'restaurants', label: 'Restaurantes', icon: Store, path: '/codex/restaurants' },
  { id: 'subscriptions', label: 'Suscripciones', icon: CreditCard, path: '/codex/subscriptions' },
  { id: 'payments', label: 'Pagos', icon: DollarSign, path: '/codex/payments' },
];

export default function CodexLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/codex/login');
  };

  const pathname = usePathname();
  const isLoginPage = pathname === '/codex/login';

  if (isLoginPage) return <main className="bg-white">{children}</main>;

  return (
    <div className="min-h-screen bg-bg-app flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-[#1C1C1E] text-white px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-foodify-orange rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-bold text-lg tracking-tight">CODEX</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-white/10 rounded-lg"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark Theme */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#1C1C1E] text-white z-[60] flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tighter text-foodify-orange">CODEX</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">v2.0</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-tight">SaaS Internal Panel</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                  isActive 
                    ? "bg-foodify-orange text-white shadow-lg shadow-foodify-orange/40" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-foodify-orange")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center font-bold">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.name || 'SaaS Admin'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || 'admin@codex.com'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
        <header className="hidden md:flex h-16 bg-white border-b border-gray-100 px-8 items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">CODEX</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="font-semibold text-gray-800">
              {NAV_ITEMS.find(i => pathname.startsWith(i.path))?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Sistemas Online
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 animate-fade-in overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
