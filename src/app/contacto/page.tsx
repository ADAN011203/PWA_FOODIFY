"use client";

import { useTheme } from "@/context/ThemeContext";
import { PageHeader } from "@/components/layout/TabBar";
import { IconChevronRight } from "@/components/ui/Icons";

const INFO = [
  {
    emoji: "📍",
    label: "Dirección",
    value: "Av. Reforma 123, Centro Histórico, CDMX",
    href: "https://maps.google.com/?q=Av+Reforma+123+CDMX",
  },
  {
    emoji: "📞",
    label: "Teléfono",
    value: "+52 55 1234 5678",
    href: "tel:+525512345678",
  },
  {
    emoji: "🕐",
    label: "Horario",
    value: "Lun – Dom: 8:00 am – 10:00 pm",
    href: undefined,
  },
  {
    emoji: "✉️",
    label: "Correo",
    value: "contacto@foodify.mx",
    href: "mailto:contacto@foodify.mx",
  },
];

const REDES = [
  { label: "Instagram", emoji: "📷" },
  { label: "Facebook",  emoji: "👍" },
  { label: "WhatsApp",  emoji: "💬" },
];

export default function ContactoPage() {
  const { dark } = useTheme();

  const bg      = dark ? "#121212" : "#FFF0DC";
  const cardBg  = dark ? "#1a1a1a" : "#ffffff";
  const text    = dark ? "#f0ede8" : "#1a1a1a";
  const mutedC  = dark ? "#6b7280" : "#9B7B6B";
  const iconBg  = dark ? "#2a1810" : "#fff1e8";
  const chipBg  = dark ? "#2e2e2e" : "#f3f4f6";

  return (
    <div style={{ background: bg, minHeight: "100dvh" }}>
      <PageHeader title="Contacto" subtitle="Información y ubicación" />

      <div style={{ padding: "16px" }}>

        {/* ── Hero naranja ── */}
        <div style={{
          background: "#FF6B35", borderRadius: 20,
          padding: "28px 24px", textAlign: "center", marginBottom: 16,
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", marginBottom: 6 }}>
            Foodify Restaurant
          </h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem", fontWeight: 500 }}>
            Auténtica comida mexicana
          </p>
        </div>

        {/* ── Tarjetas de info ── */}
        {INFO.map(({ emoji, label, value, href }) => (
          <div
            key={label}
            onClick={() => href && window.open(href, "_blank")}
            style={{
              background: cardBg, borderRadius: 16, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 16, marginBottom: 12,
              cursor: href ? "pointer" : "default",
              boxShadow: dark ? "none" : "0 1px 8px rgba(44,24,16,0.06)",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: iconBg, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem",
            }}>
              {emoji}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.75rem", color: mutedC, fontWeight: 600, marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: "0.9375rem", color: text, fontWeight: 600, lineHeight: 1.4 }}>{value}</p>
            </div>
            {href && <IconChevronRight size={16} color={mutedC} />}
          </div>
        ))}

        {/* ── Redes sociales ── */}
        <div style={{
          background: cardBg, borderRadius: 16, padding: "18px 20px", marginBottom: 12,
          boxShadow: dark ? "none" : "0 1px 8px rgba(44,24,16,0.06)",
        }}>
          <p style={{ fontSize: "0.75rem", color: mutedC, fontWeight: 600, marginBottom: 14 }}>Síguenos</p>
          <div style={{ display: "flex", gap: 12 }}>
            {REDES.map(({ label, emoji }) => (
              <button
                key={label}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
                  background: chipBg, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>{emoji}</span>
                <span style={{ fontSize: "0.7rem", color: mutedC, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Mapa placeholder ── */}
        <div style={{
          background: cardBg, borderRadius: 16, overflow: "hidden", marginBottom: 12,
          boxShadow: dark ? "none" : "0 1px 8px rgba(44,24,16,0.06)",
        }}>
          <div style={{
            height: 160, background: dark ? "#1e2a1e" : "#e8f5e9",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span style={{ fontSize: "2.5rem" }}>🗺️</span>
            <p style={{ color: mutedC, fontSize: "0.875rem" }}>Ver en Google Maps</p>
          </div>
          <div style={{ padding: "14px 20px" }}>
            <p style={{ fontWeight: 700, color: text, marginBottom: 2 }}>Centro Histórico, CDMX</p>
            <p style={{ color: mutedC, fontSize: "0.8125rem" }}>
              Av. Reforma 123 · A 2 min del Metro Hidalgo
            </p>
          </div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
