"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge"; // I'll use a manual badge div for now
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Package, 
  Calendar, 
  ArrowRightLeft, 
  Filter,
  History,
  MoreVertical,
  Clock,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_INSUMOS = [
  { id: 1, name: "Harina de Maíz", category: "Granos", stock: 12.5, unit: "kg", min_stock: 5, status: "ok" },
  { id: 2, name: "Tomate Rojo", category: "Vegetales", stock: 3.2, unit: "kg", min_stock: 8, status: "critical" },
  { id: 3, name: "Aceite Vegetal", category: "Abarrotes", stock: 4, unit: "L", min_stock: 5, status: "warning" },
  { id: 4, name: "Carne al Pastor", category: "Proteínas", stock: 25, unit: "kg", min_stock: 10, status: "ok" },
];

const MOCK_LOTES = [
  { id: 1, insumo: "Carne al Pastor", code: "L-9021", received_at: "2026-03-25", expires_at: "2026-04-20", qty: 25, status: "ok" },
  { id: 2, insumo: "Tomate Rojo", code: "L-9025", received_at: "2026-04-10", expires_at: "2026-04-15", qty: 3, status: "expired" },
];

export default function AdminInventoryPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Inventario</h1>
          <p className="text-text-secondary">Control de insumos, lotes y almacén central.</p>
        </div>
        
        <div className="flex gap-2">
           <Button variant="outline" className="font-bold h-11 px-6 rounded-xl border-gray-200">
              <History className="w-5 h-5 mr-2" /> Movimientos
           </Button>
           <Button className="bg-foodify-orange text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-foodify-orange/20">
              <Plus className="w-5 h-5 mr-2" /> Agregar Insumo
           </Button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border flex items-center gap-6 shadow-sm">
            <div className="p-4 bg-foodify-orange-light rounded-2xl text-foodify-orange">
               <Package className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Total Insumos</p>
               <h3 className="text-2xl font-black">42 Items</h3>
            </div>
         </div>
         <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border flex items-center gap-6 shadow-sm">
            <div className="p-4 bg-red-100 rounded-2xl text-red-500">
               <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Bajo Stock</p>
               <h3 className="text-2xl font-black">8 Alertas</h3>
            </div>
         </div>
         <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border flex items-center gap-6 shadow-sm">
            <div className="p-4 bg-orange-100 rounded-2xl text-orange-500">
               <Calendar className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Prox. a vencer</p>
               <h3 className="text-2xl font-black">3 Lotes</h3>
            </div>
         </div>
      </div>

      {/* ALERTAS CRÍTICAS (Section - Módulo 3 Requerimiento R2) */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2 rounded-lg text-white animate-pulse">
               <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-red-700">Tienes 2 productos con lotes vencidos que requieren atención inmediata.</p>
         </div>
         <Button variant="link" className="text-red-700 font-bold text-xs uppercase tracking-wider">Ver Lotes Vencidos</Button>
      </div>

      <Tabs defaultValue="insumos" className="space-y-6">
         <TabsList className="bg-white dark:bg-zinc-900 border p-1 rounded-xl w-full sm:w-auto h-auto grid grid-cols-2">
            <TabsTrigger value="insumos" className="font-bold py-2 rounded-lg">Insumos</TabsTrigger>
            <TabsTrigger value="lotes" className="font-bold py-2 rounded-lg">Lotes (FIFO/FEFO)</TabsTrigger>
         </TabsList>

         <TabsContent value="insumos" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
                  <input className="w-full bg-white dark:bg-zinc-900 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foodify-orange" placeholder="Buscar insumo..." />
               </div>
               <Button variant="outline" className="h-10 rounded-xl font-bold gap-2">
                  <Filter className="w-4 h-4" /> Filtrar por categoría
               </Button>
            </div>

            <div className="bg-white dark:bg-zinc-950 border rounded-2xl overflow-hidden overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-zinc-900 border-b text-[10px] font-black uppercase text-text-secondary tracking-widest">
                     <tr>
                        <th className="px-6 py-4">Insumo</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4">Stock Actual</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                     {MOCK_INSUMOS.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4 font-bold">{item.name}</td>
                           <td className="px-6 py-4 text-text-secondary">{item.category}</td>
                           <td className="px-6 py-4">
                              <span className="font-black">{item.stock}</span> {item.unit}
                              <p className="text-[10px] text-text-secondary">Min: {item.min_stock} {item.unit}</p>
                           </td>
                           <td className="px-6 py-4">
                              <div className={cn(
                                 "inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                 item.status === 'ok' ? 'bg-green-100 text-green-600' :
                                 item.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                 'bg-red-100 text-red-600'
                              )}>
                                 {item.status === 'ok' ? 'Suficiente' : item.status === 'warning' ? 'Poco stock' : 'Crítico'}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </TabsContent>

         <TabsContent value="lotes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {MOCK_LOTES.map((lote) => (
                  <Card key={lote.id} className={cn(
                     "border-none shadow-sm overflow-hidden",
                     lote.status === 'expired' ? 'bg-red-50/50' : 'bg-white'
                  )}>
                     <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                           <CardTitle className="text-sm font-black uppercase tracking-wider text-text-secondary">{lote.code}</CardTitle>
                           <h4 className="font-bold">{lote.insumo}</h4>
                        </div>
                        <div className={cn(
                           "p-2 rounded-xl",
                           lote.status === 'expired' ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'
                        )}>
                           <Clock className="w-4 h-4" />
                        </div>
                     </CardHeader>
                     <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between text-xs">
                           <span className="text-text-secondary">Cantidad</span>
                           <span className="font-bold underline">{lote.qty} unidades</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-text-secondary">Recibido</span>
                           <span className="font-medium">{lote.received_at}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-text-secondary font-bold">Vencimiento</span>
                           <span className={cn("font-black", lote.status === 'expired' && "text-red-600")}>{lote.expires_at}</span>
                        </div>
                     </CardContent>
                     <CardFooter className="p-4 bg-black/[0.02] flex justify-between">
                        <Button variant="ghost" size="sm" className="text-[10px] font-black">Merma / Descarte</Button>
                        <Button size="sm" className="bg-foodify-orange text-white text-[10px] font-black h-8 px-4">Usar Lote</Button>
                     </CardFooter>
                  </Card>
               ))}
            </div>
         </TabsContent>
      </Tabs>
    </div>
  );
}
