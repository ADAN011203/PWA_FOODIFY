'use client';

import React from 'react';
import { 
  Store, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  UserCog, 
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { SalesChart } from '@/components/admin/charts/SalesChart'; // Reuse the chart base
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip 
} from 'recharts';

const PLAN_DATA = [
  { name: 'Plan Premium', value: 15, color: '#E8673A' },
  { name: 'Plan Básico', value: 9, color: '#3B82F6' },
];

export default function CodexDashboard() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Global CODEX</h1>
        <p className="text-sm text-gray-500">Métricas consolidadas de todos los clientes.</p>
      </div>

      {/* KPI Section - 6 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard 
          title="Restaurantes" 
          value="24" 
          icon={Store} 
          trend={{ value: '+2', isUp: true }}
          className="xl:col-span-1 shadow-sm border-none bg-white font-bold"
        />
        <KpiCard 
          title="MRR (Mensual)" 
          value={formatCurrency(48500)} 
          icon={DollarSign} 
          trend={{ value: '15%', isUp: true }}
          className="xl:col-span-1 shadow-sm border-none bg-white"
        />
        <KpiCard 
          title="Clientes Atendidos" 
          value="12.4k" 
          icon={Users} 
          trend={{ value: '120', isUp: true }}
          className="xl:col-span-1 shadow-sm border-none bg-white"
        />
        <KpiCard 
          title="Pagos Vencidos" 
          value="2" 
          icon={AlertTriangle} 
          className="xl:col-span-1 shadow-sm border-none bg-white border-red-100"
        />
        <KpiCard 
          title="Admins" 
          value="28" 
          icon={UserCog} 
          className="xl:col-span-1 shadow-sm border-none bg-white"
        />
        <KpiCard 
          title="Al Corriente" 
          value="92%" 
          icon={CheckCircle} 
          className="xl:col-span-1 shadow-sm border-none bg-white"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-base uppercase tracking-wider text-gray-400">Ingresos del período</h3>
            <Badge variant="available" className="bg-emerald-50 text-emerald-600 border-none font-bold">
              En tiempo real
            </Badge>
          </div>
          <SalesChart type="area" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-base uppercase tracking-wider text-gray-400 mb-8">Distribución por Plan</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PLAN_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {PLAN_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-3">
             {PLAN_DATA.map((plan) => (
               <div key={plan.name} className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                   <span className="text-sm font-semibold text-gray-600">{plan.name}</span>
                 </div>
                 <span className="font-bold">{plan.value}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-bold">Nuevos Restaurantes</h3>
            <button className="text-foodify-orange text-xs font-bold hover:underline">Ver todos</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 font-semibold">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Restaurante</th>
                  <th className="px-6 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Estado Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[ 
                  { name: 'Burger & Co', plan: 'Premium', status: 'al_corriente', color: 'emerald' },
                  { name: 'Sushi Zen', plan: 'Básico', status: 'por_vencer', color: 'amber' },
                  { name: 'Taco Loco', plan: 'Premium', status: 'vencido', color: 'orange' },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold">{row.name}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        row.plan === 'Premium' ? "bg-orange-50 text-foodify-orange" : "bg-blue-50 text-blue-500"
                      )}>{row.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={row.status as any}>{row.status.replace('_', ' ')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-bold">Próximos Cobros (7 días)</h3>
          </div>
          <div className="p-6 space-y-4">
            {[ 
              { name: 'The Coffee Shop', date: 'En 2 días', amount: '$1,500' },
              { name: 'Pizza Planet', date: 'En 4 días', amount: '$2,500' },
              { name: 'Veggie Garden', date: 'En 6 días', amount: '$1,500' },
            ].map((cobro) => (
              <div key={cobro.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-foodify-orange shadow-sm">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{cobro.name}</h4>
                    <p className="text-xs text-gray-400">{cobro.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <span className="font-bold text-sm">{cobro.amount}</span>
                   <div className="p-2 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                     <ArrowUpRight className="w-4 h-4 text-foodify-orange" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
