"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { 
  Plus, 
  Check, 
  X, 
  Clock, 
  RefreshCw, 
  Users,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const MOCK_TABLES = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Mesa ${i + 1}`,
  capacity: 4,
  status: i % 5 === 0 ? "occupied" : i % 7 === 0 ? "reserved" : i % 9 === 0 ? "cleaning" : "available",
  activeOrder: i % 5 === 0 ? { id: 123, total: 450.0 } : null
}));

export default function AdminTablesPage() {
  const [tableCount, setTableCount] = useState(15);
  const [tables, setTables] = useState(MOCK_TABLES);

  const statusCounts = {
    available: tables.filter(t => t.status === "available").length,
    occupied: tables.filter(t => t.status === "occupied").length,
    reserved: tables.filter(t => t.status === "reserved").length,
    cleaning: tables.filter(t => t.status === "cleaning").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Mesas</h1>
        <p className="text-text-secondary">Configuración y estado actual de las mesas del salón.</p>
      </div>

      {/* CONFIGURACIÓN SUPERIOR */}
      <Card className="bg-white dark:bg-zinc-900 border-none shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 space-y-2">
            <Label htmlFor="tableCount" className="text-xs font-black uppercase tracking-widest text-text-secondary">
              Número de mesas configuradas
            </Label>
            <div className="flex gap-3">
              <Input 
                 id="tableCount" 
                 type="number" 
                 className="max-w-[120px] h-11 rounded-xl font-bold" 
                 value={tableCount}
                 onChange={(e) => setTableCount(Number(e.target.value))}
              />
              <Button className="bg-foodify-orange text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-foodify-orange/20">
                Actualizar distribución
              </Button>
            </div>
          </div>
          <p className="text-xs text-text-secondary font-medium md:mb-3">
            Al actualizar, se crearán las mesas que falten y se mantendrán las existentes con sus pedidos activos.
          </p>
        </CardContent>
      </Card>

      {/* INDICADORES DE ESTADO */}
      <div className="flex flex-wrap gap-4">
        <StatusBadge icon={Check} label="Disponibles" count={statusCounts.available} color="text-green-500 bg-green-50" />
        <StatusBadge icon={X} label="Ocupadas" count={statusCounts.occupied} color="text-red-500 bg-red-50" />
        <StatusBadge icon={Clock} label="Reservadas" count={statusCounts.reserved} color="text-yellow-500 bg-yellow-50" />
        <StatusBadge icon={RefreshCw} label="Limpieza" count={statusCounts.cleaning} color="text-gray-500 bg-gray-50" />
      </div>

      {/* GRID DE MESAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {tables.map((table) => (
          <Card 
            key={table.id} 
            className={cn(
               "relative overflow-hidden group hover:border-foodify-orange border-2 border-transparent transition-all cursor-pointer aspect-square flex flex-col items-center justify-center gap-2",
               table.status === 'occupied' && "bg-red-50/10 border-red-100",
               table.status === 'reserved' && "bg-yellow-50/10 border-yellow-100",
               table.status === 'cleaning' && "bg-gray-50/10 border-gray-100",
               table.status === 'available' && "bg-white dark:bg-zinc-900 shadow-sm"
            )}
          >
            <div className={cn(
              "absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white",
              table.status === 'available' ? 'bg-green-500' : 
              table.status === 'occupied' ? 'bg-red-500' : 
              table.status === 'reserved' ? 'bg-yellow-500' : 'bg-gray-400'
            )} />
            
            <LayoutGrid className={cn(
              "w-8 h-8 opacity-20 group-hover:opacity-100 group-hover:text-foodify-orange transition-all",
              table.status === 'occupied' ? 'text-red-500' : 
              table.status === 'reserved' ? 'text-yellow-500' : 
              table.status === 'available' ? 'text-green-500' : 'text-gray-400'
            )} />
            
            <div className="text-center">
              <h3 className="font-black text-lg leading-tight">{table.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                {table.capacity} Personas
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3 bg-white/10 dark:bg-black/10 backdrop-blur-sm border-t border-inherit">
               {table.status === 'available' ? (
                 <p className="text-[10px] font-black uppercase text-center text-green-600">Crear orden</p>
               ) : table.status === 'occupied' ? (
                 <p className="text-[10px] font-black uppercase text-center text-red-600">${table.activeOrder?.total.toFixed(2)}</p>
               ) : (
                 <p className="text-[10px] font-black uppercase text-center text-text-secondary">{table.status}</p>
               )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ icon: Icon, label, count, color }: any) {
  return (
    <div className={cn("px-4 py-2 rounded-xl flex items-center gap-3 border border-transparent shadow-sm", color)}>
       <Icon className="w-4 h-4" />
       <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-wider opacity-60 leading-none mb-0.5">{label}</span>
          <span className="text-base font-black leading-none">{count}</span>
       </div>
    </div>
  );
}
