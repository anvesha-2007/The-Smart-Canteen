import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { FoodItem, formatINR } from '../types';
import { FoodImage } from './FoodImage';

interface FoodCardProps {
  food: FoodItem;
}

export function FoodCard({ food }: FoodCardProps) {
  const { addItem, updateQuantity, getItemQuantity } = useCart();
  const { showToast } = useToast();
  const qty = getItemQuantity(food.id);

  const handleAdd = () => {
    addItem(food, 1);
    showToast(`Added ${food.name} to cart`, 'success');
  };

  return (
    <article className="group bg-white border border-[#E7DFD3] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/menu/${food.id}`} className="relative block aspect-[4/3] bg-[#FAF5EE] overflow-hidden">
        <FoodImage
          src={food.imageUrl}
          alt={food.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {!food.available && (
          <div className="absolute inset-0 bg-stone-950/55 flex items-center justify-center">
            <span className="px-3 py-1 rounded-lg bg-white text-stone-900 text-xs font-semibold">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        {/* Zero-pill unboxed metadata */}
        <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1.5">
          <span>{food.category}</span>
          <span aria-hidden="true">·</span>
          <span>{food.isVeg ? 'Veg' : 'Non-Veg'}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{food.prepTimeMinutes} min</span>
          {food.isSpecial && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-orange-600 font-semibold">Today&apos;s Special</span>
            </>
          )}
        </div>

        <Link
          to={`/menu/${food.id}`}
          className="font-display text-base font-bold text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1"
        >
          {food.name}
        </Link>

        <p className="mt-1.5 text-sm text-stone-600 line-clamp-2 leading-relaxed flex-1">
          {food.description}
        </p>

        <div className="mt-4 pt-3.5 border-t border-[#F0EAE1] flex items-center justify-between gap-3">
          <span className="font-display text-lg font-bold text-stone-900 tabular-nums">
            {formatINR(food.price)}
          </span>

          {!food.available ? (
            <span className="text-xs font-semibold text-stone-400">Unavailable</span>
          ) : qty > 0 ? (
            <div className="inline-flex items-center rounded-xl border border-orange-200 bg-orange-50/70">
              <button
                type="button"
                onClick={() => updateQuantity(food.id, qty - 1)}
                className="p-2 text-orange-700 hover:bg-orange-100 rounded-l-xl transition-colors"
                aria-label={`Decrease quantity of ${food.name}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-bold text-orange-900 tabular-nums min-w-[2rem] text-center">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(food.id, qty + 1)}
                className="p-2 text-orange-700 hover:bg-orange-100 rounded-r-xl transition-colors"
                aria-label={`Increase quantity of ${food.name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
