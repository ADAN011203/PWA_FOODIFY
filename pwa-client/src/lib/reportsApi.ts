import { api } from "./api";

export type ReportPeriod = "today" | "week" | "month" | "quarter" | "year";

// ─── Ventas por día ───────────────────────────────────────────────────────────
export async function getSalesReportApi(period: ReportPeriod = "month"): Promise<{
  label: string; ventas: number; ordenes: number;
}[]> {
  const { data } = await api.get("/reports/sales", { params: { period } });
  const list = Array.isArray(data.data?.byDay) ? data.data.byDay : [];
  return list.map((d: Record<string, unknown>) => ({
    label:   String(d.date ?? d.label ?? ""),
    ventas:  Number(d.total ?? d.ventas ?? 0),
    ordenes: Number(d.orders ?? d.ordenes ?? 0),
  }));
}

// ─── Top platillos ────────────────────────────────────────────────────────────
export async function getTopDishesApi(limit = 5): Promise<{
  name: string; value: number; income: number;
}[]> {
  const { data } = await api.get("/reports/dishes/top", { params: { limit } });
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((d: Record<string, unknown>) => ({
    name:   String(d.name ?? d.dishName ?? ""),
    value:  Number(d.soldCount ?? d.quantity ?? 0),
    income: Number(d.income ?? d.total ?? 0),
  }));
}

// ─── Horas pico ──────────────────────────────────────────────────────────────
export async function getPeakHoursApi(): Promise<{
  hour: string; ordenes: number;
}[]> {
  const { data } = await api.get("/reports/peak-hours");
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((d: Record<string, unknown>) => ({
    hour:    `${String(d.hour ?? "0").padStart(2, "0")}:00`,
    ordenes: Number(d.orders ?? d.count ?? 0),
  }));
}

// ─── Ingresos por categoría ───────────────────────────────────────────────────
export async function getCategoryIncomeApi(): Promise<{
  name: string; value: number;
}[]> {
  const { data } = await api.get("/reports/category-income");
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((d: Record<string, unknown>) => ({
    name:  String(d.categoryName ?? d.name ?? ""),
    value: Number(d.income ?? d.total ?? 0),
  }));
}

// ─── KPIs del restaurante ─────────────────────────────────────────────────────
export async function getRestaurantDashboardApi(restaurantId: string): Promise<{
  salesToday: number;
  activeOrders: number;
  topDishes: { name: string; count: number }[];
  stockAlerts: number;
}> {
  try {
    const { data } = await api.get(`/restaurants/${restaurantId}/dashboard`);
    const d = data.data ?? {};
    return {
      salesToday:   Number(d.salesToday ?? d.sales_today ?? 0),
      activeOrders: Number(d.activeOrders ?? d.active_orders ?? 0),
      topDishes:    Array.isArray(d.topDishes) ? d.topDishes : [],
      stockAlerts:  Number(d.stockAlerts ?? d.stock_alerts ?? 0),
    };
  } catch {
    return { salesToday: 0, activeOrders: 0, topDishes: [], stockAlerts: 0 };
  }
}

// ─── Exportar reporte ─────────────────────────────────────────────────────────
export async function exportReportApi(
  type: "sales" | "dishes" | "inventory", 
  format: "csv" | "xlsx" = "xlsx",
  params?: { restaurantId?: string; period?: string }
): Promise<void> {
  const response = await api.get("/reports/export", {
    params: { type, format, ...params },
    responseType: "blob",
  });
  
  // Axios con responseType: 'blob' ya devuelve un objeto Blob en response.data
  const url  = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href  = url;
  link.setAttribute("download", `reporte-${type}-${new Date().toISOString().slice(0, 10)}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}