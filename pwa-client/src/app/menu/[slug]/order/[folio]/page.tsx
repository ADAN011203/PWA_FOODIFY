'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  PackageCheck, 
  ShoppingBag,
  ArrowLeft,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Order } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

// Mock Order Data
const MOCK_ORDER: Order = {
  id: 'o1',
  folio: '0023',
  type: 'takeout',
  status: 'preparing',
  customerName: 'Juan Pérez',
  total: 205,
  createdAt: new Date().toISOString(),
  items: [
    { id: 'i1', dishId: 'd2', name: 'La Foodify Special', price: 185, quantity: 1 },
    { id: 'i2', dishId: 'd1', name: 'Papas Gajo', price: 85, quantity: 1 }
  ]
};

const STEPS = [
  { id: 'pending', label: 'Recibido', icon: Clock },
  { id: 'preparing', label: 'En cocina', icon: ChefHat },
  { id: 'ready', label: 'Listo', icon: PackageCheck },
  { id: 'delivered', label: 'Entregado', icon: CheckCircle2 },
];

export default function OrderTrackingPage() {
  const { slug, folio } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order>(MOCK_ORDER);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeIndex = STEPS.findIndex(s => s.id === order.status);

  const refreshStatus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Simulating status change for demo
      if (order.status === 'pending') setOrder({...order, status: 'preparing'});
      else if (order.status === 'preparing') setOrder({...order, status: 'ready'});
    }, 1000);
  };

  useEffect(() => {
    const interval = setInterval(refreshStatus, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [order]);

  return (
    <div className="min-h-screen bg-bg-app">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <button 
          onClick={() => router.push(`/menu/${slug}`)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Seguimiento de Orden</p>
          <h1 className="font-extrabold text-lg">Folio #{folio}</h1>
        </div>
        <button 
          onClick={refreshStatus}
          className={cn("p-2 hover:bg-gray-100 rounded-full transition-all", isRefreshing && "animate-spin")}
        >
          <RefreshCw className="w-5 h-5 text-foodify-orange" />
        </button>
      </header>

      <main className="container mx-auto max-w-lg p-6 space-y-8 animate-fade-in">
        {/* Status Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-foodify-orange/5 border border-gray-50 text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-foodify-orange relative">
            <div className="absolute inset-0 bg-foodify-orange rounded-full animate-ping opacity-20" />
            <ChefHat className="w-10 h-10 relative z-10" />
          </div>
          
          <h2 className="text-2xl font-black mb-2">¡Tu orden está en cocina!</h2>
          <p className="text-gray-500 text-sm mb-6">Estamos preparando tus platillos con amor.</p>
          
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-foodify-orange" />
            <span className="font-bold text-foodify-orange">Tiempo estimado: ~20 minutos</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100">
          <div className="relative flex justify-between">
            {/* Timeline Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < activeIndex;
              const isActive = idx === activeIndex;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                    isCompleted ? "bg-emerald-500 text-white" : 
                    isActive ? "bg-foodify-orange text-white ring-4 ring-orange-50" : 
                    "bg-white border-2 border-gray-100 text-gray-300"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-tight",
                    isActive ? "text-foodify-orange" : isCompleted ? "text-emerald-500" : "text-gray-300"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-[#1C1C1E] text-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-2xl">
            <QrCode className="w-32 h-32 text-black" />
          </div>
          <div className="text-center">
            <p className="font-bold mb-1">Código de Retiro</p>
            <p className="text-xs text-gray-400">Muestra este código al llegar al restaurante</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b bg-gray-50/50">
            <h3 className="font-black flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-foodify-orange" />
              Resumen de tu pedido
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs">{item.quantity}x</span>
                  <span className="font-semibold text-gray-700">{item.name}</span>
                </div>
                <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Total Pagado</span>
              <span className="text-2xl font-black text-foodify-orange">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => router.push(`/menu/${slug}`)}
          className="w-full py-4 text-gray-400 font-bold text-sm hover:text-foodify-orange transition-colors"
        >
          Volver al menú principal
        </button>
      </main>
    </div>
  );
}
