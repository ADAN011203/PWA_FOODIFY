'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  UtensilsCrossed, 
  Package, 
  Users, 
  FileText, 
  LayoutGrid, 
  Settings, 
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
  { id: 'menu', label: 'Menú', icon: UtensilsCrossed, path: '/admin/menu' },
  { id: 'inventory', label: 'Inventario', icon: Package, path: '/admin/inventory' },
  { id: 'staff', label: 'Staff', icon: Users, path: '/admin/staff' },
  { id: 'orders', label: 'Pedidos', icon: FileText, path: '/admin/orders' },
  { id: 'tables', label: 'Mesas', icon: LayoutGrid, path: '/admin/tables' },
  { id: 'config', label: 'Configuración', icon: Settings, path: '/admin/config' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) return <main>{children}</main>;

  return (
    <div className="min-h-screen bg-bg-app flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-white border-b px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-foodify-orange rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          <span className="font-bold text-lg">Foodify</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r z-[60] flex flex-col transition-transform duration-300 md:relative md:translate-x-0 shadow-xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foodify-orange rounded-lg flex items-center justify-center text-white font-bold">
              F
            </div>
            <div>
              <p className="font-bold leading-tight">Foodify</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                  isActive 
                    ? "bg-foodify-orange text-white shadow-lg shadow-foodify-orange/20" 
                    : "text-gray-500 hover:bg-foodify-orange-light hover:text-foodify-orange"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-foodify-orange")} />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-foodify-orange-light text-foodify-orange flex items-center justify-center font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.name || 'Administrador'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@foodify.mx'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-16 bg-white border-b px-8 items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Panel</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="font-semibold text-gray-800">
              {NAV_ITEMS.find(i => pathname === i.path)?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-foodify-orange hover:bg-foodify-orange-light rounded-lg transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-foodify-orange text-white flex items-center justify-center font-bold text-xs ring-4 ring-foodify-orange-light">
               {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
