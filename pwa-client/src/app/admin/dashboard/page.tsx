'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Package, 
  Calendar,
  ChevronDown,
  LayoutGrid,
  TrendingUp,
  Clock
} from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { SalesChart } from '@/components/admin/charts/SalesChart';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip, 
  Legend 
} from 'recharts';

const TOP_DISHES_DATA = [
  { name: 'Hamburguesa Special', value: 400 },
  { name: 'Papas Gajo', value: 300 },
  { name: 'Tacos Pastor', value: 300 },
  { name: 'Cerveza Artesanal', value: 200 },
];

const COLORS = ['#E8673A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function AdminDashboard() {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [period, setPeriod] = useState('Hoy');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hola, Burger & Co 👋</h1>
          <p className="text-gray-400 text-sm">Aquí tienes el resumen de hoy, 25 de febrero.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border rounded-xl px-4 py-2 flex items-center gap-3 text-sm font-semibold shadow-sm cursor-pointer hover:bg-gray-50 transition-all">
            <Calendar className="w-4 h-4 text-foodify-orange" />
            <span>{period}</span>
            <ChevronDown className="w-4 h-4 text-gray-300" />
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Ventas del día" 
          value={formatCurrency(4850)} 
          icon={BarChart3} 
          trend={{ value: '12%', isUp: true }}
          subtitle="vs ayer"
        />
        <KpiCard 
          title="Pedidos hoy" 
          value="24" 
          icon={ShoppingBag} 
          trend={{ value: '3 en cocina', isUp: true }}
          className="bg-foodify-orange-light/50"
        />
        <KpiCard 
          title="Mesas ocupadas" 
          value="8" 
          icon={Users} 
          subtitle="de 12 totales"
        />
        <KpiCard 
          title="Alertas stock" 
          value="3" 
          icon={Package} 
          className="border-orange-100"
          subtitle="Ver inventario →"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-lg mb-1">Ventas por período</h3>
              <p className="text-xs text-gray-400">Desempeño de ingresos semanales</p>
            </div>
            
            <div className="flex bg-gray-50 p-1 rounded-lg">
              {(['bar', 'line', 'area'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize",
                    chartType === t ? "bg-white text-foodify-orange shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <SalesChart type={chartType} />
        </div>

        {/* Top Dishes Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-1">Top platillos</h3>
            <p className="text-xs text-gray-400">Los 5 más vendidos del mes</p>
          </div>

          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={TOP_DISHES_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {TOP_DISHES_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 space-y-2">
            {TOP_DISHES_DATA.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-foodify-orange" />
            <h3 className="font-bold text-lg text-text-primary">Horas pico</h3>
          </div>
          
          <div className="space-y-4">
            {[ 
              { range: '14:00 - 16:00', label: 'Comida', val: 85 },
              { range: '20:00 - 22:00', label: 'Cena', val: 95 },
              { range: '09:00 - 11:00', label: 'Desayuno', val: 40 },
            ].map((p) => (
              <div key={p.range}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{p.range} ({p.label})</span>
                  <span className="text-foodify-orange">{p.val}%</span>
                </div>
                <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                  <div className="h-full bg-foodify-orange rounded-full" style={{ width: `${p.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg text-text-primary">Rendimiento por Menú</h3>
          </div>
          
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 font-semibold border-b">
                <th className="pb-3 text-[10px] uppercase tracking-wider">Menú</th>
                <th className="pb-3 text-[10px] uppercase tracking-wider">Ventas</th>
                <th className="pb-3 text-[10px] uppercase tracking-wider">Crecimiento</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Menú del Día', sales: '$24,500', trend: '+18%', isUp: true },
                { name: 'Cena / A la Carta', sales: '$18,200', trend: '+5%', isUp: true },
                { name: 'Desayunos', sales: '$8,400', trend: '-2%', isUp: false },
              ].map((m) => (
                <tr key={m.name} className="border-b last:border-0">
                  <td className="py-4 font-bold">{m.name}</td>
                  <td className="py-4 font-semibold text-gray-600">{m.sales}</td>
                  <td className={cn("py-4 font-bold", m.isUp ? "text-emerald-500" : "text-red-500")}>
                    {m.trend}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
