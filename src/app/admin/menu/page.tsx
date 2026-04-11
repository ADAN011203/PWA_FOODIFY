"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { FoodSpinner } from "@/components/ui/FoodSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  getDishesApi,
  createDishApi,
  updateDishApi,
  deleteDishApi,
  toggleDishAvailabilityApi,
  getAdminCategoriesApi,
} from "@/lib/menuApi";
import type { Dish, Category } from "@/types/menu";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import ui from "@/components/ui/AdminUI.module.css";

// ─── Guard de rol ──────────────────────────────────────────────────────────────
function useAdminGuard() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin"))
      window.location.href = "/login";
  }, [isLoading, user]);
  return { user, isLoading };
}

// ─── Formulario vacío ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  imageUrl: "",
  prepTime: "",
  isAvailable: true,
  badge: "" as "" | "Popular" | "Nuevo" | "Chef",
};
type DishForm = typeof EMPTY_FORM;

// ─── Modal formulario ─────────────────────────────────────────────────────────
function DishFormModal({
  dish,
  categories,
  isOpen,
  onClose,
  onSave,
}: {
  dish: Dish | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: DishForm, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<DishForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof DishForm, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dish) {
      setForm({
        name: dish.name,
        description: dish.description,
        price: String(dish.price),
        categoryId: dish.categoryId,
        imageUrl: dish.imageUrl ?? "",
        prepTime: String(dish.prepTime ?? ""),
        isAvailable: dish.isAvailable,
        badge: dish.badge ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [dish, isOpen]);

  const set = (key: keyof DishForm, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "El nombre es requerido";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      e.price = "Precio inválido";
    if (!form.categoryId) e.categoryId = "Selecciona una categoría";
    if (!form.description.trim()) e.description = "La descripción es requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form, dish?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dish ? "✏️ Editar Platillo" : "➕ Nuevo Platillo"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input
          label="Nombre del platillo *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ej. Tacos al Pastor"
          error={errors.name}
        />

        <div>
          <label
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              display: "block",
              marginBottom: 5,
            }}
          >
            Descripción *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe el platillo..."
            rows={3}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "var(--radius-md)",
              border: `1.5px solid ${errors.description ? "var(--status-error)" : "var(--bg-input)"}`,
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-family)",
              fontSize: "0.9rem",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.description && (
            <p style={{ fontSize: "0.7rem", color: "var(--status-error)", marginTop: 3 }}>
              {errors.description}
            </p>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Precio (MXN) *"
            type="number"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="0.00"
            error={errors.price}
          />
          <Select
            label="Categoría *"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            error={errors.categoryId}
          >
            <option value="">Seleccionar...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Tiempo de prep. (min)"
            type="number"
            value={form.prepTime}
            onChange={(e) => set("prepTime", e.target.value)}
            placeholder="Ej. 15"
          />
          <Select
            label="Badge"
            value={form.badge}
            onChange={(e) => set("badge", e.target.value)}
          >
            <option value="">Sin badge</option>
            <option value="Popular">⭐ Popular</option>
            <option value="Nuevo">🆕 Nuevo</option>
            <option value="Chef">👨‍🍳 Chef</option>
          </Select>
        </div>

        <Input
          label="Foto principal (URL)"
          value={form.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
          placeholder="https://..."
        />
        {form.imageUrl?.startsWith("content://") && (
          <p style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: -10, marginBottom: 16 }}>
            ⚠️ Imagen local de app móvil. Para cambiarla en la PWA, escribe una URL de internet.
          </p>
        )}

        {form.imageUrl && (
          <div
            style={{
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              height: 110,
              border: "1px solid var(--border-light)",
              marginBottom: 16,
            }}
          >
            {form.imageUrl.startsWith("content://") ? (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-input)" }}>
                <span style={{ fontSize: "2rem" }}>📱</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>Foto de celular</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
        )}

        {/* Toggle disponible */}
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid var(--border-light)",
          }}
        >
          <div>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9375rem", margin: 0 }}>
              Disponible en menú
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
              Los clientes pueden ver y ordenar este platillo
            </p>
          </div>
          <button
            onClick={() => set("isAvailable", !form.isAvailable)}
            style={{
              width: 50,
              height: 28,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: form.isAvailable ? "var(--status-success)" : "var(--bg-input)",
              position: "relative",
              transition: "background 0.25s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 4,
                left: form.isAvailable ? 26 : 4,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "white",
                transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="lg" fullWidth onClick={handleSave} loading={saving}>
            {dish ? "Guardar cambios" : "Agregar platillo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal: confirmar eliminación ─────────────────────────────────────────────
function ConfirmDeleteModal({
  name,
  isOpen,
  onClose,
  onConfirm,
}: {
  name: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "1.75rem",
          }}
        >
          🗑️
        </div>
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          ¿Eliminar platillo?
        </h3>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Estás a punto de eliminar{" "}
          <strong style={{ color: "var(--text-primary)" }}>{name}</strong>. Esta
          acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={handleConfirm}
            loading={loading}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Dish Card ────────────────────────────────────────────────────────────────
const BADGE_CFG = {
  Popular: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  Nuevo:   { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  Chef:    { bg: "rgba(255,107,53,0.15)", color: "#FF6B35" },
};

function DishCard({
  dish,
  onEdit,
  onDelete,
  onToggle,
}: {
  dish: Dish;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const badge = dish.badge ? BADGE_CFG[dish.badge] : null;

  return (
    <Card
      tone={!dish.isAvailable ? "default" : "default"}
      style={{ marginBottom: 10, opacity: dish.isAvailable ? 1 : 0.6 }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Imagen */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {dish.imageUrl && !dish.imageUrl.startsWith("content://") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dish.imageUrl}
              alt={dish.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              {dish.imageUrl?.startsWith("content://") ? "📱" : "🍽️"}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {dish.name}
                </p>
                {badge && (
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 999,
                      flexShrink: 0,
                    }}
                  >
                    {dish.badge}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  margin: "0 0 6px",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical" as const,
                }}
              >
                {dish.description}
              </p>
              <p
                style={{
                  fontWeight: 800,
                  color: "var(--color-primary)",
                  fontSize: "0.9375rem",
                  margin: 0,
                }}
              >
                ${dish.price}
              </p>
            </div>

            {/* Toggle disponible */}
            <button
              onClick={onToggle}
              title={dish.isAvailable ? "Desactivar" : "Activar"}
              style={{
                width: 42,
                height: 24,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: dish.isAvailable ? "var(--status-success)" : "var(--bg-input)",
                position: "relative",
                transition: "background 0.25s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: dish.isAvailable ? 21 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              />
            </button>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              ✏️ Editar
            </Button>
            <Button variant="danger" size="sm" onClick={onDelete}>
              🗑️
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function AdminMenuPage() {
  const { user, isLoading } = useAdminGuard();
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("todos");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editDish, setEditDish] = useState<Dish | null>(null);
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getDishesApi(), getAdminCategoriesApi()])
      .then(([dishesRes, categoriesRes]) => {
        setDishes(dishesRes);
        setCategories(categoriesRes);
      })
      .catch(() => toast.error("Error al cargar el menú"))
      .finally(() => setInitLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !user || initLoading) return <FoodSpinner />;

  const filtered = dishes.filter((d) => {
    const matchCat = activeCat === "todos" || String(d.categoryId) === activeCat;
    const matchSearch =
      !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = async (form: DishForm, id?: string) => {
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      categoryId: form.categoryId,
      imageUrl: form.imageUrl || undefined,
      isAvailable: form.isAvailable,
      badge: form.badge || undefined,
      prepTime: Number(form.prepTime) || 15,
    };
    if (id) {
      const updated = await updateDishApi(id, payload);
      setDishes((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
      toast.success("Platillo actualizado");
    } else {
      const created = await createDishApi(payload);
      setDishes((prev) => [created, ...prev]);
      toast.success("Platillo agregado al menú");
    }
    setEditDish(null);
    setShowForm(false);
  };

  const handleToggle = async (dish: Dish) => {
    try {
      await toggleDishAvailabilityApi(dish.id, !dish.isAvailable);
      setDishes((prev) =>
        prev.map((d) => (d.id === dish.id ? { ...d, isAvailable: !d.isAvailable } : d))
      );
      toast.success(dish.isAvailable ? "Platillo desactivado" : "Platillo activado");
    } catch {
      toast.error("Error al cambiar disponibilidad");
    }
  };

  const handleDelete = async () => {
    if (!dishToDelete) return;
    await deleteDishApi(dishToDelete.id);
    setDishes((prev) => prev.filter((d) => d.id !== dishToDelete.id));
    toast.success("Platillo eliminado");
    setDishToDelete(null);
  };

  const cats = [{ id: "todos", name: "Todos", emoji: "" }, ...categories];
  const total = dishes.length;
  const activos = dishes.filter((d) => d.isAvailable).length;

  return (
    <AdminLayout
      title="Gestión de Menú"
      subtitle={`🍽️ ${total} platillos · ${activos} activos`}
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditDish(null);
            setShowForm(true);
          }}
        >
          ＋ Agregar
        </Button>
      }
    >
      {/* KPIs */}
      <div className={`${ui.grid} ${ui.cols3}`}>
        {[
          { label: "Total", value: total, color: "var(--text-primary)" },
          { label: "Activos", value: activos, color: "var(--status-success)" },
          { label: "Inactivos", value: total - activos, color: "var(--text-muted)" },
        ].map(({ label, value, color }) => (
          <div key={label} className={ui.kpi}>
            <p className={ui.kpiValue} style={{ color }}>
              {value}
            </p>
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
          placeholder="Buscar platillo..."
        />
      </div>

      {/* Filtros por categoría */}
      <div className={ui.filterRow}>
        {cats.map(({ id, name, emoji }) => (
          <button
            key={id}
            className={`${ui.chip} ${activeCat === id ? ui.active : ""}`}
            onClick={() => setActiveCat(id)}
          >
            {emoji} {name}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className={ui.emptyState}>
          <p className={ui.emptyIcon}>🍽️</p>
          <p className={ui.emptyText}>No se encontraron platillos</p>
        </div>
      ) : (
        filtered.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onEdit={() => {
              setEditDish(dish);
              setShowForm(true);
            }}
            onDelete={() => setDishToDelete(dish)}
            onToggle={() => handleToggle(dish)}
          />
        ))
      )}

      <div style={{ height: 24 }} />

      {/* Modales */}
      <DishFormModal
        dish={editDish}
        categories={categories}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditDish(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        name={dishToDelete?.name ?? ""}
        isOpen={!!dishToDelete}
        onClose={() => setDishToDelete(null)}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}