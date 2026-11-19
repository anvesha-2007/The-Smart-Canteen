import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Utensils } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FOOD_CATEGORIES, FoodCategory } from '../types';
import { FoodCard } from '../components/FoodCard';

export function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, error, seedSampleMenu } = useMenu();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState<string>(
    FOOD_CATEGORIES.includes(initialCategory as FoodCategory) ? initialCategory : 'All',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (onlyAvailable && !item.available) {
        return false;
      }
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q) &&
        !item.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [items, selectedCategory, onlyAvailable, searchQuery]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const seeded = await seedSampleMenu();
      showToast(
        seeded ? 'Sample canteen menu added to Firestore!' : 'Menu already contains items.',
        'success',
      );
    } catch {
      showToast('Failed to seed menu. Please check admin permissions.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E7DFD3]">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-900">
            Canteen Menu
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-stone-600">
            Freshly cooked Indian breakfasts, snacks, meals, beverages, and desserts.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes by name..."
            aria-label="Search dishes by name"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E7DFD3] text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Category Filter Tabs & Availability Toggle */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div
          className="flex items-center gap-1.5 p-1 bg-[#FAF5EE] border border-[#E7DFD3] rounded-xl overflow-x-auto"
          role="tablist"
          aria-label="Food Categories"
        >
          {['All', ...FOOD_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <button
            type="button"
            onClick={() => setOnlyAvailable((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              onlyAvailable
                ? 'bg-orange-50 border-orange-300 text-orange-800'
                : 'bg-white border-[#E7DFD3] text-stone-700 hover:bg-[#FAF5EE]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{onlyAvailable ? 'Available Only' : 'All Availability'}</span>
          </button>

          <span className="text-xs font-medium text-stone-500 tabular-nums whitespace-nowrap">
            {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white border border-[#E7DFD3] rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-stone-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-stone-100 rounded" />
                  <div className="h-5 w-44 bg-stone-100 rounded" />
                  <div className="h-4 w-full bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-[#E7DFD3] rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-stone-900">
              No dishes in menu database yet
            </h2>
            <p className="mt-2 text-sm text-stone-600 max-w-md mx-auto">
              {isAdmin
                ? 'Click below to populate Cloud Firestore with 10 realistic Indian canteen dishes.'
                : 'Please ask your canteen administrator to sign in and initialize the menu.'}
            </p>
            <div className="mt-6">
              {isAdmin ? (
                <button
                  type="button"
                  disabled={seeding}
                  onClick={handleSeed}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {seeding ? 'Seeding Menu...' : 'Seed Sample Canteen Menu'}
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
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-[#E7DFD3] rounded-2xl p-12 text-center">
            <h2 className="font-display text-lg font-bold text-stone-900">
              No matching dishes found
            </h2>
            <p className="mt-1.5 text-sm text-stone-600">
              Try clearing your search term or switching back to All categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setOnlyAvailable(false);
                handleCategoryChange('All');
              }}
              className="mt-5 px-4 py-2 rounded-xl border border-[#E7DFD3] text-sm font-semibold text-stone-700 hover:bg-[#FAF5EE] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
