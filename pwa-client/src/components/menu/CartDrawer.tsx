import React from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { cn, formatCurrency } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const subtotal = getTotal();
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-[100] animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-foodify-orange" />
            <h2 className="text-xl font-bold">Tu Orden Para Llevar</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p className="text-lg">Tu carrito está vacío</p>
              <button 
                onClick={onClose}
                className="text-foodify-orange font-bold hover:underline"
              >
                Volver al menú
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.dishId} className="flex gap-4 border-b border-gray-50 pb-4">
                <div className="w-16 h-16 rounded-lg bg-foodify-orange-light flex-shrink-0 overflow-hidden">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <span className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  {item.specialNotes && (
                    <p className="text-xs text-gray-400 mb-2">Nota: {item.specialNotes}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-gray-50 rounded-full px-2 py-1 gap-3">
                      <button onClick={() => updateQuantity(item.dishId, item.quantity - 1)} className="p-1">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.dishId, item.quantity + 1)} className="p-1">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.dishId)}
                      className="text-red-400 p-1 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="p-6 bg-gray-50 border-t">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>IVA (16%)</span>
                <span>{formatCurrency(iva)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-text-primary pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button 
              onClick={onCheckout}
              className="w-full bg-foodify-orange hover:bg-foodify-orange-dark text-white py-4 rounded-xl font-bold shadow-lg shadow-foodify-orange/20 transition-all active:scale-[0.98]"
            >
              Realizar Pedido Para Llevar
            </button>
          </div>
        )}
      </div>
    </>
  );
};
