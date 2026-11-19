import { useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../types';
import { FoodImage } from './FoodImage';

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    totalItems,
    isDrawerOpen,
    setDrawerOpen,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (!isDrawerOpen) return null;

  const handleCheckout = () => {
    setDrawerOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      <div
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-[2px]"
        onClick={() => setDrawerOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md bg-[#FFFDF9] h-full flex flex-col shadow-2xl border-l border-[#E7DFD3]">
        <div className="px-6 py-5 border-b border-[#E7DFD3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-orange-600" />
            <h2 className="font-display text-lg font-bold text-stone-900">
              Your Tray <span className="text-stone-500 font-medium tabular-nums">({totalItems})</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-xl text-stone-500 hover:bg-[#FAF5EE] hover:text-stone-900 transition-colors"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-bold text-stone-900">Your tray is empty</h3>
              <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
                Browse today&apos;s freshly prepared campus meals and add items to get started.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  navigate('/menu');
                }}
                className="mt-5 px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.foodId}
                className="flex items-center gap-4 bg-white border border-[#E7DFD3] rounded-2xl p-3.5"
              >
                <FoodImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-16 rounded-xl object-cover shrink-0 bg-[#FAF5EE]"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-stone-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-stone-500 tabular-nums mt-0.5">
                    {formatINR(item.price)} each
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-lg border border-[#E7DFD3] bg-[#FAF5EE]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                        className="p-1.5 text-stone-700 hover:text-orange-700"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-stone-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                        className="p-1.5 text-stone-700 hover:text-orange-700"
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.foodId)}
                  className="p-1.5 text-stone-400 hover:text-red-600 transition-colors self-start"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-[#E7DFD3] space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatINR(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Payment Method</span>
                <span className="font-medium text-stone-800">Cash at Counter</span>
              </div>
              <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between">
                <span className="font-display font-bold text-stone-900">Total Payable</span>
                <span className="font-display text-xl font-extrabold text-orange-600 tabular-nums">
                  {formatINR(subtotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearCart}
                className="px-3.5 py-3 rounded-xl border border-[#E7DFD3] text-xs font-semibold text-stone-600 hover:bg-[#FAF5EE] transition-colors shrink-0"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors shadow-xs"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
