import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../types';
import { FoodImage } from '../components/FoodImage';
import { FoodCard } from '../components/FoodCard';

export function FoodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, loading } = useMenu();
  const { addItem, setDrawerOpen } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const food = items.find((item) => item.id === id);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
          <div className="lg:col-span-6 aspect-[4/3] rounded-3xl bg-stone-100" />
          <div className="lg:col-span-6 space-y-4 py-4">
            <div className="h-4 w-32 bg-stone-100 rounded" />
            <div className="h-9 w-72 bg-stone-100 rounded" />
            <div className="h-20 w-full bg-stone-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-stone-900">Dish not found</h1>
        <p className="mt-2 text-sm text-stone-600">
          This menu item may have been removed or is no longer listed.
        </p>
        <Link
          to="/menu"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>
      </div>
    );
  }

  const related = items
    .filter((i) => i.category === food.category && i.id !== food.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    if (!food.available) return;
    addItem(food, quantity);
    showToast(`Added ${quantity} × ${food.name} to cart`, 'success');
    setDrawerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </button>

      {/* Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-6">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-[#E7DFD3] bg-[#FAF5EE]">
            <FoodImage src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E7DFD3] rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-2">
            <span>{food.category}</span>
            <span aria-hidden="true">·</span>
            <span>{food.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
            <span aria-hidden="true">·</span>
            <span className={food.available ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
              {food.available ? 'In Stock Today' : 'Sold Out'}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
            {food.name}
          </h1>

          <p className="mt-4 text-base text-stone-600 leading-relaxed">{food.description}</p>

          <div className="mt-6 pt-6 border-t border-[#F0EAE1] flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 block">Price</span>
              <span className="font-display text-3xl font-extrabold text-stone-900 tabular-nums">
                {formatINR(food.price)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="tabular-nums">Ready in ~{food.prepTimeMinutes} mins</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="inline-flex items-center justify-between sm:justify-start rounded-xl border border-[#E7DFD3] bg-[#FAF5EE] px-2 py-1">
              <button
                type="button"
                disabled={!food.available || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-stone-700 hover:text-orange-700 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-5 text-base font-bold text-stone-900 tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                disabled={!food.available || quantity >= 50}
                onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                className="p-2.5 text-stone-700 hover:text-orange-700 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={!food.available}
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {food.available
                  ? `Add to Cart · ${formatINR(food.price * quantity)}`
                  : 'Currently Unavailable'}
              </span>
            </button>
          </div>

          <p className="mt-4 text-xs text-stone-500">
            Payment is collected via Cash at Counter when you pick up your order.
          </p>
        </div>
      </div>

      {/* Related Dishes */}
      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#E7DFD3]">
          <h2 className="font-display text-2xl font-bold text-stone-900 mb-6">
            More in {food.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((item) => (
              <FoodCard key={item.id} food={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
