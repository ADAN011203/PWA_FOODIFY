"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { DashboardSkeleton } from "@/components/ui/Skeletons";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { ErrorAlert } from "@/components/ErrorAlert";
import { EmptyState } from "@/components/EmptyState";
import type { Dish } from "@/types/menu";
import type { Ingredient } from "@/types/inventory";
import { getAlertLevel } from "@/types/inventory";
import type { Order } from "@/types/orders";
import { getOrdersApi } from "@/lib/ordersApi";
import { Button } from "@/components/ui/Button";
import { RestaurantSwitchModal } from "@/components/RestaurantSwitchModal";
import styles from "./dashboard.module.css";

function useRoleGuard(allowed: string[]) {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && (!user || !allowed.includes(user.role)))
      window.location.href = "/login";
  }, [isLoading, user, allowed]);
  return { user, isLoading };
}




function buildProfitData(salesData: { ventas: number }[]) {
  return salesData.slice(-4).map((day, i) => {
    const rawCost = day.ventas * 0.4; // 40% margin estimate
    return {
      label: `Día ${i + 1}`,
      ingresos: day.ventas,
      costos: rawCost,
      rentabilidad: day.ventas - rawCost,
    };
  });
}

const PIE_COLORS = ["#FF6B35", "#6366f1", "#22c55e", "#f59e0b", "#ec4899"];
type Period = "hoy" | "semana" | "mes" | "trimestre";
const PERIOD_LABELS: Record<Period, string> = {
  hoy: "Hoy", semana: "Esta semana", mes: "Este mes", trimestre: "Este trimestre",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name: string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-app)", border: "1px solid var(--border-light)", borderRadius: 10, padding: "10px 14px", boxShadow: "var(--shadow-md)" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-primary)", margin: "2px 0" }}>
          {p.name}: ${p.value.toLocaleString("es-MX")}
        </p>
      ))}
    </div>
  );
}

import {
  IconUtensils,
  IconClipboard,
  IconPackage,
  IconUsers,
  IconBarChart,
  IconDollarSign,
  IconReceipt,
  IconTrendingUp,
  IconChefHat,
  IconAlertCircle,
  IconCheck,
} from "@/components/ui/Icons";

const MODULES = [
  { icon: <IconUtensils size={24} />,   label: "Menú",       sub: "Gestiona platillos",  href: "/admin/menu",       color: "#FF6B35" },
  { icon: <IconClipboard size={24} />,  label: "Pedidos",    sub: "Órdenes activas",      href: "/admin/pedidos",    color: "#6366f1" },
  { icon: <IconPackage size={24} />,    label: "Inventario", sub: "Stock y lotes",        href: "/admin/inventario", color: "#22c55e" },
  { icon: <IconUsers size={24} />,      label: "Staff",      sub: "Personal",             href: "/admin/staff",      color: "#f59e0b" },
  { icon: <IconBarChart size={24} />,   label: "Reportes",   sub: "KPIs y estadísticas",  href: "/admin/reportes",   color: "#a78bfa" },
];

import {
  getSalesReportApi, getTopDishesApi, getRestaurantDashboardApi,
  type ReportPeriod
} from "@/lib/reportsApi";
import { getDishesApi } from "@/lib/menuApi";
import { getInventoryItemsApi } from "@/lib/inventoryApi";

function mapPeriod(p: Period): ReportPeriod {
  if (p === "hoy") return "today";
  if (p === "semana") return "week";
  if (p === "mes") return "month";
  if (p === "trimestre") return "quarter";
  return "year";
}

