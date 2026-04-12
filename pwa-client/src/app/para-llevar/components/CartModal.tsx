"use client";

import { useState } from "react";
import { IconX, IconMinus, IconPlus, IconTrash, IconBag, IconUtensils, IconChevronLeft } from "@/components/ui/Icons";
import type { CartItem } from "@/types/menu";

interface CartModalProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onOrder: (name: string) => void;
  dark?: boolean;
}

export default function CartModal({ cart, onClose, onUpdateQty, onRemove, onOrder, dark }: CartModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [step, setStep] = useState<"review" | "checkout">("review");

  const total = cart.reduce((s, i) => s + i.dish.price * i.qty, 0);
  const bg = dark ? "#1a1d21" : "#ffffff";
  const itemBg = dark ? "#24282d" : "#f8f9fa";
  const text = dark ? "#f0ede8" : "#2C1810";
  const muted = dark ? "#8a8f98" : "#9B7B6B";

  return (
    <div 
      className="anim-fade-in"
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center"
      }}
      onClick={onClose}
    >
      <div 
        className="anim-slide-up"
        style={{
          background: bg, width: "100%", maxWidth: 600,
          borderRadius: "32px 32px 0 0", overflow: "hidden",
          maxHeight: "92vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.2)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Notch */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: dark ? "#333" : "#ddd" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          {step === "checkout" && (
            <button onClick={() => setStep("review")} style={{
              background: "transparent", border: "none", color: text, cursor: "pointer", padding: 0
            }}>
              <IconChevronLeft size={24} />
            </button>
          )}
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: text, margin: 0, flex: 1 }}>
            {step === "review" ? "Tu Carrito" : "Detalles de entrega"}
          </h2>
          <button onClick={onClose} style={{ 
            background: dark ? "#2a2e35" : "#f3f4f6", border: "none", 
            width: 36, height: 36, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: text 
          }}>
            <IconX size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
          {step === "review" ? (
            <>
              {cart.map((item) => (
                <div key={item.dish.id} style={{ 
                  background: itemBg, padding: 16, borderRadius: 20, marginBottom: 12,
                  display: "flex", gap: 16, alignItems: "center",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}`
                }}>
                  <div style={{ width: 72, height: 72, borderRadius: 16, background: "#f3f3f3", overflow: "hidden", flexShrink: 0 }}>
                    {item.dish.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.dish.imageUrl} alt={item.dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>
                        <IconUtensils size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 800, color: text }}>{item.dish.name}</h4>
                    <p style={{ margin: 0, color: "#FF6B35", fontWeight: 900, fontSize: "1rem" }}>${item.dish.price * item.qty}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, background: dark ? "#1a1d21" : "#fff", padding: "6px 12px", borderRadius: 14 }}>
                    <button onClick={() => item.qty > 1 ? onUpdateQty(item.dish.id, -1) : onRemove(item.dish.id)} style={{
                      background: "transparent", border: "none", cursor: "pointer", color: item.qty > 1 ? text : "#ef4444", display: "flex"
                    }}>
                      {item.qty > 1 ? <IconMinus size={16} /> : <IconTrash size={16} />}
                    </button>
                    <span style={{ fontWeight: 900, color: text, fontSize: "0.95rem", minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.dish.id, 1)} style={{
                      background: "transparent", border: "none", color: "#FF6B35", cursor: "pointer", display: "flex"
                    }}>
                      <IconPlus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="anim-fade-in" style={{ padding: "10px 0 20px" }}>
              <div style={{ 
                background: "rgba(255,107,53,0.08)", padding: "16px 20px", borderRadius: 16, 
                marginBottom: 24, border: "1px solid rgba(255,107,53,0.15)" 
              }}>
                <p style={{ color: dark ? "#FF8C61" : "#FF6B35", fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>
                  Por favor, ingresa tu nombre para identificar tu pedido cuando pases a recogerlo.
                </p>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>
                  Nombre completo
                </label>
                <input 
                  autoFocus
                  style={{
                    width: "100%", padding: "18px", borderRadius: 16, 
                    border: `2px solid ${dark ? "#333" : "#f1f1f1"}`,
                    background: dark ? "#1a1d21" : "#fff",
                    color: text, fontSize: "1rem", outline: "none",
                    fontFamily: "inherit", fontWeight: 600,
                    transition: "border-color 0.2s"
                  }}
                  placeholder="Ej. Juan Pérez"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "24px 24px 40px", background: dark ? "#1a1d21" : "#fff", borderTop: `1px solid ${dark ? "#2e3238" : "#f3f4f6"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "center" }}>
            <span style={{ fontWeight: 800, color: muted, fontSize: "1rem" }}>Total estimado</span>
            <span style={{ fontWeight: 900, color: text, fontSize: "1.75rem" }}>${total}</span>
          </div>

          <button 
            onClick={() => step === "review" ? setStep("checkout") : onOrder(customerName)}
            disabled={step === "checkout" && !customerName.trim()}
            style={{
              width: "100%", background: "#FF6B35", color: "white",
              border: "none", padding: "20px", borderRadius: 20,
              fontWeight: 900, fontSize: "1.1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              boxShadow: "0 10px 25px rgba(255,107,53,0.35)",
              opacity: (step === "checkout" && !customerName.trim()) ? 0.6 : 1,
              transition: "transform 0.2s"
            }}
          >
            {step === "review" ? (
              <>Continuar <IconBag size={22} /></>
            ) : (
              "Confirmar y Pedir"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
