import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Banknote, CheckCircle2, ChefHat, Clock, PackageCheck, Receipt } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { formatINR, Order, ORDER_STATUSES } from '../types';

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { firebaseUser } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !firebaseUser) {
      setLoading(false);
      return;
    }

    const orderPath = `orders/${orderId}`;
    const unsub = onSnapshot(
      doc(db, 'orders', orderId),
      (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...(snap.data() as Omit<Order, 'id'>) });
        } else {
          setOrder(null);
        }
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.GET, orderPath);
      },
    );

    return () => unsub();
  }, [orderId, firebaseUser]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8 animate-pulse space-y-4">
          <div className="h-8 w-56 bg-stone-100 rounded" />
          <div className="h-24 w-full bg-stone-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold text-stone-900">Order not found</h1>
          <p className="mt-2 text-sm text-stone-600">
            Sign in with the student account that placed this order to view the confirmation
            receipt.
          </p>
          <Link
            to="/orders"
            className="mt-6 inline-flex px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
          >
            Go to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = ORDER_STATUSES.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="bg-white border border-[#E7DFD3] rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0EAE1]">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700">Order Confirmed</p>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
                Thank you, {order.customerName.split(' ')[0]}!
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Show your Order ID at the pickup counter when your status turns Ready.
              </p>
            </div>
          </div>

          <div className="bg-[#FAF5EE] border border-[#E7DFD3] rounded-2xl px-4 py-3 text-left sm:text-right shrink-0">
            <span className="text-xs text-stone-500 block">Unique Order ID</span>
            <span className="font-mono text-base font-bold text-stone-900 tabular-nums">
              {order.orderNumber}
            </span>
          </div>
        </div>

        {/* Live 4-Step Progress Tracker */}
        <div className="py-7 border-b border-[#F0EAE1]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-stone-900">Live Kitchen Status</h2>
            <span className="text-xs font-semibold text-orange-600">
              Current Stage: {order.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ORDER_STATUSES.map((step, idx) => {
              const reached = idx <= currentStepIdx;
              const Icon =
                step === 'Pending'
                  ? Clock
                  : step === 'Preparing'
                    ? ChefHat
                    : step === 'Ready'
                      ? PackageCheck
                      : CheckCircle2;
              return (
                <div
                  key={step}
                  className={`rounded-2xl border p-3.5 transition-colors ${
                    reached
                      ? 'bg-orange-50/70 border-orange-300 text-stone-900'
                      : 'bg-[#FAF5EE]/60 border-[#E7DFD3] text-stone-400'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${reached ? 'text-orange-600' : 'text-stone-400'}`}
                  />
                  <p className="text-xs font-bold">{step}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cash at Counter Instruction */}
        <div className="my-6 p-4 rounded-2xl bg-[#FAF5EE] border border-[#E7DFD3] flex items-start gap-3">
          <Banknote className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="text-sm text-stone-700">
            <span className="font-bold text-stone-900">Payment: Cash at Counter</span> — Please
            keep{' '}
            <span className="font-bold text-stone-900 tabular-nums">
              {formatINR(order.totalAmount)}
            </span>{' '}
            ready when collecting order <span className="font-mono font-semibold">{order.orderNumber}</span>.
          </div>
        </div>

        {/* Itemized Receipt */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-stone-500" />
            <h2 className="font-display text-base font-bold text-stone-900">Ordered Items</h2>
          </div>
          <div className="border border-[#E7DFD3] rounded-2xl divide-y divide-[#F0EAE1]">
            {order.items.map((item) => (
              <div key={item.foodId} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-stone-900">{item.name}</span>
                  <span className="text-stone-500 ml-2 tabular-nums">× {item.quantity}</span>
                </div>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="px-4 py-3.5 bg-[#FAF5EE]/60 flex items-center justify-between rounded-b-2xl">
              <span className="font-display font-bold text-stone-900">Total Amount</span>
              <span className="font-display text-lg font-extrabold text-orange-600 tabular-nums">
                {formatINR(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/orders"
            className="px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            View All My Orders
          </Link>
          <Link
            to="/menu"
            className="px-5 py-3 rounded-xl border border-[#E7DFD3] text-stone-800 text-sm font-semibold hover:bg-[#FAF5EE] transition-colors"
          >
            Order More Food
          </Link>
        </div>
      </div>
    </div>
  );
}
