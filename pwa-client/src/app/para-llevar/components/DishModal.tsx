"use client";

import { useState } from "react";
import { IconX, IconMinus, IconPlus, IconShoppingCart, IconUtensils } from "@/components/ui/Icons";
import type { Dish } from "@/types/menu";

interface DishModalProps {
  dish: Dish;
  onClose: () => void;
  onAdd: (dish: Dish, qty: number) => void;
  dark?: boolean;
}

export default function DishModal({ dish, onClose, onAdd, dark }: DishModalProps) {
  const [qty, setQty] = useState(1);

  const bg = dark ? "#1a1d21" : "#ffffff";
  const text = dark ? "#f0ede8" : "#2C1810";
  const muted = dark ? "#8a8f98" : "#9B7B6B";

  return (
    <div 
      className="anim-fade-in"
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div 
        className="anim-slide-up"
        style={{
          background: bg, width: "100%", maxWidth: 600,
          borderRadius: "32px 32px 0 0", overflow: "hidden",
          maxHeight: "94vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -20px 40px rgba(0,0,0,0.2)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header / Image Section */}
        <div style={{ position: "relative", height: 280, background: dark ? "#24282d" : "#f3f3f3" }}>
          {dish.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dish.imageUrl} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#333" : "#ccc" }}>
              <IconUtensils size={80} />
            </div>
          )}
          
          <div style={{ 
            position: "absolute", inset: 0, 
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.4) 100%)" 
          }} />

          <button 
            onClick={onClose}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)", border: "none",
              color: "white", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)"
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content Section */}
        <div style={{ padding: 32, flex: 1, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: text, margin: 0, lineHeight: 1.1 }}>{dish.name}</h2>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {dish.badge && (
                  <span style={{ 
                    background: "rgba(255,107,53,0.1)", color: "#FF6B35",
                    padding: "4px 10px", borderRadius: 8, fontSize: "0.7rem", fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.05em"
                  }}>
                    {dish.badge}
                  </span>
                )}
                <span style={{ 
                  background: dark ? "#2a2e35" : "#f3f4f6", color: text,
                  padding: "4px 10px", borderRadius: 8, fontSize: "0.7rem", fontWeight: 700 
                }}>
                  ⏱ {dish.prepTime || 15} min
                </span>
              </div>
            </div>
            <span style={{ fontSize: "1.75rem", fontWeight: 900, color: "#FF6B35" }}>${dish.price}</span>
          </div>
          
          <div style={{ 
            height: 2, width: 40, background: "#FF6B35", 
            borderRadius: 2, marginBottom: 20 
          }} />

          <p style={{ 
            color: muted, lineHeight: 1.7, fontSize: "1rem", 
            marginBottom: 32, fontWeight: 500 
          }}>
            {dish.description || "Un platillo preparado con los más altos estándares de calidad y frescura."}
          </p>

          {/* Selector de Cantidad Premium */}
          <div style={{ 
            display: "flex", alignItems: "center", justifyContent: "space-between", 
            background: dark ? "#1a1d21" : "#f8f9fa", 
            padding: "16px 24px", borderRadius: 24, marginBottom: 12,
            border: `1px solid ${dark ? "#2e3238" : "#eee"}`
          }}>
            <span style={{ fontWeight: 800, color: text, fontSize: "1rem" }}>Cantidad</span>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <button 
                onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{ 
                  width: 44, height: 44, borderRadius: 14, 
                  border: `2px solid ${qty > 1 ? "#FF6B35" : (dark ? "#333" : "#ddd")}`, 
                  background: "transparent", color: qty > 1 ? "#FF6B35" : muted, 
                  cursor: qty > 1 ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                <IconMinus size={20} />
              </button>
              <span style={{ fontSize: "1.5rem", fontWeight: 900, color: text, minWidth: 32, textAlign: "center" }}>{qty}</span>
              <button 
                onClick={() => setQty(q => q + 1)}
                style={{ 
                  width: 44, height: 44, borderRadius: 14, background: "#FF6B35", 
                  border: "none", color: "white", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(255,107,53,0.3)",
                  transition: "transform 0.2s"
                }}
              >
                <IconPlus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div style={{ 
          padding: "24px 32px 48px", 
          background: dark ? "#1a1d21" : "#fff",
          borderTop: `1px solid ${dark ? "#2e3238" : "#f1f1f1"}`
        }}>
          <button 
            onClick={() => onAdd(dish, qty)}
            disabled={!dish.isAvailable}
            style={{
              width: "100%", background: dish.isAvailable ? "#FF6B35" : "#4b5563",
              color: "white", border: "none", padding: "20px", borderRadius: 20,
              fontWeight: 900, fontSize: "1.15rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              boxShadow: dish.isAvailable ? "0 10px 25px rgba(255,107,53,0.4)" : "none",
              transition: "all 0.2s"
            }}
          >
            <IconShoppingCart size={24} />
            {dish.isAvailable ? `Agregar al Carrito · $${dish.price * qty}` : "No Disponible"}
          </button>
        </div>
      </div>
    </div>
  );
}
