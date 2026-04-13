"use client";

import { 
  getSalesReportApi, 
  getTopDishesApi, 
  getRestaurantDashboardApi,
  getPeakHoursApi,
  type ReportPeriod
} from "@/lib/reportsApi";
import { getInventoryItemsApi } from "@/lib/inventoryApi";
import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  ArrowUpRight,
  Layers
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

const COLORS = ["#E8673A", "#D4592E", "#F59E0B", "#10B981", "#6B7280"];

function mapPeriod(p: string): ReportPeriod {
  if (p === "Hoy") return "today";
  if (p === "Semana") return "week";
  if (p === "Mes") return "month";
  return "year";
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("Mes");

  const reportPeriod = mapPeriod(period);

  // Memoize fetchers to prevent recreation on every render
  const salesFetcher = useMemo(() => () => getSalesReportApi({ period: reportPeriod }), [reportPeriod]);
  const topDishesFetcher = useMemo(() => () => getTopDishesApi({ period: reportPeriod }), [reportPeriod]);
  const dashFetcher = useMemo(() => () => user?.restaurantId 
    ? getRestaurantDashboardApi(String(user.restaurantId)) 
    : Promise.reject("No restaurant ID"), [user?.restaurantId]);

  const { data: salesData } = useFetchWithState("sales", salesFetcher, 15000);
  const { data: topDishes } = useFetchWithState("top-dishes", topDishesFetcher, 15000);
  const { data: peakData } = useFetchWithState("peak-hours", getPeakHoursApi, 15000);
  const { data: dashboard } = useFetchWithState("dash-kpis", dashFetcher, 15000);
  const { data: inventory } = useFetchWithState("inventory", getInventoryItemsApi, 15000);

  const sales = (salesData || []).map(s => ({ name: s.label, total: s.ventas }));
  const top = (topDishes || []).map(d => ({ name: d.name, value: d.value }));
  const peak = (peakData || []).map(p => ({ hour: p.hour, orders: p.ordenes }));
  const lowStock = (inventory || []).filter(i => i.currentStock <= i.minStock).length;

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Dashboard</h1>
          <p className="text-text-secondary">Vista general del rendimiento de tu restaurante.</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 border p-1 rounded-xl shadow-sm">
          {["Hoy", "Semana", "Mes", "Personalizado"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                period === p 
                  ? "bg-foodify-orange text-white shadow-md shadow-foodify-orange/20" 
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem 
           icon={BarChart3} 
           label="Ventas del día" 
           value={`$${(dashboard?.salesToday || 0).toLocaleString()}`} 
           trend={`${period}`} 
           trendType="up" 
        />
        <KPIItem 
           icon={ShoppingBag} 
           label="Pedidos activos" 
           value={String(dashboard?.activeOrders || 0)} 
           trend="En cocina" 
           trendType="neutral" 
        />
        <KPIItem 
           icon={Users} 
           label="Ocupación" 
           value={`${period}`} 
           trend="Ver mesas →" 
           trendType="neutral" 
        />
        <KPIItem 
           icon={Package} 
           label="Alertas stock" 
           value={String(lowStock)} 
           trend="Ver inventario →" 
           trendType="down" 
        />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas por período */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-black uppercase tracking-wider text-text-secondary">Ventas por período</CardTitle>
              <CardDescription>Ingresos acumulados en los últimos 7 días</CardDescription>
            </div>
            <Layers className="text-foodify-orange w-5 h-5 opacity-40" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fontSize: 12, fontWeight: 500}} 
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fontSize: 12, fontWeight: 500}}
                   tickFormatter={(v) => `$${v}`}
                />
                <Tooltip 
                   cursor={{fill: '#FFF3ED'}} 
                   contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="total" fill="#E8673A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Platillos */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-black uppercase tracking-wider text-text-secondary">Top Platillos</CardTitle>
            <CardDescription>Distribución de ventas por producto</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={top}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {top.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                     layout="vertical" 
                     verticalAlign="bottom" 
                     align="center"
                     iconType="circle"
                     wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 600}}
                  />
                </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horas pico */}
        <Card>
          <CardHeader className="pb-8">
            <CardTitle className="text-base font-black uppercase tracking-wider text-text-secondary">Horas Pico</CardTitle>
            <CardDescription>Demanda de pedidos por hora del día</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peak}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                   <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="orders" 
                     stroke="#E8673A" 
                     strokeWidth={4} 
                     dot={{r: 6, fill: "#E8673A", strokeWidth: 2, stroke: "#FFF"}} 
                     activeDot={{r: 8, strokeWidth: 0}}
                   />
                </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabla - Requerimiento G5 */}
        <Card>
           <CardHeader className="pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-wider text-text-secondary">Ventas por Menú</CardTitle>
                <CardDescription>Desempeño individual de platillos</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-foodify-orange font-bold">Ver reporte completo</Button>
           </CardHeader>
           <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase font-black text-text-secondary border-b">
                    <tr>
                      <th className="px-6 py-4">Platillo</th>
                      <th className="px-6 py-4">Vendidos</th>
                      <th className="px-6 py-4">% Total</th>
                      <th className="px-6 py-4 text-right">Ingreso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {top.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-6 py-4 font-bold">{row.name}</td>
                        <td className="px-6 py-4">{row.value} uds</td>
                        <td className="px-6 py-4 text-right font-black text-foodify-orange">Pop: {row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPIItem({ icon: Icon, label, value, trend, trendType }: any) {
  return (
    <Card className="hover:scale-[1.02] transition-all cursor-default">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-foodify-orange-light dark:bg-foodify-orange/10 rounded-2xl text-foodify-orange">
            <Icon className="w-5 h-5" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full",
            trendType === "up" ? "bg-green-100 text-green-600" : 
            trendType === "down" ? "bg-red-100 text-red-600" : 
            "bg-blue-100 text-blue-600"
          )}>
            {trendType === "up" && <TrendingUp className="w-3 h-3" />}
            {trend}
          </div>
        </div>
        <CardDescription className="text-xs font-bold uppercase tracking-widest">{label}</CardDescription>
        <div className="flex items-end justify-between mt-1">
          <CardTitle className="text-2xl font-black">{value}</CardTitle>
          <ArrowUpRight className="w-4 h-4 text-text-secondary opacity-30" />
        </div>
      </CardContent>
    </Card>
  );
}

