import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChefHat, Clock, PackageCheck, Receipt } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { formatINR, Order, ORDER_STATUSES, OrderStatus } from '../types';

function getTimestampMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function formatDateTime(ts: unknown): string {
  const ms = getTimestampMillis(ts);
  if (!ms) return 'Just now';
  return new Date(ms).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadgeStyles(status: OrderStatus): string {
  switch (status) {
    case 'Pending':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Preparing':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'Ready':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Completed':
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

export function OrdersPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'orders'), where('userId', '==', firebaseUser.uid));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Order, 'id'>),
        }));
        list.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'orders');
      },
    );

    return () => unsub();
  }, [firebaseUser, authLoading]);

  const filteredOrders = useMemo(() => {
    if (filterTab === 'active') return orders.filter((o) => o.status !== 'Completed');
    if (filterTab === 'completed') return orders.filter((o) => o.status === 'Completed');
    return orders;
  }, [orders, filterTab]);

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <div className="h-8 w-48 bg-stone-100 rounded animate-pulse" />
        {[1, 2].map((n) => (
          <div
            key={n}
            className="bg-white border border-[#E7DFD3] rounded-2xl p-6 h-44 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8 sm:p-10">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Sign in to view your orders
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Track live kitchen status updates and view your past canteen receipts.
          </p>
          <Link
            to="/auth?redirect=/orders"
            className="mt-6 inline-flex px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E7DFD3]">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900">My Orders</h1>
          <p className="mt-1 text-sm text-stone-600">
            Live order updates synced directly from the canteen kitchen counter.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#FAF5EE] border border-[#E7DFD3] rounded-xl">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-[#E7DFD3] rounded-3xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-6 h-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-stone-900">No orders found</h2>
            <p className="mt-1.5 text-sm text-stone-600">
              {filterTab === 'all'
                ? 'You haven’t placed any orders yet. Grab something fresh from the menu!'
                : `No ${filterTab} orders to show right now.`}
            </p>
            <Link
              to="/menu"
              className="mt-6 inline-flex px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
            >
              Order Food Now
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const currentIdx = ORDER_STATUSES.indexOf(order.status);
            return (
              <article
                key={order.id}
                className="bg-white border border-[#E7DFD3] rounded-2xl p-5 sm:p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EAE1]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/orders/confirm/${order.id}`}
                        className="font-mono text-sm font-bold text-stone-900 hover:text-orange-600 tabular-nums"
                      >
                        {order.orderNumber}
                      </Link>
                      <span
                        className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${getStatusBadgeStyles(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 tabular-nums">
                      Placed {formatDateTime(order.createdAt)} · {order.paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-stone-500 block">Total</span>
                      <span className="font-display text-lg font-extrabold text-stone-900 tabular-nums">
                        {formatINR(order.totalAmount)}
                      </span>
                    </div>
                    <Link
                      to={`/orders/confirm/${order.id}`}
                      className="px-3.5 py-2 rounded-xl border border-[#E7DFD3] text-xs font-semibold text-stone-700 hover:bg-[#FAF5EE] transition-colors whitespace-nowrap"
                    >
                      View Receipt
                    </Link>
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div className="grid grid-cols-4 gap-2">
                  {ORDER_STATUSES.map((step, idx) => {
                    const reached = idx <= currentIdx;
                    const Icon =
                      step === 'Pending'
                        ? Clock
                        : step === 'Preparing'
                          ? ChefHat
                          : step === 'Ready'
                            ? PackageCheck
                            : CheckCircle2;
                    return (
                      <div key={step} className="space-y-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-colors ${
                            reached ? 'bg-orange-600' : 'bg-stone-200'
                          }`}
                        />
                        <div
                          className={`flex items-center gap-1 text-[11px] font-semibold ${
                            reached ? 'text-stone-900' : 'text-stone-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
                          <span className="truncate">{step}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ordered Items Summary */}
                <div className="pt-1 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-stone-700">
                  {order.items.map((item) => (
                    <span key={item.foodId} className="tabular-nums">
                      <span className="font-semibold text-stone-900">{item.quantity}×</span>{' '}
                      {item.name}
                    </span>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
