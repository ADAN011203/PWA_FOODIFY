"use client";

import { useState, useMemo, useEffect } from "react";
import { StaffListSkeleton } from "@/components/ui/Skeletons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  getStaffApi,
  createStaffApi,
  updateStaffApi,
  updateStaffStatusApi,
  deleteStaffApi,
} from "@/lib/staffApi";
import type { StaffMember, StaffRole, StaffStatus } from "@/types/staff";
import { ROLE_CFG, STATUS_CFG } from "@/types/staff";
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
const ROLES: StaffRole[] = ["restaurant_admin", "manager", "waiter", "chef", "cashier"];
const STATUSES: StaffStatus[] = ["active", "inactive", "suspended"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtRelative(iso?: string) {
  if (!iso) return "Nunca";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Hace un momento";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)} día(s)`;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "waiter" as StaffRole,
  status: "active" as StaffStatus,
  branch: "Centro Histórico",
};
type StaffForm = typeof EMPTY_FORM;

// ─── Modal Staff Form ─────────────────────────────────────────────────────────
function StaffFormModal({
  member,
  isOpen,
  onClose,
  onSave,
}: {
  member: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: StaffForm, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StaffForm, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: member.status,
        branch: member.branch,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [member, isOpen]);

  const set = (key: keyof StaffForm, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Email inválido";
    if (!form.phone.trim()) e.phone = "Teléfono requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form, member?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const roleCfg = ROLE_CFG[form.role];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={member ? "✏️ Editar Empleado" : "➕ Nuevo Empleado"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input
          label="Nombre completo *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ej. Carlos Mendoza"
          error={errors.name}
        />
        <Input
          label="Correo electrónico *"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="nombre@foodify.mx"
          error={errors.email}
        />
        <Input
          label="Teléfono *"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="33 1234 5678"
          error={errors.phone}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select
            label="Rol *"
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_CFG[r].icon} {ROLE_CFG[r].label}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CFG[s].label}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Sucursal"
          value={form.branch}
          onChange={(e) => set("branch", e.target.value)}
          placeholder="Centro Histórico"
        />

        {/* Preview Rol */}
        <div
          style={{
            background: roleCfg.bg,
            border: `1px solid ${roleCfg.color}40`,
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>{roleCfg.icon}</span>
          <div>
            <p style={{ fontWeight: 700, color: roleCfg.color, fontSize: "0.875rem", margin: 0 }}>
              {roleCfg.label}
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
              {form.role === "restaurant_admin" && "Acceso total al panel administrativo"}
              {form.role === "manager" && "Gestión de operaciones y reportes"}
              {form.role === "waiter" && "Toma de pedidos y atención a mesas"}
              {form.role === "chef" && "Vista de cocina y gestión de comandas"}
              {form.role === "cashier" && "Cobro y cierre de órdenes"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="lg" fullWidth onClick={handleSave} loading={saving}>
            {member ? "Guardar cambios" : "Agregar empleado"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────
function StaffCard({ member, onTap }: { member: StaffMember; onTap: () => void }) {
  const roleCfg = ROLE_CFG[member.role];
  const statusCfg = STATUS_CFG[member.status];

  return (
    <Card
      hoverable
      onClick={onTap}
      tone={member.status === "suspended" ? "danger" : "default"}
      style={{ marginBottom: 10, opacity: member.status === "inactive" ? 0.65 : 1 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
        {/* Avatar */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            flexShrink: 0,
            background: roleCfg.bg,
            border: `2px solid ${roleCfg.color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.875rem",
            fontWeight: 800,
            color: roleCfg.color,
          }}
        >
          {member.avatarInitials ?? member.name.slice(0, 2).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p
              style={{
                fontWeight: 700,
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                margin: "0 0 4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {member.name}
            </p>
            <span
              style={{
                background: statusCfg.bg,
                color: statusCfg.color,
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                flexShrink: 0,
                marginLeft: 6,
              }}
            >
              ● {statusCfg.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                background: roleCfg.bg,
                color: roleCfg.color,
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {roleCfg.icon} {roleCfg.label}
            </span>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: 0 }}>
              {fmtRelative(member.lastLogin)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Modal detalle empleado ───────────────────────────────────────────────────
function StaffDetailModal({
  member,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  member: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: (id: string, status: StaffStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  if (!member) return null;
  const roleCfg = ROLE_CFG[member.role];
  const statusCfg = STATUS_CFG[member.status];

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); onClose(); } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title=" ">
      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: roleCfg.bg,
            border: `2px solid ${roleCfg.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem",
            fontWeight: 800,
            color: roleCfg.color,
          }}
        >
          {member.avatarInitials ?? member.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem", margin: 0 }}>
            {member.name}
          </p>
          <span
            style={{
              background: roleCfg.bg,
              color: roleCfg.color,
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: 999,
            }}
          >
            {roleCfg.icon} {roleCfg.label}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "📧", label: "Email", value: member.email },
          { icon: "📱", label: "Teléfono", value: member.phone },
          { icon: "🏢", label: "Sucursal", value: member.branch },
          { icon: "📅", label: "Alta", value: fmtDate(member.createdAt) },
          { icon: "🔐", label: "Último acceso", value: fmtRelative(member.lastLogin) },
          {
            icon: "●",
            label: "Estado",
            value: statusCfg.label,
            color: statusCfg.color,
          },
        ].map(({ icon, label, value, color }) => (
          <div
            key={label}
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              padding: "12px",
            }}
          >
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0 0 3px" }}>
              {icon} {label}
            </p>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: color ?? "var(--text-primary)",
                margin: 0,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <Button variant="primary" size="md" fullWidth onClick={onEdit} style={{ marginBottom: 10 }}>
        ✏️ Editar empleado
      </Button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {member.status === "active" ? (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            loading={loading}
            onClick={() => run(() => onToggleStatus(member.id, "suspended"))}
          >
            ⏸ Suspender
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            loading={loading}
            onClick={() => run(() => onToggleStatus(member.id, "active"))}
          >
            ▶ Activar
          </Button>
        )}
        <Button
          variant="danger"
          size="md"
          fullWidth
          loading={loading}
          onClick={() => run(() => onDelete(member.id))}
        >
          🗑️ Eliminar
        </Button>
      </div>

      <Button variant="ghost" size="md" fullWidth onClick={onClose}>
        Cerrar
      </Button>
    </Modal>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function AdminStaffPage() {
  const { user, isLoading } = useAdminGuard();
  const toast = useToast();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<StaffRole | "todos">("todos");
  const [filterStatus, setFilterStatus] = useState<StaffStatus | "todos">("todos");
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);

  useEffect(() => {
    if (!user) return;
    getStaffApi()
      .then(setStaff)
      .catch(() => toast.error("Error al cargar empleados"))
      .finally(() => setInitLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = staff;
    if (filterRole !== "todos") list = list.filter((s) => s.role === filterRole);
    if (filterStatus !== "todos") list = list.filter((s) => s.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }
    return list;
  }, [staff, filterRole, filterStatus, search]);

  if (isLoading || !user || initLoading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-app)" }}>
        <div
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border-light)",
            padding: "16px 20px",
            height: 64,
          }}
        />
        <StaffListSkeleton />
        <style>{`@keyframes sk-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }`}</style>
      </div>
    );
  }

  const handleSave = async (form: typeof EMPTY_FORM, id?: string) => {
    if (id) {
      const updated = await updateStaffApi(id, form);
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      toast.success("Empleado actualizado");
    } else {
      const payload = {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        password: "password123",
      };
      const newMember = await createStaffApi(payload);
      setStaff((prev) => [newMember, ...prev]);
      toast.success("Empleado agregado");
    }
    setShowForm(false);
    setEditMember(null);
    setSelected(null);
  };

  const handleToggleStatus = async (id: string, status: StaffStatus) => {
    await updateStaffStatusApi(id, status);
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    toast.success(`Empleado ${status === "active" ? "activado" : "suspendido"}`);
  };

  const handleDelete = async (id: string) => {
    await deleteStaffApi(id);
    setStaff((prev) => prev.filter((s) => s.id !== id));
    toast.success("Empleado eliminado");
  };

  const totalActive = staff.filter((s) => s.status === "active").length;
  const kpis = ROLES.map((r) => ({
    role: r,
    count: staff.filter((s) => s.role === r && s.status === "active").length,
  }));

  return (
    <AdminLayout
      title="Staff / Personal"
      subtitle={`👥 ${staff.length} empleados · ${totalActive} activos`}
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditMember(null);
            setShowForm(true);
          }}
        >
          ＋ Agregar
        </Button>
      }
    >
      {/* KPIs por rol */}
      <div
        className={ui.filterRow}
        style={{ marginBottom: 16, gap: 8 }}
      >
        {kpis.map(({ role, count }) => {
          const cfg = ROLE_CFG[role];
          return (
            <div
              key={role}
              style={{
                flexShrink: 0,
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                padding: "10px 16px",
                border: `1px solid ${cfg.color}30`,
                minWidth: 90,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "1.125rem", margin: "0 0 2px" }}>{cfg.icon}</p>
              <p style={{ fontSize: "1.1rem", fontWeight: 900, color: cfg.color, margin: "0 0 2px" }}>{count}</p>
              <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", margin: 0 }}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Búsqueda */}
      <div className={ui.searchBar}>
        <span className={ui.searchIcon}>🔍</span>
        <input
          className={ui.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
        />
      </div>

      {/* Filtros rol */}
      <div className={ui.filterRow}>
        <button
          className={`${ui.chip} ${filterRole === "todos" ? ui.active : ""}`}
          onClick={() => setFilterRole("todos")}
        >
          👥 Todos
        </button>
        {ROLES.map((r) => (
          <button
            key={r}
            className={`${ui.chip} ${filterRole === r ? ui.active : ""}`}
            onClick={() => setFilterRole(r)}
          >
            {ROLE_CFG[r].icon} {ROLE_CFG[r].label}
          </button>
        ))}
      </div>

      {/* Filtros estado */}
      <div className={ui.filterRow} style={{ marginBottom: 16 }}>
        {(["todos", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            className={`${ui.chip} ${filterStatus === s ? ui.active : ""}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === "todos" ? "Todos" : STATUS_CFG[s]?.label ?? s}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 10 }}>
        {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className={ui.emptyState}>
          <p className={ui.emptyIcon}>👥</p>
          <p className={ui.emptyText}>No se encontraron empleados</p>
        </div>
      ) : (
        filtered.map((member) => (
          <StaffCard key={member.id} member={member} onTap={() => setSelected(member)} />
        ))
      )}

      <div style={{ height: 24 }} />

      {/* Modales */}
      <StaffDetailModal
        member={selected}
        isOpen={!!selected && !showForm}
        onClose={() => setSelected(null)}
        onEdit={() => {
          setEditMember(selected);
          setShowForm(true);
          setSelected(null);
        }}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      <StaffFormModal
        member={editMember}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditMember(null);
        }}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}