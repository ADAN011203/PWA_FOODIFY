"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  getSalesReportApi, getTopDishesApi, getPeakHoursApi,
  getCategoryIncomeApi, exportReportApi,
} from "@/lib/reportsApi";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import ui from "@/components/ui/AdminUI.module.css";
import { ErrorAlert } from "@/components/ErrorAlert";
import { FoodSpinner } from "@/components/ui/FoodSpinner";

// ─── Guard ────────────────────────────────────────────────────────────────────
function useAdminGuard() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin"))
      window.location.href = "/login";
  }, [isLoading, user]);
  return { user, isLoading };
}



const PIE_COLORS = ["#FF6B35", "#6366f1", "#22c55e", "#f59e0b", "#ec4899"];
type Period = "today" | "week" | "month" | "quarter";
const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy", week: "Esta semana", month: "Este mes", quarter: "Este trimestre",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name: string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-app)", border: "1px solid var(--border-light)", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 6px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-primary)", margin: "2px 0" }}>
          {typeof p.value === "number" && p.value > 100 ? `$${p.value.toLocaleString("es-MX")}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportesPage() {
  const { user, isLoading } = useAdminGuard();
  const [period, setPeriod]           = useState<Period>("month");
  const [salesData, setSalesData]     = useState<{ label: string; ventas: number; ordenes: number }[]>([]);
  const [topDishes, setTopDishes]     = useState<{ name: string; value: number; income: number }[]>([]);
  const [peakHours, setPeakHours]     = useState<{ hour: string; ordenes: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [exporting, setExporting]     = useState(false);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoadingData(true);
    setErrorMsg(null);
    try {
      const [sales, top, hours, cats] = await Promise.allSettled([
        getSalesReportApi(period),
        getTopDishesApi(5),
        getPeakHoursApi(),
        getCategoryIncomeApi(),
      ]);
      if (sales.status === "fulfilled") setSalesData(sales.value);
      if (top.status === "fulfilled")   setTopDishes(top.value);
      if (hours.status === "fulfilled") setPeakHours(hours.value);
      if (cats.status === "fulfilled")  setCategoryData(cats.value);
    } catch {
      setErrorMsg("Ocurrió un error al cargar algunos datos");
    } finally {
      setLoadingData(false);
    }
  }, [period]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const totalVentas  = useMemo(() => (salesData ?? []).reduce((s, d) => s + d.ventas, 0), [salesData]);
  const totalOrdenes = useMemo(() => (salesData ?? []).reduce((s, d) => s + d.ordenes, 0), [salesData]);
  const ticketProm   = totalOrdenes > 0 ? Math.round(totalVentas / totalOrdenes) : 0;

  const handleExport = async (type: "sales" | "dishes" | "inventory") => {
    setExporting(true);
    try { 
      await exportReportApi(type, "xlsx"); 
    } catch (e: any) { 
      if (e.response?.status === 403) alert("Exportar datos avanzados requiere Plan Premium");
      else alert("Error al exportar"); 
    } finally { 
      setExporting(false); 
    }
  };

  if (isLoading || !user) return <FoodSpinner />;
  
  if (errorMsg) {
    return (
      <AdminLayout title="Reportes" subtitle="Análisis en tiempo real">
        <div className={ui.page}>
          <div style={{ marginTop: 20 }}>
            <ErrorAlert message={errorMsg} onRetry={() => window.location.reload()} />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const card = {
    background: "var(--bg-card)",
    borderRadius: "var(--radius-lg)",
    padding: "22px 24px",
    border: "1px solid var(--border-light)",
    marginBottom: 14,
  };

  return (
    <AdminLayout
      title="Reportes"
      subtitle={loadingData ? "Cargando datos..." : "Datos en tiempo real del backend"}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleExport("sales")}
          loading={exporting}
          style={{ color: "var(--status-success)", borderColor: "rgba(34,197,94,0.3)" }}
        >
          ⬇ Exportar
        </Button>
      }
    >
      {/* Período */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: "1.25rem", fontWeight: 900, margin: "0 0 3px", letterSpacing: "-0.03em", background: "linear-gradient(135deg, var(--text-primary), var(--text-secondary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Análisis del negocio
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 4 }}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: period === p ? "var(--color-primary)" : "transparent",
              color: period === p ? "white" : "var(--text-muted)",
              fontWeight: period === p ? 700 : 500,
              fontSize: "0.78rem", fontFamily: "var(--font-family)", transition: "all 0.2s",
            }}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className={`${ui.grid} ${ui.cols3}`} style={{ marginBottom: 16 }}>
        {[
          { icon: "💰", label: "Ventas totales",  value: `$${totalVentas.toLocaleString("es-MX")}`, color: "var(--status-success)" },
          { icon: "📋", label: "Total órdenes",   value: String(totalOrdenes),                       color: "#6366f1" },
          { icon: "🧾", label: "Ticket promedio", value: `$${ticketProm.toLocaleString("es-MX")}`,  color: "var(--color-primary)" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: "18px 20px", border: `1px solid ${color}30` }}>
            <p style={{ fontSize: "1.25rem", margin: "0 0 10px" }}>{icon}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color, margin: "0 0 4px", letterSpacing: "-0.04em" }}>{value}</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>{label} · {PERIOD_LABELS[period]}</p>
          </div>
        ))}
      </div>

      {/* Bar chart ventas */}
      <div style={card}>
        <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: "0 0 2px" }}>📊 Ventas por día</p>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 20px" }}>{PERIOD_LABELS[period]} · en MXN</p>
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

      {/* Top platillos + Categorías */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ ...card, marginBottom: 0 }}>
          <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: "0 0 2px" }}>🍽️ Top platillos</p>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 14px" }}>Más vendidos del período</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ResponsiveContainer width="45%" height={150}>
              <PieChart>
                <Pie data={topDishes} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={30} paddingAngle={3}>
                  {topDishes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} uds`, ""]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {topDishes.map((d, i) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</p>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>{d.value} uds · ${d.income?.toLocaleString("es-MX") ?? 0}</p>
                  </div>
                </div>
              ))}
              {topDishes.length === 0 && <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>Sin datos aún</p>}
            </div>
          </div>
        </div>

        <div style={{ ...card, marginBottom: 0 }}>
          <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: "0 0 2px" }}>📂 Ingresos por categoría</p>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 14px" }}>Distribución de ventas</p>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickLine={false} axisLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="value" name="Ingresos" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Horas pico */}
      <div style={card}>
        <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: "0 0 2px" }}>⏰ Horas pico</p>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 18px" }}>Pedidos por hora del día</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={peakHours} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-elevated)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="ordenes" name="Órdenes" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Exportar */}
      <div style={card}>
        <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: "0 0 2px" }}>⬇ Exportar reportes</p>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 16px" }}>Descarga en formato Excel</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { type: "sales" as const,     label: "📊 Ventas",     color: "var(--status-success)" },
            { type: "dishes" as const,    label: "🍽️ Platillos", color: "var(--color-primary)" },
            { type: "inventory" as const, label: "📦 Inventario", color: "#6366f1" },
          ].map(({ type, label, color }) => (
            <button
              key={type}
              onClick={() => handleExport(type)}
              disabled={exporting}
              style={{
                background: `color-mix(in srgb, ${color} 10%, transparent)`,
                color,
                border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                padding: "10px 20px",
                borderRadius: "var(--radius-md)",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: exporting ? "not-allowed" : "pointer",
                fontFamily: "var(--font-family)",
                opacity: exporting ? 0.6 : 1,
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </AdminLayout>
  );
}