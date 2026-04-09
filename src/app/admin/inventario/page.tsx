"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  getInventoryItemsApi,
  createLotApi,
  createInventoryItemApi,
} from "@/lib/inventoryApi";
import type { Ingredient, IngredientBatch, StockAlertLevel } from "@/types/inventory";
import { getAlertLevel } from "@/types/inventory";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import ui from "@/components/ui/AdminUI.module.css";

// ─── Guard ────────────────────────────────────────────────────────────────────
function useAdminGuard() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin"))
      window.location.href = "/login";
  }, [isLoading, user]);
  return { user, isLoading };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ALERT_CFG: Record<StockAlertLevel, { color: string; bg: string; icon: string; label: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: "🔴", label: "Sin stock"  },
  low:      { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "🟡", label: "Stock bajo" },
  expiring: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)",icon: "🟣", label: "Por vencer" },
  ok:       { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  icon: "🟢", label: "OK"         },
};
const UNITS = ["kg", "g", "L", "ml", "pzas"];
const CATEGORIES = ["Carnes", "Granos", "Lácteos", "Verduras", "Frutas", "Aceites", "Bebidas", "Otro"];

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Modal detalle e ingrediente ──────────────────────────────────────────────
function IngredientDetailModal({
  ingredient,
  isOpen,
  onClose,
  onAddBatch,
}: {
  ingredient: Ingredient | null;
  isOpen: boolean;
  onClose: () => void;
  onAddBatch: (id: string, batch: Omit<IngredientBatch, "id" | "ingredientId" | "status">) => Promise<void>;
}) {
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState({ quantity: "", costPerUnit: "", expiryDate: "" });
  const [batchErrors, setBatchErrors] = useState<Partial<typeof batchForm>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowBatchForm(false);
      setBatchForm({ quantity: "", costPerUnit: "", expiryDate: "" });
      setBatchErrors({});
    }
  }, [ingredient?.id, isOpen]);

  if (!ingredient) return null;

  const alert = getAlertLevel(ingredient);
  const alertCfg = ALERT_CFG[alert];
  const activeBatches = [...ingredient.batches]
    .filter((b) => b.status === "active")
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  const validateBatch = () => {
    const e: typeof batchErrors = {};
    if (!batchForm.quantity || Number(batchForm.quantity) <= 0) e.quantity = "Cantidad inválida";
    if (!batchForm.costPerUnit || Number(batchForm.costPerUnit) <= 0) e.costPerUnit = "Costo inválido";
    setBatchErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddBatch = async () => {
    if (!validateBatch()) return;
    setSaving(true);
    try {
      await onAddBatch(ingredient.id, {
        quantity: Number(batchForm.quantity),
        costPerUnit: Number(batchForm.costPerUnit),
        entryDate: new Date().toISOString(),
        expiryDate: batchForm.expiryDate
          ? new Date(batchForm.expiryDate).toISOString()
          : undefined,
      });
      setBatchForm({ quantity: "", costPerUnit: "", expiryDate: "" });
      setShowBatchForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header ingrediente */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px" }}>
              {ingredient.name}
            </h2>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: "0.7rem", padding: "2px 10px", borderRadius: 999, fontWeight: 600 }}>
                {ingredient.category}
              </span>
              <span style={{ background: alertCfg.bg, color: alertCfg.color, fontSize: "0.7rem", padding: "2px 10px", borderRadius: 999, fontWeight: 700 }}>
                {alertCfg.icon} {alertCfg.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "var(--bg-input)", border: "none", color: "var(--text-secondary)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Stock resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Stock actual", value: `${ingredient.currentStock} ${ingredient.unit}`, color: alertCfg.color },
          { label: "Stock mínimo", value: `${ingredient.minStock} ${ingredient.unit}`, color: "var(--text-secondary)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 14 }}>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 900, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Lotes FIFO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          📦 Lotes FIFO
        </p>
        <Button variant="primary" size="sm" onClick={() => setShowBatchForm((v) => !v)}>
          {showBatchForm ? "Cancelar" : "+ Nuevo lote"}
        </Button>
      </div>

      {/* Formulario nuevo lote */}
      {showBatchForm && (
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: 16,
            marginBottom: 16,
            border: "1px solid rgba(255,107,53,0.25)",
          }}
        >
          <p style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "0.8125rem", marginBottom: 12, marginTop: 0 }}>
            📥 Registrar entrada de lote
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <Input
              label={`Cantidad (${ingredient.unit}) *`}
              type="number"
              value={batchForm.quantity}
              onChange={(e) => setBatchForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="0"
              error={batchErrors.quantity}
            />
            <Input
              label="Costo/unidad (MXN) *"
              type="number"
              value={batchForm.costPerUnit}
              onChange={(e) => setBatchForm((f) => ({ ...f, costPerUnit: e.target.value }))}
              placeholder="0.00"
              error={batchErrors.costPerUnit}
            />
          </div>
          <Input
            label="Fecha de vencimiento"
            type="date"
            value={batchForm.expiryDate}
            onChange={(e) => setBatchForm((f) => ({ ...f, expiryDate: e.target.value }))}
            style={{ colorScheme: "dark" } as React.CSSProperties}
          />
          <Button variant="primary" size="md" fullWidth onClick={handleAddBatch} loading={saving} style={{ marginTop: 12 }}>
            Confirmar entrada
          </Button>
        </div>
      )}

      {/* Lista de lotes */}
      {activeBatches.length === 0 ? (
        <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 20, textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>Sin lotes activos — registra una entrada</p>
        </div>
      ) : (
        activeBatches.map((batch, i) => {
          const days = batch.expiryDate ? daysUntil(batch.expiryDate) : null;
          const isExpiring = days !== null && days <= 3;
          const isExpired = days !== null && days < 0;
          return (
            <div
              key={batch.id}
              style={{
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                marginBottom: 8,
                border: `1px solid ${isExpired ? "rgba(239,68,68,0.4)" : isExpiring ? "rgba(167,139,250,0.4)" : "var(--border-light)"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  {i === 0 && (
                    <span style={{ background: "rgba(255,107,53,0.15)", color: "var(--color-primary)", fontSize: "0.6rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999, display: "block", marginBottom: 4 }}>
                      ⬆ PRIMERO EN SALIR
                    </span>
                  )}
                  <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.875rem", margin: "0 0 4px" }}>
                    {batch.quantity} {ingredient.unit}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
                    Entrada: {fmtDate(batch.entryDate)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "0.875rem", margin: "0 0 4px" }}>
                    ${batch.costPerUnit}/{ingredient.unit}
                  </p>
                  {batch.expiryDate && (
                    <p style={{ fontSize: "0.72rem", color: isExpired ? "#ef4444" : isExpiring ? "#a78bfa" : "#22c55e", margin: 0, fontWeight: 600 }}>
                      {isExpired ? "⚠ VENCIDO" : isExpiring ? `🟣 ${days}d` : `✓ ${fmtDate(batch.expiryDate)}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      <Button variant="secondary" size="md" fullWidth onClick={onClose} style={{ marginTop: 16 }}>
        Cerrar
      </Button>
    </Modal>
  );
}

// ─── Modal agregar ingrediente ─────────────────────────────────────────────────
function AddIngredientModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Ingredient, "id" | "batches" | "currentStock">) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", unit: "kg", minStock: "", category: "Carnes" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name: "", unit: "kg", minStock: "", category: "Carnes" });
    setErrors({});
  }, [isOpen]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!form.minStock || Number(form.minStock) <= 0) e.minStock = "Stock mínimo inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ name: form.name, unit: form.unit, minStock: Number(form.minStock), category: form.category });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Nuevo Ingrediente">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input
          label="Nombre *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ej. Jitomate"
          error={errors.name}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select
            label="Unidad *"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          >
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </Select>
          <Select
            label="Categoría *"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <Input
          label={`Stock mínimo (${form.unit}) *`}
          type="number"
          value={form.minStock}
          onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
          placeholder="0"
          error={errors.minStock}
          helper="Se activará alerta cuando el stock llegue a este nivel"
        />
        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="lg" fullWidth onClick={handleSave} loading={saving}>
            Agregar ingrediente
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Ingredient Card ──────────────────────────────────────────────────────────
function IngredientCard({ ingredient, onTap }: { ingredient: Ingredient; onTap: () => void }) {
  const alert = getAlertLevel(ingredient);
  const alertCfg = ALERT_CFG[alert];
  const pct = ingredient.minStock > 0
    ? Math.min(100, (ingredient.currentStock / ingredient.minStock) * 100)
    : 100;
  const expiringBatch = ingredient.batches.find(
    (b) => b.expiryDate && b.status === "active" && daysUntil(b.expiryDate) <= 3
  );

  return (
    <Card
      hoverable
      onClick={onTap}
      tone={alert === "critical" ? "danger" : alert === "low" ? "warning" : "default"}
      style={{ marginBottom: 10 }}
    >
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9375rem", margin: "0 0 4px" }}>
              {ingredient.name}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: "0.65rem", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                {ingredient.category}
              </span>
              <span style={{ background: alertCfg.bg, color: alertCfg.color, fontSize: "0.65rem", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
                {alertCfg.icon} {alertCfg.label}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: 900, color: alertCfg.color, fontSize: "1.125rem", margin: "0 0 2px" }}>
              {ingredient.currentStock}
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}> {ingredient.unit}</span>
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>mín. {ingredient.minStock} {ingredient.unit}</p>
          </div>
        </div>

        {/* Stock bar */}
        <div style={{ height: 5, background: "var(--bg-elevated)", borderRadius: 999, overflow: "hidden", marginBottom: expiringBatch ? 8 : 0 }}>
          <div
            style={{
              height: "100%",
              borderRadius: 999,
              width: `${pct}%`,
              background: alert === "critical" ? "#ef4444" : alert === "low" ? "#f59e0b" : "#22c55e",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {expiringBatch?.expiryDate && (
          <p style={{ fontSize: "0.72rem", color: "#a78bfa", margin: "6px 0 0", fontWeight: 600 }}>
            🟣 Vence en {daysUntil(expiringBatch.expiryDate)} día(s) — {fmtDate(expiringBatch.expiryDate)}
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function AdminInventarioPage() {
  const { user, isLoading } = useAdminGuard();
  const toast = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterAlert, setFilterAlert] = useState<StockAlertLevel | "todos">("todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    getInventoryItemsApi()
      .then(setIngredients)
      .catch(() => toast.error("Error al cargar inventario"))
      .finally(() => setInitLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = ingredients;
    if (filterAlert !== "todos") list = list.filter((i) => getAlertLevel(i) === filterAlert);
    if (search)
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase())
      );
    return list;
  }, [ingredients, filterAlert, search]);

  if (isLoading || !user || initLoading) {
    return (
      <div className={ui.spinnerPage}>
        <div className={ui.spinner} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const criticalCount = ingredients.filter((i) => getAlertLevel(i) === "critical").length;
  const lowCount = ingredients.filter((i) => getAlertLevel(i) === "low").length;
  const expiringCount = ingredients.filter((i) => getAlertLevel(i) === "expiring").length;

  const handleAddBatch = async (
    ingredientId: string,
    batch: Omit<IngredientBatch, "id" | "ingredientId" | "status">
  ) => {
    const created = await createLotApi(ingredientId, batch);
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id !== ingredientId
          ? ing
          : { ...ing, currentStock: ing.currentStock + created.quantity, batches: [...ing.batches, created] }
      )
    );
    setSelected((prev) =>
      prev?.id !== ingredientId
        ? prev
        : { ...prev, currentStock: prev.currentStock + created.quantity, batches: [...prev.batches, created] }
    );
    toast.success("Lote registrado y stock actualizado");
  };

  const handleAddIngredient = async (data: Omit<Ingredient, "id" | "batches" | "currentStock">) => {
    const newIng = await createInventoryItemApi(data);
    setIngredients((prev) => [newIng, ...prev]);
    toast.success("Ingrediente agregado");
  };

  return (
    <AdminLayout
      title="Inventario"
      subtitle={`📦 ${ingredients.length} ingredientes · FIFO activo`}
      actions={
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          ＋ Ingrediente
        </Button>
      }
    >
      {/* Alerta crítica */}
      {(criticalCount > 0 || expiringCount > 0) && (
        <div className={`${ui.alertBanner} ${ui.danger}`}>
          <p className={ui.alertTitle}>⚠️ Atención requerida</p>
          <div className={ui.alertTags}>
            {criticalCount > 0 && <span className={ui.alertTag} style={{ color: "#ef4444" }}>🔴 {criticalCount} sin stock</span>}
            {lowCount > 0 && <span className={ui.alertTag} style={{ color: "#f59e0b" }}>🟡 {lowCount} stock bajo</span>}
            {expiringCount > 0 && <span className={ui.alertTag} style={{ color: "#a78bfa" }}>🟣 {expiringCount} por vencer</span>}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className={`${ui.grid} ${ui.cols4}`}>
        {[
          { label: "Total", value: ingredients.length, color: "var(--text-primary)" },
          { label: "Sin stock", value: criticalCount, color: "#ef4444" },
          { label: "Stock bajo", value: lowCount, color: "#f59e0b" },
          { label: "X vencer", value: expiringCount, color: "#a78bfa" },
        ].map(({ label, value, color }) => (
          <div key={label} className={ui.kpi}>
            <p className={ui.kpiValue} style={{ color }}>{value}</p>
            <p className={ui.kpiLabel}>{label}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className={ui.searchBar}>
        <span className={ui.searchIcon}>🔍</span>
        <input
          className={ui.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ingrediente o categoría..."
        />
      </div>

      {/* Filtros */}
      <div className={ui.filterRow}>
        {(["todos", "critical", "low", "expiring", "ok"] as const).map((key) => (
          <button
            key={key}
            className={`${ui.chip} ${filterAlert === key ? ui.active : ""}`}
            onClick={() => setFilterAlert(key)}
          >
            {key === "todos" ? "📦 Todos" : `${ALERT_CFG[key].icon} ${ALERT_CFG[key].label}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className={ui.emptyState}>
          <p className={ui.emptyIcon}>📦</p>
          <p className={ui.emptyText}>No se encontraron ingredientes</p>
        </div>
      ) : (
        filtered.map((ing) => (
          <IngredientCard key={ing.id} ingredient={ing} onTap={() => setSelected(ing)} />
        ))
      )}

      <div style={{ height: 24 }} />

      {/* Modales */}
      <IngredientDetailModal
        ingredient={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onAddBatch={handleAddBatch}
      />

      <AddIngredientModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAddIngredient}
      />
    </AdminLayout>
  );
}