export default function DashboardPage() {
  const { user, isLoading } = useRoleGuard(["admin", "restaurant_admin", "manager"]);
  const { logout } = useAuth();
  
  const [period, setPeriod] = useState<Period>("mes");
  const [salesData, setSalesData] = useState<{ label: string; ventas: number; ordenes: number }[]>([]);
  const [topDishes, setTopDishes] = useState<{ name: string; value: number }[]>([]);
  const [kpis, setKpis] = useState({
    totalVentas: 0,
    validOrdersCount: 0,
    ticketPromedio: 0,
    enCocina: 0
  });
  
  const [dataLoading, setDataLoading] = useState(true);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const { data: dishesData, loading: dishesLoading, error: dishesError, refetch: refetchDishes } = useFetchWithState<Dish[]>("/dishes", getDishesApi, 15000);
  const { data: ingredientsData, error: ingError } = useFetchWithState<Ingredient[]>("/inventory/items", getInventoryItemsApi, 15000);
  
  const dishes = dishesData ?? [];
  const alertIngredients = useMemo(() => ingredientsData?.filter(i => getAlertLevel(i) !== "ok") ?? [], [ingredientsData]);
  const isPremium = !ingError;

  // Polling para KPIs (ventas, dashboard)
  useEffect(() => {
    if (!user || isLoading) return;

    const fetchData = async () => {
      try {
        console.log("[Dashboard] Initializing KPI fetch...");
        const rid = user?.restaurantId ? String(user.restaurantId) : "";
        
        // Parallel fetch with individual error handling to prevent blocking
        const [sales, top, dash] = await Promise.all([
          getSalesReportApi({ period: mapPeriod(period) }).catch(err => {
            console.warn("Sales report failed:", err);
            return [];
          }),
          getTopDishesApi({ limit: 5, period: mapPeriod(period) }).catch(err => {
            console.warn("Top dishes failed:", err);
            return [];
          }),
          rid ? getRestaurantDashboardApi(rid).catch(err => {
            console.warn("Dashboard KPIs failed:", err);
            return { salesToday: 0, activeOrders: 0, topDishes: [], stockAlerts: 0 };
          }) : Promise.resolve({ salesToday: 0, activeOrders: 0, topDishes: [], stockAlerts: 0 })
        ]);

        console.log("[Dashboard] KPIs loaded successfully");
        setSalesData(sales);
        setTopDishes(top.map(d => ({
          name: d.name.length > 16 ? d.name.slice(0, 16) + "…" : d.name,
          value: d.value
        })));

        const totalV = sales.reduce((acc, s) => acc + s.ventas, 0);
        const totalO = sales.reduce((acc, s) => acc + s.ordenes, 0);

        setKpis({
          totalVentas: totalV,
          validOrdersCount: totalO,
          ticketPromedio: totalO > 0 ? Math.round(totalV / totalO) : 0,
          enCocina: dash.activeOrders
        });
      } catch (err) {
        console.error("Dashboard critical fetch error:", err);
      } finally {
        console.log("[Dashboard] Setting dataLoading to false");
        setDataLoading(false);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [user, isLoading, period]);

  const profitData = useMemo(() => buildProfitData(salesData), [salesData]);

  if (dishesLoading || dataLoading) return <DashboardSkeleton />;
  if (dishesError) return <ErrorAlert message={dishesError} onRetry={refetchDishes} />;

  if (isLoading || !user) return <DashboardSkeleton />;

  const { totalVentas, ticketPromedio, enCocina, validOrdersCount } = kpis;
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>
            <Logo 
              variant={user.role === "saas_admin" || user.role === "admin" ? "codex" : "foodify"} 
              className="text-white"
            />
          </div>
          <div>
            <p className={styles.headerTitle}>
              {user.role === "saas_admin" || user.role === "admin" ? "Codex Master" : "Foodify Admin"}
            </p>
            <div className={styles.branchSelector} onClick={() => setShowSwitchModal(true)}>
              <p className={styles.headerSub}>{user.name} · {user.branch}</p>
              <span className={styles.switchBadge}>Cambiar sucursal</span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <RestaurantSwitchModal
            isOpen={showSwitchModal}
            onClose={() => setShowSwitchModal(false)}
          />
          <style>{`
            @keyframes spin    { to { transform: rotate(360deg); } }
          `}</style>
          {alertIngredients.length > 0 && (
            <button
              className={styles.alertBadge}
              onClick={() => window.location.href = "/admin/inventario"}
            >
              <span className={styles.alertDot} />
              {alertIngredients.length} alertas
            </button>
          )}
          <Button variant="secondary" size="sm" onClick={logout}>
            Salir
          </Button>
        </div>
      </header>

      <div className={styles.content}>
        {/* Section header */}
        <div className={styles.sectionHead}>
          <div>
            <h1 className={styles.pageTitle}>Panel de control</h1>
            <p className={styles.pageSub}>Resumen operativo del restaurante</p>
          </div>
          {/* Period picker */}
          <div className={styles.periodPicker}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                className={`${styles.periodBtn} ${period === p ? styles.periodActive : ""}`}
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className={styles.kpiGrid}>
          {[
            { icon: <IconDollarSign size={24} />, label: "Ventas del período", value: `$${totalVentas.toLocaleString("es-MX")}`, sub: `${validOrdersCount} órdenes`, color: "#22c55e" },
            { icon: <IconReceipt size={24} />,    label: "Ticket promedio",    value: `$${ticketPromedio}`,                       sub: "Por orden",                    color: "#6366f1" },
            { icon: <IconTrendingUp size={24} />, label: "Rentabilidad",       value: totalVentas > 0 ? "62%" : "0%",             sub: "Margen bruto",                  color: "#FF6B35" },
            { icon: <IconChefHat size={24} />,    label: "En cocina",        value: String(enCocina),                            sub: "En preparación",               color: "#f59e0b" },
          ].map(({ icon, label, value, sub, color }) => (
            <div key={label} className={styles.kpiCard} style={{ borderColor: `${color}25` }}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiIcon}>{icon}</span>
                <div className={styles.kpiDot} style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              </div>
              <p className={styles.kpiValue} style={{ color }}>{value}</p>
              <p className={styles.kpiLabel}>{label}</p>
              <p className={styles.kpiSub}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Stock alert banner */}
        {alertIngredients.length > 0 && (
          <div
            className={styles.stockAlert}
            onClick={() => window.location.href = "/admin/inventario"}
          >
            <div className={styles.stockAlertIcon}>
              <IconAlertCircle size={24} color="#ef4444" />
            </div>
            <div style={{ flex: 1 }}>
              <p className={styles.stockAlertTitle}>{alertIngredients.length} ingredientes con alerta de stock</p>
              <p className={styles.stockAlertSub}>{alertIngredients.map((i) => i.name).slice(0, 4).join(" · ")}{alertIngredients.length > 4 ? " · ..." : ""}</p>
            </div>
            <span style={{ color: "var(--text-muted)" }}>→</span>
          </div>
        )}

        {/* Charts row */}
        <div className={styles.chartsRow}>
          {/* Bar chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <p className={styles.chartTitle}>Ventas por día</p>
                <p className={styles.chartSub}>{PERIOD_LABELS[period]} · en MXN</p>
              </div>
              <span className={styles.chartBadge}>${(totalVentas / 1000).toFixed(1)}k total</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-elevated)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={salesData.length > 14 ? Math.floor(salesData.length / 6) : 0} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="ventas" name="Ventas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className={styles.chartCard}>
            <p className={styles.chartTitle}>Top platillos</p>
            <p className={styles.chartSub} style={{ marginBottom: 12 }}>Más vendidos del período</p>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={topDishes} dataKey="value" cx="50%" cy="50%" outerRadius={62} innerRadius={32} paddingAngle={3}>
                  {topDishes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} uds`, ""]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div>
              {topDishes.slice(0, 4).map((d, i) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                  <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line chart */}
        <div className={styles.chartCard} style={{ marginBottom: 16 }}>
          <div className={styles.chartHeader}>
            <div>
              <p className={styles.chartTitle}>Rentabilidad semanal</p>
              <p className={styles.chartSub}>Ingresos · Costos · Margen neto</p>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ color: "#22c55e", label: "Ingresos" }, { color: "#ef4444", label: "Costos" }, { color: "#FF6B35", label: "Margen" }].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 16, height: 2, background: color, borderRadius: 2 }} />
                  <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={profitData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-elevated)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="ingresos"     name="Ingresos"     stroke="#22c55e" strokeWidth={2}   dot={false} />
              <Line type="monotone" dataKey="costos"       name="Costos"       stroke="#ef4444" strokeWidth={2}   dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="rentabilidad" name="Rentabilidad" stroke="#FF6B35" strokeWidth={2.5} dot={{ fill: "#FF6B35", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom row */}
        <div className={styles.bottomRow}>
          {/* Stock alerts table */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <p className={styles.chartTitle}>Stock y merma</p>
                <p className={styles.chartSub}>Ingredientes con alertas</p>
              </div>
              <button
                className={styles.seeAllBtn}
                onClick={() => window.location.href = "/admin/inventario"}
              >
                Ver todo →
              </button>
            </div>
            {alertIngredients.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ color: "#22c55e", marginBottom: 8 }}>
                  <IconCheck size={32} />
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--status-success)", margin: 0, fontWeight: 600 }}>Inventario en orden</p>
              </div>
            ) : (
              <>
                <div className={styles.tableHead}>
                  {["Ingrediente", "Stock", "Mín.", "Estado"].map((h) => (
                    <p key={h} className={styles.tableHeadCell}>{h}</p>
                  ))}
                </div>
                {alertIngredients.slice(0, 5).map((ing) => {
                  const level = getAlertLevel(ing);
                  const alertColor = level === "critical" ? "#ef4444" : level === "low" ? "#f59e0b" : "#a78bfa";
                  const alertLabel = level === "critical" ? "Sin stock" : level === "low" ? "Bajo" : "X vencer";
                  return (
                    <div key={ing.id} className={styles.tableRow}>
                      <p className={styles.tableCell}>{ing.name}</p>
                      <p className={styles.tableCell} style={{ color: alertColor, fontWeight: 700 }}>{ing.currentStock}</p>
                      <p className={styles.tableCell} style={{ color: "var(--text-muted)" }}>{ing.minStock}</p>
                      <span className={styles.tableBadge} style={{ color: alertColor, background: `${alertColor}15` }}>{alertLabel}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Quick access modules */}
          <div className={styles.chartCard}>
            <p className={styles.chartTitle} style={{ marginBottom: 4 }}>Módulos</p>
            <p className={styles.chartSub} style={{ marginBottom: 18 }}>Acceso rápido</p>
            <div className={styles.modulesGrid}>
              {MODULES.map(({ icon, label, sub, href, color }) => (
                <div
                  key={label}
                  className={styles.moduleCard}
                  style={{ borderColor: `${color}20` }}
                  onClick={() => window.location.href = href}
                >
                  <p className={styles.moduleIcon}>{icon}</p>
                  <p className={styles.moduleLabel}>{label}</p>
                  <p className={styles.moduleSub}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
