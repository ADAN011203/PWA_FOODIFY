// src/components/EmptyState.tsx
import { FC } from "react";

interface Props {
  title: string;
  description?: string;
  /** Emoji opcional para mostrar. Por defecto es 📭 */
  icon?: string;
}

export const EmptyState: FC<Props> = ({ title, description, icon }) => (
  <section style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    background: "#1a1d21",
    borderRadius: "16px",
    border: "2px dashed #2e3238",
    textAlign: "center",
    margin: "16px 0",
    color: "#f0ede8"
  }}>
    <span style={{ fontSize: "3.5rem", marginBottom: "16px", opacity: 0.9 }}>
      {icon ? icon : "📭"}
    </span>
    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px" }}>{title}</h2>
    {description && (
      <p style={{ color: "#8a8f98", fontSize: "0.9375rem", margin: 0, maxWidth: "400px", lineHeight: 1.5 }}>
        {description}
      </p>
    )}
  </section>
);
