import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, CheckCircle2, ChefHat, Clock, Sparkles } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { FOOD_CATEGORIES, FoodCategory, formatINR } from '../types';
import { FoodCard } from '../components/FoodCard';
import { FoodImage } from '../components/FoodImage';

const CATEGORY_META: Record<
  FoodCategory,
  { subtitle: string; image: string }
> = {
  Breakfast: {
    subtitle: 'Hot dosas & morning tiffins',
    image: '/src/assets/images/food_masala_dosa_1795078060074.jpg',
  },
  Snacks: {
    subtitle: 'Samosas, vada pav & chaat',
    image: '/src/assets/images/food_samosa_platter_1795078059708.jpg',
  },
  Meals: {
    subtitle: 'Wholesome campus thalis',
    image: '/src/assets/images/food_paneer_thali_1795078060535.jpg',
  },
  Beverages: {
    subtitle: 'Kulhad chai & cold coffee',
    image: '/src/assets/images/food_masala_chai_1795078060191.jpg',
  },
  Desserts: {
    subtitle: 'Warm Indian sweets',
    image: '/src/assets/images/food_gulab_jamun_1795078059999.jpg',
  },
};

export function LandingPage() {
  const { items, loading, seedSampleMenu } = useMenu();
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const popularDishes = items.filter((item) => item.isPopular).slice(0, 6);
  const specialDish =
    items.find((item) => item.isSpecial && item.available) ||
    items.find((item) => item.isSpecial) ||
    items[0];

  const handleOrderSpecial = () => {
    if (!specialDish || !specialDish.available) return;
    addItem(specialDish, 1);
    showToast(`Added ${specialDish.name} to cart`, 'success');
  };

  return (
    <div className="bg-[#FFFDF9]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:pt-12 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-2">
            <p className="text-sm font-semibold text-orange-600 mb-3">
              Campus Central Kitchen · Open 7:30 AM – 8:30 PM
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-stone-900 leading-[1.1] text-balance">
              Fresh Food. Fast Orders. Zero Waiting.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
              Skip the recess rush at the university canteen. Browse live kitchen availability,
              place your order in seconds, pay Cash at Counter, and collect hot meals right when
              they&apos;re ready.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-orange-600 text-white text-base font-semibold hover:bg-orange-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-[#E7DFD3] bg-white text-stone-800 text-base font-semibold hover:bg-[#FAF5EE] transition-colors whitespace-nowrap shrink-0"
              >
                Track My Order
              </Link>
            </div>

            <div className="mt-10 pt-6 border-t border-[#E7DFD3] grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <p className="font-display text-xl font-extrabold text-stone-900 tabular-nums">
                  5 – 12 min
                </p>
                <p className="text-xs text-stone-500 mt-0.5">Avg. prep time</p>
              </div>
              <div>
                <p className="font-display text-xl font-extrabold text-stone-900">100% Fresh</p>
                <p className="text-xs text-stone-500 mt-0.5">Made on order</p>
              </div>
              <div>
                <p className="font-display text-xl font-extrabold text-stone-900">Cash Counter</p>
                <p className="text-xs text-stone-500 mt-0.5">Pay at pickup</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[300px] sm:min-h-[380px] rounded-3xl overflow-hidden border border-[#E7DFD3] shadow-sm bg-[#FAF5EE]">
              <FoodImage
                src="/src/assets/images/hero_smart_canteen_1795078060739.jpg"
                alt="Freshly prepared Smart Canteen meals including masala dosa, samosas, paneer masala, and kulhad chai"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-6 text-white">
                <p className="text-xs font-medium text-orange-200">Central Student Plaza</p>
                <p className="font-display text-lg font-bold mt-0.5">
                  Prepared fresh every morning for campus breaks
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Food Categories Section */}
      <section className="bg-[#FAF5EE]/70 border-y border-[#E7DFD3] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                Explore by Category
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Jump straight to what you&apos;re craving between classes.
              </p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap"
            >
              <span>View Full Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {FOOD_CATEGORIES.map((category) => {
              const meta = CATEGORY_META[category];
              return (
                <Link
                  key={category}
                  to={`/menu?category=${encodeURIComponent(category)}`}
                  className="group bg-white border border-[#E7DFD3] rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#FAF5EE]">
                    <FoodImage
                      src={meta.image}
                      alt={category}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                      {category}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{meta.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Today's Special Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {specialDish ? (
          <div className="bg-[#FAF5EE] border border-[#E7DFD3] rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 min-h-[260px] bg-stone-100">
              <FoodImage
                src={specialDish.imageUrl}
                alt={specialDish.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Today&apos;s Chef Special · {specialDish.category}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
                {specialDish.name}
              </h2>
              <p className="mt-3 text-base text-stone-600 leading-relaxed max-w-xl">
                {specialDish.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-xs text-stone-500 block">Campus Price</span>
                  <span className="font-display text-2xl font-extrabold text-stone-900 tabular-nums">
                    {formatINR(specialDish.price)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Prep Time</span>
                  <span className="font-display text-lg font-bold text-stone-800 tabular-nums">
                    {specialDish.prepTimeMinutes} mins
                  </span>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!specialDish.available}
                  onClick={handleOrderSpecial}
                  className="px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {specialDish.available ? 'Add Special to Cart' : 'Currently Sold Out'}
                </button>
                <Link
                  to={`/menu/${specialDish.id}`}
                  className="px-5 py-3 rounded-xl border border-[#E7DFD3] bg-white text-stone-800 text-sm font-semibold hover:bg-stone-50 transition-colors"
                >
                  View Dish Details
                </Link>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="bg-[#FAF5EE] border border-[#E7DFD3] rounded-3xl p-8 text-center">
              <h2 className="font-display text-xl font-bold text-stone-900">
                Kitchen Menu Not Initialized Yet
              </h2>
              <p className="mt-2 text-sm text-stone-600 max-w-lg mx-auto">
                {isAdmin
                  ? 'Your Firestore foodItems collection is currently empty. Seed the sample Indian canteen menu to get started.'
                  : 'Sign in with the canteen administrator account to initialize today’s menu items in Firestore.'}
              </p>
              <div className="mt-5">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => void seedSampleMenu()}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Seed Sample Canteen Menu
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    className="inline-flex px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          )
        )}
      </section>

      {/* Popular Dishes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
              Campus Favorites
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Most ordered dishes across students and faculty today.
            </p>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap"
          >
            <span>Browse All Dishes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-[#E7DFD3] rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-stone-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-stone-100 rounded" />
                  <div className="h-5 w-48 bg-stone-100 rounded" />
                  <div className="h-4 w-full bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : popularDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularDishes.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E7DFD3] rounded-2xl p-8 text-center text-sm text-stone-600">
            No popular dishes marked yet. Visit the{' '}
            <Link to="/menu" className="text-orange-600 font-semibold underline">
              full menu
            </Link>{' '}
            to browse all dishes.
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="bg-white border-t border-[#E7DFD3] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
              How Smart Canteen Works
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600">
              Three quick steps from your classroom to the pickup counter.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FFFDF9] border border-[#E7DFD3] rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                <ChefHat className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-orange-600 mb-1">01. Browse &amp; Order</p>
              <h3 className="font-display text-lg font-bold text-stone-900">
                Pick from Live Kitchen Stock
              </h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Filter by category or search your favorite dishes. Every item reflects real-time
                counter availability.
              </p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E7DFD3] rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-orange-600 mb-1">02. Track Live Status</p>
              <h3 className="font-display text-lg font-bold text-stone-900">
                Watch Kitchen Progress
              </h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Follow your unique Order ID from Pending to Preparing to Ready right from your phone
                before walking over.
              </p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E7DFD3] rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                <Banknote className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-orange-600 mb-1">03. Pay &amp; Collect</p>
              <h3 className="font-display text-lg font-bold text-stone-900">
                Cash at Counter Pickup
              </h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Show your Order ID at Express Pickup Counter, pay in cash, and grab your hot meal
                with zero waiting.
              </p>
            </div>
          </div>

          <div className="mt-10 bg-orange-50/70 border border-orange-200/70 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
              <p className="text-sm font-medium text-stone-800">
                Ready for your break? Build your tray in under 30 seconds.
              </p>
            </div>
            <Link
              to="/menu"
              className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0"
            >
              Start Ordering
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
