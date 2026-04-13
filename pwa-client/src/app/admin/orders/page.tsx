"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const MOCK_ORDERS = [
  {
    id: 1,
    folio: "0021",
    type: "takeout",
    tableName: null,
    customerName: "Juan García",
    customerPhone: "555-1234",
    waiterName: "Carlos García",
    waiterAvatar: "",
    status: "preparing",
    elapsedTime: 8,
    createdAt: "10:30 a.m.",
    total: 205.0,
    items: [
      { id: 1, name: "Tacos al Pastor", qty: 2, price: 170 },
      { id: 2, name: "Café Americano", qty: 1, price: 35 },
    ]
  },
  {
    id: 2,
    folio: "0022",
    type: "dine_in",
    tableName: "Mesa 5",
    customerName: null,
    waiterName: "María López",
    status: "pending",
    elapsedTime: 2,
    createdAt: "10:45 a.m.",
    total: 450.0,
    items: [
      { id: 3, name: "Pozole Rojo", qty: 2, price: 300 },
      { id: 4, name: "Cerveza Corona", qty: 3, price: 150 },
    ]
  },
  {
    id: 3,
    folio: "0023",
    type: "takeout",
    tableName: null,
    customerName: "Ana Martínez",
    customerPhone: "555-9876",
    waiterName: null,
    status: "ready",
    elapsedTime: 25,
    createdAt: "10:15 a.m.",
    total: 85.0,
    items: [
      { id: 1, name: "Tacos al Pastor", qty: 1, price: 85 },
    ]
  }
];

const ORDER_STATUSES = [
  { id: "all", label: "Todos", count: 12 },
  { id: "pending", label: "Pendientes", count: 3 },
  { id: "preparing", label: "En Cocina", count: 2 },
  { id: "ready", label: "Listos", count: 1 },
  { id: "delivered", label: "Entregados", count: 6 },
  { id: "cancelled", label: "Cancelados", count: 0 },
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = activeTab === "all" 
    ? MOCK_ORDERS 
    : MOCK_ORDERS.filter(o => o.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Pedidos</h1>
          <p className="text-text-secondary">Monitorea y gestiona las órdenes en tiempo real.</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 border p-1 rounded-xl shadow-sm overflow-x-auto scrollbar-hide">
           <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent h-auto p-0 gap-1">
                {ORDER_STATUSES.map(status => (
                  <TabsTrigger 
                    key={status.id} 
                    value={status.id}
                    className="flex gap-2 font-bold px-4 py-2 rounded-lg data-[state=active]:bg-foodify-orange data-[state=active]:text-white"
                  >
                    {status.label}
                    <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{status.count}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
           </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="relative overflow-hidden group hover:border-foodify-orange transition-all">
            <CardContent className="p-6">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg">
                       {order.type === 'dine_in' ? order.tableName : 'Para Llevar'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-text-secondary font-medium uppercase tracking-wider mt-1">
                       <span>Folio #{order.folio}</span>
                       <span>•</span>
                       <span className="flex items-center gap-1 font-bold text-foodify-orange">
                         <Clock className="w-3 h-3" /> {order.elapsedTime} min
                       </span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    `badge-${order.status}`
                  )}>
                    {order.status === 'pending' && 'Pendiente'}
                    {order.status === 'preparing' && 'En Cocina'}
                    {order.status === 'ready' && 'Listo'}
                    {order.status === 'delivered' && 'Entregado'}
                    {order.status === 'cancelled' && 'Cancelado'}
                  </div>
               </div>

               <div className="space-y-3 mb-6">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                       <span className="text-text-primary font-medium">
                         <span className="font-black text-foodify-orange mr-2">{item.qty}x</span>
                         {item.name}
                       </span>
                       <span className="font-black">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
               </div>

               <div className="pt-4 border-t border-dashed flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-text-secondary">
                        <UserIcon className="w-4 h-4" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-text-secondary uppercase">Mesero / Cliente</span>
                        <span className="text-xs font-bold leading-tight">{order.waiterName || order.customerName}</span>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-text-secondary uppercase">Total</p>
                    <p className="text-lg font-black text-foodify-orange">${order.total.toFixed(2)}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="font-black text-xs h-10 rounded-xl">Detalle</Button>
                  <Button className="bg-foodify-orange text-white font-black text-xs h-10 rounded-xl">Sig. Estado</Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
