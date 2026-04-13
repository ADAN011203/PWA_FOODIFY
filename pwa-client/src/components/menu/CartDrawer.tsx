"use client";

import React, { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Minus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";

interface CartDrawerProps {
  children: React.ReactNode;
  onCheckout: (notes: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ children, onCheckout }) => {
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const [notes, setNotes] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const subtotal = getTotal();
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-foodify-orange" />
            Tu Orden Para Llevar
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-4">
              <div className="bg-gray-100 p-6 rounded-full">
                <ShoppingBag className="w-12 h-12 opacity-20" />
              </div>
              <p className="font-medium text-lg">Tu carrito está vacío</p>
              <Button variant="link" onClick={() => setIsOpen(false)}>
                Volver al menú
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-foodify-orange-light">
                           <ShoppingBag className="w-6 h-6 text-foodify-orange/40" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                        <span className="font-black text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-2 py-0.5">
                          <button 
                             onClick={() => updateQuantity(item.id, item.quantity - 1)}
                             className="text-text-secondary hover:text-foodify-orange transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                             onClick={() => updateQuantity(item.id, item.quantity + 1)}
                             className="text-text-secondary hover:text-foodify-orange transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary">Nota especial para el restaurante</label>
                <textarea 
                  className="w-full h-24 p-3 text-sm rounded-xl border border-input bg-transparent focus:ring-1 focus:ring-ring focus:outline-none transition-all resize-none"
                  placeholder="Ej. Sin cebolla, extra salsa..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-6 bg-white border-t flex flex-col gap-6 sm:flex-col sm:space-x-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>IVA (16%)</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-lg pt-2 border-t text-text-primary">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-12 bg-foodify-orange text-white font-bold rounded-xl"
              onClick={() => onCheckout(notes)}
            >
              Realizar Pedido Para Llevar
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
