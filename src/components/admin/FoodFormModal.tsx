import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useToast } from '../../context/ToastContext';
import {
  FOOD_CATEGORIES,
  FoodCategory,
  FoodItem,
  SCHEMA_LIMITS,
} from '../../types';
import { FoodImage } from '../FoodImage';

const PRESET_IMAGES = [
  {
    label: 'Masala Dosa',
    url: '/src/assets/images/food_masala_dosa_1795078060074.jpg',
  },
  {
    label: 'Samosa Platter',
    url: '/src/assets/images/food_samosa_platter_1795078059708.jpg',
  },
  {
    label: 'Vada Pav',
    url: '/src/assets/images/food_vada_pav_1795078060208.jpg',
  },
  {
    label: 'Paneer Thali',
    url: '/src/assets/images/food_paneer_thali_1795078060535.jpg',
  },
  {
    label: 'Masala Chai',
    url: '/src/assets/images/food_masala_chai_1795078060191.jpg',
  },
  {
    label: 'Cold Coffee',
    url: '/src/assets/images/food_cold_coffee_1795078060025.jpg',
  },
  {
    label: 'Gulab Jamun',
    url: '/src/assets/images/food_gulab_jamun_1795078059999.jpg',
  },
];

interface FoodFormModalProps {
  open: boolean;
  editingItem: FoodItem | null;
  onClose: () => void;
}

export function FoodFormModal({ open, editingItem, onClose }: FoodFormModalProps) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Snacks');
  const [price, setPrice] = useState('50');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('8');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [available, setAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [isVeg, setIsVeg] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingItem) {
      setName(editingItem.name);
      setDescription(editingItem.description);
      setCategory(editingItem.category);
      setPrice(String(editingItem.price));
      setPrepTimeMinutes(String(editingItem.prepTimeMinutes));
      setImageUrl(editingItem.imageUrl);
      setAvailable(editingItem.available);
      setIsPopular(editingItem.isPopular);
      setIsSpecial(editingItem.isSpecial);
      setIsVeg(editingItem.isVeg);
    } else {
      setName('');
      setDescription('');
      setCategory('Snacks');
      setPrice('50');
      setPrepTimeMinutes('8');
      setImageUrl(PRESET_IMAGES[0].url);
      setAvailable(true);
      setIsPopular(false);
      setIsSpecial(false);
      setIsVeg(true);
    }
  }, [open, editingItem]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim().slice(0, SCHEMA_LIMITS.NAME_MAX);
    const trimmedDesc = description.trim().slice(0, SCHEMA_LIMITS.FOOD_DESC_MAX);
    const trimmedImg = imageUrl.trim().slice(0, SCHEMA_LIMITS.IMAGE_URL_MAX);
    const numericPrice = Number(price);
    const numericPrep = Math.round(Number(prepTimeMinutes));

    if (trimmedName.length < SCHEMA_LIMITS.NAME_MIN) {
      setErrorMsg('Dish name must be at least 2 characters.');
      return;
    }
    if (trimmedDesc.length < SCHEMA_LIMITS.FOOD_DESC_MIN) {
      setErrorMsg('Description must be at least 5 characters.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > SCHEMA_LIMITS.FOOD_PRICE_MAX) {
      setErrorMsg(`Price must be between ₹1 and ₹${SCHEMA_LIMITS.FOOD_PRICE_MAX}.`);
      return;
    }
    if (!Number.isFinite(numericPrep) || numericPrep < 1 || numericPrep > SCHEMA_LIMITS.PREP_TIME_MAX) {
      setErrorMsg(`Prep time must be between 1 and ${SCHEMA_LIMITS.PREP_TIME_MAX} minutes.`);
      return;
    }
    if (!trimmedImg) {
      setErrorMsg('Please select or provide an image URL.');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'foodItems', editingItem.id), {
          name: trimmedName,
          description: trimmedDesc,
          category,
          price: numericPrice,
          imageUrl: trimmedImg,
          available,
          isPopular,
          isSpecial,
          isVeg,
          prepTimeMinutes: numericPrep,
          updatedAt: serverTimestamp(),
        });
        showToast(`Updated "${trimmedName}"`, 'success');
      } else {
        const newRef = doc(collection(db, 'foodItems'));
        await setDoc(newRef, {
          name: trimmedName,
          description: trimmedDesc,
          category,
          price: numericPrice,
          imageUrl: trimmedImg,
          available,
          isPopular,
          isSpecial,
          isVeg,
          prepTimeMinutes: numericPrep,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast(`Added "${trimmedName}" to menu`, 'success');
      }
      onClose();
    } catch (error) {
      setErrorMsg('Failed to save food item. Check admin permissions.');
      showToast('Failed to save dish.', 'error');
      handleFirestoreError(
        error,
        editingItem ? OperationType.UPDATE : OperationType.CREATE,
        editingItem ? `foodItems/${editingItem.id}` : 'foodItems',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-[#E7DFD3] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
          <h2 id="food-modal-title" className="font-display text-xl font-bold text-stone-900">
            {editingItem ? `Edit Dish: ${editingItem.name}` : 'Add New Menu Dish'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:bg-[#FAF5EE] hover:text-stone-900"
            aria-label="Close dish modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dish-name" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Dish Name
              </label>
              <input
                id="dish-name"
                type="text"
                required
                minLength={SCHEMA_LIMITS.NAME_MIN}
                maxLength={SCHEMA_LIMITS.NAME_MAX}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aloo Paratha with Curd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="dish-cat" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Category
              </label>
              <select
                id="dish-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dish-desc" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Description
            </label>
            <textarea
              id="dish-desc"
              rows={2}
              required
              minLength={SCHEMA_LIMITS.FOOD_DESC_MIN}
              maxLength={SCHEMA_LIMITS.FOOD_DESC_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe ingredients, portion size, and accompaniments..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dish-price" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Price (₹ INR)
              </label>
              <input
                id="dish-price"
                type="number"
                required
                min={1}
                max={SCHEMA_LIMITS.FOOD_PRICE_MAX}
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="dish-prep" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Prep Time (mins)
              </label>
              <input
                id="dish-prep"
                type="number"
                required
                min={1}
                max={SCHEMA_LIMITS.PREP_TIME_MAX}
                step="1"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Image Selection & Preview */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-stone-700">
              Select Dish Photo or Enter Image URL
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    imageUrl === preset.url
                      ? 'bg-orange-50 border-orange-400 text-orange-800'
                      : 'bg-white border-[#E7DFD3] text-stone-600 hover:bg-[#FAF5EE]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <FoodImage
                src={imageUrl}
                alt={name || 'Dish preview'}
                className="w-20 h-16 rounded-xl object-cover shrink-0 border border-[#E7DFD3]"
              />
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.IMAGE_URL_MAX}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/src/assets/images/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="w-4 h-4 accent-orange-600 rounded"
              />
              Available Now
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isVeg}
                onChange={(e) => setIsVeg(e.target.checked)}
                className="w-4 h-4 accent-orange-600 rounded"
              />
              Vegetarian
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="w-4 h-4 accent-orange-600 rounded"
              />
              Popular Dish
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isSpecial}
                onChange={(e) => setIsSpecial(e.target.checked)}
                className="w-4 h-4 accent-orange-600 rounded"
              />
              Today&apos;s Special
            </label>
          </div>

          <div className="pt-4 border-t border-[#F0EAE1] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E7DFD3] text-sm font-semibold text-stone-700 hover:bg-[#FAF5EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingItem ? 'Update Dish' : 'Add Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
