import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Edit3,
  LayoutDashboard,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useMenu } from '../context/MenuContext';
import { useToast } from '../context/ToastContext';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  FOOD_CATEGORIES,
  FoodItem,
  formatINR,
  Order,
  ORDER_STATUSES,
  OrderStatus,
} from '../types';
import { FoodImage } from '../components/FoodImage';
import { ConfirmModal } from '../components/ConfirmModal';
import { FoodFormModal } from '../components/admin/FoodFormModal';

type AdminTab = 'overview' | 'orders' | 'menu' | 'analytics';

function getTimestampMillis(ts: unknown): number {
  if (!ts) return 0;
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toMillis' in ts &&
    typeof (ts as { toMillis: () => number }).toMillis === 'function'
  ) {
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

function isToday(ts: unknown): boolean {
  const ms = getTimestampMillis(ts);
  if (!ms) return false;
  const d = new Date(ms);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function statusPillClasses(status: OrderStatus): string {
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

export function AdminDashboardPage() {
  const { firebaseUser, loading: authLoading, isAdmin } = useAuth();
  const { items: foodItems, loading: menuLoading, seedSampleMenu } = useMenu();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Order filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Menu management state
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('All');
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [deletingFood, setDeletingFood] = useState<FoodItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Real-time stream of ALL student orders for verified Admin
  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser || !isAdmin) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const loaded: Order[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Order, 'id'>),
        }));
        loaded.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
        setOrders(loaded);
        setOrdersLoading(false);
      },
      (err) => {
        setOrdersLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'orders');
      },
    );

    return () => unsub();
  }, [firebaseUser, authLoading, isAdmin]);

  // Live KPI metrics
  const kpis = useMemo(() => {
    const totalOrders = orders.length;
    const todaysOrders = orders.filter((o) => isToday(o.createdAt)).length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
    const activeKitchenOrders = orders.filter(
      (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready',
    ).length;

    return { totalOrders, todaysOrders, totalRevenue, pendingOrders, activeKitchenOrders };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) {
        return false;
      }
      if (
        q &&
        !o.orderNumber.toLowerCase().includes(q) &&
        !o.customerName.toLowerCase().includes(q) &&
        !o.studentId.toLowerCase().includes(q) &&
        !o.customerPhone.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Filtered Menu Items
  const filteredMenu = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    return foodItems.filter((item) => {
      if (menuCategoryFilter !== 'All' && item.category !== menuCategoryFilter) {
        return false;
      }
      if (q && !item.name.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [foodItems, menuSearch, menuCategoryFilter]);

  // Analytics derived from real Firestore orders
  const analytics = useMemo(() => {
    const dishStats = new Map<string, { name: string; quantity: number; revenue: number }>();
    const categoryRevenue = new Map<string, number>();
    const foodCategoryLookup = new Map<string, string>();
    for (const f of foodItems) {
      foodCategoryLookup.set(f.id, f.category);
    }

    for (const order of orders) {
      for (const item of order.items || []) {
        const existing = dishStats.get(item.name) || {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
        const lineTotal = Number(item.price) * Number(item.quantity);
        existing.quantity += Number(item.quantity);
        existing.revenue += lineTotal;
        dishStats.set(item.name, existing);

        const cat = foodCategoryLookup.get(item.foodId) || 'Other';
        categoryRevenue.set(cat, (categoryRevenue.get(cat) || 0) + lineTotal);
      }
    }

    const topDishes = Array.from(dishStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    const categoryBreakdown = FOOD_CATEGORIES.map((cat) => ({
      category: cat,
      revenue: categoryRevenue.get(cat) || 0,
    }));
    const maxCatRev = Math.max(1, ...categoryBreakdown.map((c) => c.revenue));

    // Last 7 days daily volume
    const days: { label: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayOrders = orders.filter((o) => {
        const ms = getTimestampMillis(o.createdAt);
        if (!ms) return false;
        const od = new Date(ms);
        return (
          od.getFullYear() === d.getFullYear() &&
          od.getMonth() === d.getMonth() &&
          od.getDate() === d.getDate()
        );
      });
      days.push({
        label,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
      });
    }
    const maxDailyRev = Math.max(1, ...days.map((d) => d.revenue));

    return { topDishes, categoryBreakdown, maxCatRev, days, maxDailyRev };
  }, [orders, foodItems]);

  const handleStatusChange = async (order: Order, nextStatus: OrderStatus) => {
    if (order.status === nextStatus) return;
    setUpdatingOrderId(order.id);
    const path = `orders/${order.id}`;
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(`Order ${order.orderNumber} marked ${nextStatus}`, 'success');
    } catch (error) {
      showToast('Failed to update order status.', 'error');
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleToggleAvailability = async (food: FoodItem) => {
    const path = `foodItems/${food.id}`;
    try {
      await updateDoc(doc(db, 'foodItems', food.id), {
        available: !food.available,
        updatedAt: serverTimestamp(),
      });
      showToast(
        `${food.name} marked ${!food.available ? 'Available' : 'Sold Out'}`,
        'success',
      );
    } catch (error) {
      showToast('Unable to update item availability.', 'error');
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFood) return;
    setDeleteLoading(true);
    const path = `foodItems/${deletingFood.id}`;
    try {
      await deleteDoc(doc(db, 'foodItems', deletingFood.id));
      showToast(`Deleted "${deletingFood.name}" from menu`, 'success');
      setDeletingFood(null);
    } catch (error) {
      showToast('Unable to delete food item.', 'error');
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSeedMenu = async () => {
    setSeeding(true);
    try {
      const seeded = await seedSampleMenu();
      showToast(
        seeded ? 'Seeded sample canteen menu!' : 'Menu already has items.',
        'success',
      );
    } catch {
      showToast('Failed to seed sample menu.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="bg-white border border-[#E7DFD3] rounded-2xl p-8 animate-pulse h-64" />
      </div>
    );
  }

  // Strict RBAC Gate
  if (!firebaseUser || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E7DFD3] rounded-3xl p-8 sm:p-10">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-stone-900">
            Admin Access Required
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            This portal is restricted to verified canteen administrators.
            {firebaseUser ? (
              <>
                {' '}
                Currently signed in as{' '}
                <span className="font-semibold text-stone-900">{firebaseUser.email}</span>.
              </>
            ) : (
              <> Sign in with your authorized admin account ({BOOTSTRAPPED_ADMIN_EMAIL}).</>
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!firebaseUser ? (
              <Link
                to="/auth?redirect=/admin"
                className="px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
              >
                Sign In as Admin
              </Link>
            ) : (
              <Link
                to="/"
                className="px-6 py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
              >
                Return to Storefront
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const sidebarItems: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders Queue', icon: ClipboardList },
    { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF5EE]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 bg-white border border-[#E7DFD3] rounded-2xl p-4 space-y-1.5">
            <div className="px-3 py-2 mb-2 border-b border-[#F0EAE1]">
              <p className="text-xs font-semibold text-orange-600">Canteen Operations</p>
              <p className="font-display text-base font-bold text-stone-900">Admin Console</p>
            </div>

            {sidebarItems.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-stone-700 hover:bg-[#FAF5EE] hover:text-stone-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </span>
                  {tab.id === 'orders' && kpis.pendingOrders > 0 && (
                    <span
                      className={`text-xs tabular-nums px-2 py-0.5 rounded-md ${
                        active ? 'bg-orange-700 text-white' : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {kpis.pendingOrders}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 mt-3 border-t border-[#F0EAE1]">
              <Link
                to="/menu"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-[#FAF5EE] hover:text-stone-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Student Menu</span>
              </Link>
            </div>
          </aside>

          {/* Main Admin Content Viewport */}
          <main className="lg:col-span-9 space-y-6">
            {/* Top Header */}
            <div className="bg-white border border-[#E7DFD3] rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-stone-500">
                  Admin /{' '}
                  <span className="text-stone-900 font-semibold">
                    {sidebarItems.find((t) => t.id === activeTab)?.label}
                  </span>
                </p>
                <h1 className="font-display text-xl font-extrabold text-stone-900 mt-0.5">
                  {activeTab === 'overview' && 'Kitchen & Sales Snapshot'}
                  {activeTab === 'orders' && 'Live Student Orders Queue'}
                  {activeTab === 'menu' && 'Menu Catalog & Availability'}
                  {activeTab === 'analytics' && 'Sales & Popular Dishes'}
                </h1>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {foodItems.length === 0 && (
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={handleSeedMenu}
                    className="px-4 py-2 rounded-xl border border-[#E7DFD3] bg-[#FAF5EE] text-xs font-semibold text-stone-800 hover:bg-orange-50 whitespace-nowrap"
                  >
                    {seeding ? 'Seeding...' : 'Seed Sample Menu'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingFood(null);
                    setFoodModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Food Item</span>
                </button>
              </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E7DFD3] rounded-2xl p-5">
                    <p className="text-xs font-medium text-stone-500">Total Orders</p>
                    <p className="font-display text-2xl font-extrabold text-stone-900 tabular-nums mt-1.5">
                      {kpis.totalOrders}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E7DFD3] rounded-2xl p-5">
                    <p className="text-xs font-medium text-stone-500">Today&apos;s Orders</p>
                    <p className="font-display text-2xl font-extrabold text-stone-900 tabular-nums mt-1.5">
                      {kpis.todaysOrders}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E7DFD3] rounded-2xl p-5">
                    <p className="text-xs font-medium text-stone-500">Total Revenue</p>
                    <p className="font-display text-2xl font-extrabold text-orange-600 tabular-nums mt-1.5">
                      {formatINR(kpis.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-white border border-[#E7DFD3] rounded-2xl p-5">
                    <p className="text-xs font-medium text-stone-500">Pending Orders</p>
                    <p className="font-display text-2xl font-extrabold text-amber-700 tabular-nums mt-1.5">
                      {kpis.pendingOrders}
                    </p>
                  </div>
                </div>

                {/* Active Kitchen Queue Preview */}
                <div className="bg-white border border-[#E7DFD3] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-base font-bold text-stone-900">
                      Active Kitchen Queue ({kpis.activeKitchenOrders})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Manage All Orders →
                    </button>
                  </div>

                  {ordersLoading ? (
                    <div className="h-32 bg-stone-50 rounded-xl animate-pulse" />
                  ) : orders.filter((o) => o.status !== 'Completed').length === 0 ? (
                    <div className="py-10 text-center text-sm text-stone-500">
                      All orders are completed. New student orders will appear here live.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F0EAE1]">
                      {orders
                        .filter((o) => o.status !== 'Completed')
                        .slice(0, 6)
                        .map((order) => (
                          <div
                            key={order.id}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                                  {order.orderNumber}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded border text-xs font-semibold ${statusPillClasses(
                                    order.status,
                                  )}`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 mt-1">
                                {order.customerName} ({order.studentId}) ·{' '}
                                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-bold text-stone-900 tabular-nums mr-2">
                                {formatINR(order.totalAmount)}
                              </span>
                              {order.status === 'Pending' && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === order.id}
                                  onClick={() => void handleStatusChange(order, 'Preparing')}
                                  className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 disabled:opacity-50"
                                >
                                  Start Preparing
                                </button>
                              )}
                              {order.status === 'Preparing' && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === order.id}
                                  onClick={() => void handleStatusChange(order, 'Ready')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  Mark Ready
                                </button>
                              )}
                              {order.status === 'Ready' && (
                                <button
                                  type="button"
                                  disabled={updatingOrderId === order.id}
                                  onClick={() => void handleStatusChange(order, 'Completed')}
                                  className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-50"
                                >
                                  Complete Pickup
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ORDERS QUEUE TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white border border-[#E7DFD3] rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search by Order ID, student name, roll ID..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-[#FAF5EE] border border-[#E7DFD3] rounded-xl overflow-x-auto">
                    {(['All', ...ORDER_STATUSES] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOrderStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          orderStatusFilter === status
                            ? 'bg-orange-600 text-white'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="h-48 bg-stone-50 rounded-xl animate-pulse" />
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-sm text-stone-500">
                    No orders match your current search or filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <div
                          key={order.id}
                          className="border border-[#E7DFD3] rounded-2xl p-4 sm:p-5 bg-[#FFFDF9]"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                                  {order.orderNumber}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded border text-xs font-semibold ${statusPillClasses(
                                    order.status,
                                  )}`}
                                >
                                  {order.status}
                                </span>
                                <span className="text-xs text-stone-500 tabular-nums">
                                  {formatDateTime(order.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-stone-900">
                                {order.customerName}{' '}
                                <span className="font-normal text-stone-500">
                                  · ID: {order.studentId} · {order.customerPhone}
                                </span>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-display text-base font-extrabold text-stone-900 tabular-nums">
                                {formatINR(order.totalAmount)}
                              </span>

                              <select
                                aria-label={`Update status for ${order.orderNumber}`}
                                disabled={updatingOrderId === order.id}
                                value={order.status}
                                onChange={(e) =>
                                  void handleStatusChange(order, e.target.value as OrderStatus)
                                }
                                className="px-3 py-1.5 rounded-xl border border-[#E7DFD3] bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedOrderId(isExpanded ? null : order.id)
                                }
                                className="px-3 py-1.5 rounded-xl border border-[#E7DFD3] bg-white text-xs font-semibold text-stone-700 hover:bg-[#FAF5EE]"
                              >
                                {isExpanded ? 'Hide Items' : 'View Details'}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-[#E7DFD3] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1.5">
                                <p className="font-bold text-stone-800">Customer Info</p>
                                <p className="text-stone-600">Email: {order.customerEmail}</p>
                                <p className="text-stone-600">Phone: {order.customerPhone}</p>
                                <p className="text-stone-600">Payment: {order.paymentMethod}</p>
                                {order.pickupNote && (
                                  <p className="text-orange-800 font-medium">
                                    Note: &ldquo;{order.pickupNote}&rdquo;
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-stone-800 mb-1.5">Ordered Items</p>
                                <ul className="space-y-1">
                                  {order.items.map((item) => (
                                    <li
                                      key={item.foodId}
                                      className="flex items-center justify-between text-stone-700 tabular-nums"
                                    >
                                      <span>
                                        {item.quantity}× {item.name} ({formatINR(item.price)})
                                      </span>
                                      <span className="font-semibold">
                                        {formatINR(item.price * item.quantity)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MENU MANAGEMENT TAB */}
            {activeTab === 'menu' && (
              <div className="bg-white border border-[#E7DFD3] rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Search menu items..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E7DFD3] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <select
                    value={menuCategoryFilter}
                    onChange={(e) => setMenuCategoryFilter(e.target.value)}
                    aria-label="Filter menu by category"
                    className="px-3.5 py-2 rounded-xl border border-[#E7DFD3] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="All">All Categories</option>
                    {FOOD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {menuLoading ? (
                  <div className="h-48 bg-stone-50 rounded-xl animate-pulse" />
                ) : filteredMenu.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-sm text-stone-600">No menu items found.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFood(null);
                        setFoodModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold"
                    >
                      Add First Dish
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E7DFD3] text-xs font-semibold text-stone-500">
                          <th className="py-3 pr-4">Dish</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3 text-right">Price</th>
                          <th className="py-3 px-3">Availability</th>
                          <th className="py-3 pl-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EAE1] text-sm">
                        {filteredMenu.map((food) => (
                          <tr key={food.id} className="hover:bg-[#FAF5EE]/50 transition-colors">
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-3">
                                <FoodImage
                                  src={food.imageUrl}
                                  alt={food.name}
                                  className="w-12 h-10 rounded-lg object-cover shrink-0 bg-[#FAF5EE]"
                                />
                                <div>
                                  <p className="font-semibold text-stone-900">{food.name}</p>
                                  <p className="text-xs text-stone-500">
                                    {food.isVeg ? 'Veg' : 'Non-Veg'}
                                    {food.isSpecial ? ' · Special' : ''}
                                    {food.isPopular ? ' · Popular' : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-stone-600">{food.category}</td>
                            <td className="py-3.5 px-3 text-right font-bold text-stone-900 tabular-nums">
                              {formatINR(food.price)}
                            </td>
                            <td className="py-3.5 px-3">
                              <button
                                type="button"
                                onClick={() => void handleToggleAvailability(food)}
                                className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                  food.available
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                    : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
                                }`}
                              >
                                {food.available ? 'Available' : 'Sold Out'}
                              </button>
                            </td>
                            <td className="py-3.5 pl-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFood(food);
                                    setFoodModalOpen(true);
                                  }}
                                  className="p-2 rounded-lg text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                                  aria-label={`Edit ${food.name}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingFood(food)}
                                  className="p-2 rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  aria-label={`Delete ${food.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SALES & POPULAR FOOD ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Selling Dishes */}
                  <div className="bg-white border border-[#E7DFD3] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ChefHat className="w-5 h-5 text-orange-600" />
                      <h2 className="font-display text-base font-bold text-stone-900">
                        Top Selling Dishes
                      </h2>
                    </div>

                    {analytics.topDishes.length === 0 ? (
                      <p className="text-sm text-stone-500 py-8 text-center">
                        Sales rankings will appear once orders are placed.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.topDishes.map((dish, idx) => (
                          <div
                            key={dish.name}
                            className="flex items-center justify-between py-2 border-b border-[#F0EAE1] last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-xs font-bold text-stone-400 w-5">
                                0{idx + 1}
                              </span>
                              <span className="text-sm font-semibold text-stone-900 truncate">
                                {dish.name}
                              </span>
                            </div>
                            <div className="text-right shrink-0 tabular-nums">
                              <span className="text-sm font-bold text-stone-900">
                                {dish.quantity} sold
                              </span>
                              <span className="text-xs text-stone-500 block">
                                {formatINR(dish.revenue)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revenue by Category */}
                  <div className="bg-white border border-[#E7DFD3] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-orange-600" />
                      <h2 className="font-display text-base font-bold text-stone-900">
                        Revenue by Category
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {analytics.categoryBreakdown.map((cat) => {
                        const pct = Math.round((cat.revenue / analytics.maxCatRev) * 100);
                        return (
                          <div key={cat.category} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-stone-700">{cat.category}</span>
                              <span className="font-bold text-stone-900 tabular-nums">
                                {formatINR(cat.revenue)}
                              </span>
                            </div>
                            <div className="h-2.5 rounded-full bg-[#FAF5EE] overflow-hidden">
                              <div
                                className="h-full bg-orange-600 rounded-full transition-all duration-300"
                                style={{ width: `${cat.revenue > 0 ? Math.max(6, pct) : 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 7-Day Daily Revenue Chart */}
                <div className="bg-white border border-[#E7DFD3] rounded-2xl p-6">
                  <h2 className="font-display text-base font-bold text-stone-900 mb-5">
                    7-Day Revenue Trend
                  </h2>
                  <div className="grid grid-cols-7 gap-3 items-end h-44 pt-4">
                    {analytics.days.map((day) => {
                      const heightPct =
                        day.revenue > 0
                          ? Math.max(12, Math.round((day.revenue / analytics.maxDailyRev) * 100))
                          : 4;
                      return (
                        <div key={day.label} className="flex flex-col items-center h-full justify-end">
                          <span className="text-[11px] font-semibold text-stone-700 tabular-nums mb-1.5">
                            {day.revenue > 0 ? formatINR(day.revenue) : '₹0'}
                          </span>
                          <div className="w-full max-w-[44px] flex-1 flex items-end">
                            <div
                              className={`w-full rounded-t-lg transition-all duration-300 ${
                                day.revenue > 0 ? 'bg-orange-600' : 'bg-stone-200'
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-stone-500 mt-2">
                            {day.label}
                          </span>
                          <span className="text-[10px] text-stone-400 tabular-nums">
                            {day.orders} ord
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add / Edit Food Modal */}
      <FoodFormModal
        open={foodModalOpen}
        editingItem={editingFood}
        onClose={() => {
          setFoodModalOpen(false);
          setEditingFood(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingFood)}
        title="Delete Menu Item?"
        description={
          deletingFood
            ? `Are you sure you want to permanently remove "${deletingFood.name}" from the canteen menu?`
            : ''
        }
        confirmLabel="Delete Item"
        destructive
        loading={deleteLoading}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeletingFood(null)}
      />
    </div>
  );
}
