import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatINR, SCHEMA_LIMITS } from '../types';
import { FoodImage } from '../components/FoodImage';

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SC-${y}${m}${d}-${rand}`;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (profile) {
      setCustomerName((prev) => prev || profile.name || '');
      setCustomerPhone((prev) => prev || profile.phone || '');
      setStudentId((prev) => prev || profile.studentId || '');
    } else if (firebaseUser?.displayName) {
      setCustomerName((prev) => prev || firebaseUser.displayName || '');
    }
  }, [profile, firebaseUser]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8 animate-pulse space-y-4">
          <div className="h-7 w-52 bg-stone-100 rounded" />
          <div className="h-40 w-full bg-stone-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8 sm:p-10">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Sign in to place your order
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            Your tray is saved safely. Sign in with your student account to confirm pickup details
            and receive a unique Order ID.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth?redirect=/checkout"
              className="px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
            >
              Sign In to Continue
            </Link>
            <Link
              to="/menu"
              className="px-5 py-3 rounded-xl border border-[#E7DFD3] text-stone-700 text-sm font-semibold hover:bg-[#FAF5EE] transition-colors"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8 sm:p-10">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-stone-600">
            Add fresh dishes from the canteen menu before checking out.
          </p>
          <Link
            to="/menu"
            className="mt-6 inline-flex px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || submitting) return;

    setFormError(null);
    const trimmedName = customerName.trim().slice(0, SCHEMA_LIMITS.NAME_MAX);
    const trimmedPhone = customerPhone.trim().slice(0, SCHEMA_LIMITS.PHONE_MAX);
    const trimmedStudentId = studentId.trim().slice(0, SCHEMA_LIMITS.STUDENT_ID_MAX);
    const trimmedNote = pickupNote.trim().slice(0, SCHEMA_LIMITS.PICKUP_NOTE_MAX);
    const customerEmail = (firebaseUser.email || '').trim().slice(0, SCHEMA_LIMITS.EMAIL_MAX);

    if (trimmedName.length < SCHEMA_LIMITS.NAME_MIN) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (trimmedPhone.length < SCHEMA_LIMITS.PHONE_MIN) {
      setFormError('Please enter a valid contact phone number.');
      return;
    }
    if (trimmedStudentId.length < SCHEMA_LIMITS.STUDENT_ID_MIN) {
      setFormError('Please enter your Student / Roll ID.');
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);

    const newOrderRef = doc(collection(db, 'orders'));
    const orderNumber = generateOrderNumber();

    try {
      const orderItems = items.slice(0, SCHEMA_LIMITS.ORDER_MAX_ITEMS).map((item) => ({
        foodId: item.foodId,
        name: item.name.slice(0, SCHEMA_LIMITS.NAME_MAX),
        price: Number(item.price),
        quantity: Math.floor(item.quantity),
        imageUrl: item.imageUrl.slice(0, SCHEMA_LIMITS.IMAGE_URL_MAX),
      }));

      const calculatedSubtotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      await setDoc(newOrderRef, {
        orderNumber,
        userId: firebaseUser.uid,
        customerName: trimmedName,
        customerEmail,
        customerPhone: trimmedPhone,
        studentId: trimmedStudentId,
        pickupNote: trimmedNote,
        items: orderItems,
        subtotal: calculatedSubtotal,
        totalAmount: calculatedSubtotal,
        paymentMethod: 'Cash at Counter',
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      clearCart();
      showToast(`Order ${orderNumber} placed successfully!`, 'success');
      navigate(`/orders/confirm/${newOrderRef.id}`, { replace: true });
    } catch (error) {
      submitLockRef.current = false;
      setSubmitting(false);
      setFormError('Could not submit your order. Please check your connection and try again.');
      showToast('Failed to place order.', 'error');
      handleFirestoreError(error, OperationType.CREATE, `orders/${newOrderRef.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/menu"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Continue Browsing Menu
      </Link>

      <h1 className="font-display text-3xl font-extrabold text-stone-900 mb-8">
        Checkout &amp; Counter Pickup
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Customer Details & Payment Form */}
        <form
          onSubmit={handlePlaceOrder}
          className="lg:col-span-7 bg-white border border-[#E7DFD3] rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">Student Pickup Details</h2>
            <p className="text-sm text-stone-500 mt-1">
              We&apos;ll attach these details to your Order ID for counter verification.
            </p>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="chk-name" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Full Name
              </label>
              <input
                id="chk-name"
                type="text"
                required
                minLength={SCHEMA_LIMITS.NAME_MIN}
                maxLength={SCHEMA_LIMITS.NAME_MAX}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label
                htmlFor="chk-student-id"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Student / Roll ID
              </label>
              <input
                id="chk-student-id"
                type="text"
                required
                minLength={SCHEMA_LIMITS.STUDENT_ID_MIN}
                maxLength={SCHEMA_LIMITS.STUDENT_ID_MAX}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. CS2026-042"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="chk-phone"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Phone Number
              </label>
              <input
                id="chk-phone"
                type="tel"
                required
                minLength={SCHEMA_LIMITS.PHONE_MIN}
                maxLength={SCHEMA_LIMITS.PHONE_MAX}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Campus Email
              </label>
              <input
                type="email"
                readOnly
                value={firebaseUser.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] bg-[#FAF5EE] text-sm text-stone-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="chk-note" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Kitchen / Pickup Note (Optional)
            </label>
            <textarea
              id="chk-note"
              rows={2}
              maxLength={SCHEMA_LIMITS.PICKUP_NOTE_MAX}
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
              placeholder="e.g. Less spicy, pack sambar separately"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Payment Method Box */}
          <div className="pt-4 border-t border-[#F0EAE1]">
            <h3 className="font-display text-base font-bold text-stone-900 mb-3">
              Payment Method
            </h3>
            <div className="flex items-start gap-3.5 p-4 rounded-2xl border-2 border-orange-500 bg-orange-50/60">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-sm font-bold text-stone-900">
                    Cash at Counter
                  </p>
                  <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
                </div>
                <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                  No online prepayment required. Pay{' '}
                  <span className="font-bold text-stone-900 tabular-nums">
                    {formatINR(subtotal)}
                  </span>{' '}
                  in cash directly at the canteen pickup counter using your Order ID.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-orange-600 text-white text-base font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 shadow-xs"
          >
            {submitting
              ? 'Placing Order...'
              : `Confirm Order · ${formatINR(subtotal)} (Cash at Counter)`}
          </button>
        </form>

        {/* Order Summary Panel */}
        <aside className="lg:col-span-5 bg-white border border-[#E7DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <h2 className="font-display text-xl font-bold text-stone-900">Order Summary</h2>

          <div className="divide-y divide-[#F0EAE1]">
            {items.map((item) => (
              <div key={item.foodId} className="py-3.5 flex items-center gap-3.5">
                <FoodImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-14 rounded-xl object-cover shrink-0 bg-[#FAF5EE]"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-stone-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-stone-500 tabular-nums">
                    {formatINR(item.price)} × {item.quantity}
                  </p>
                  <div className="mt-1.5 inline-flex items-center rounded-lg border border-[#E7DFD3] bg-[#FAF5EE]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.foodId, item.quantity - 1)}
                      className="p-1 text-stone-600 hover:text-orange-700"
                      aria-label={`Decrease ${item.name}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                      className="p-1 text-stone-600 hover:text-orange-700"
                      aria-label={`Increase ${item.name}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-bold text-stone-900 tabular-nums">
                    {formatINR(item.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.foodId)}
                    className="text-xs text-stone-400 hover:text-red-600 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E7DFD3] space-y-2.5 text-sm">
            <div className="flex items-center justify-between text-stone-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-stone-900 tabular-nums">
                {formatINR(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Packaging &amp; Counter Fee</span>
              <span className="font-semibold text-emerald-700">Free</span>
            </div>
            <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
              <span className="font-display text-base font-bold text-stone-900">Total Payable</span>
              <span className="font-display text-2xl font-extrabold text-orange-600 tabular-nums">
                {formatINR(subtotal)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
