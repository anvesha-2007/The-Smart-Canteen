export type FoodCategory = 'Breakfast' | 'Snacks' | 'Meals' | 'Beverages' | 'Desserts';

export const FOOD_CATEGORIES: FoodCategory[] = [
  'Breakfast',
  'Snacks',
  'Meals',
  'Beverages',
  'Desserts',
];

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Preparing',
  'Ready',
  'Completed',
];

export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  department: string;
  role: UserRole;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  price: number;
  imageUrl: string;
  available: boolean;
  isPopular: boolean;
  isSpecial: boolean;
  isVeg: boolean;
  prepTimeMinutes: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: FoodCategory;
  prepTimeMinutes: number;
}

export interface OrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  studentId: string;
  pickupNote: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'Cash at Counter';
  status: OrderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Validation constants synchronized with firebase-blueprint.json
export const SCHEMA_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  ORDER_NUMBER_PATTERN: /^[A-Z0-9-]+$/,
  NAME_MIN: 2,
  NAME_MAX: 80,
  EMAIL_MAX: 120,
  PHONE_MIN: 6,
  PHONE_MAX: 20,
  STUDENT_ID_MIN: 2,
  STUDENT_ID_MAX: 40,
  DEPARTMENT_MIN: 2,
  DEPARTMENT_MAX: 80,
  FOOD_DESC_MIN: 5,
  FOOD_DESC_MAX: 400,
  FOOD_PRICE_MAX: 10000,
  PREP_TIME_MAX: 120,
  IMAGE_URL_MAX: 500,
  PICKUP_NOTE_MAX: 200,
  ORDER_MAX_ITEMS: 25,
  ORDER_ITEM_MAX_QTY: 50,
} as const;

export const BOOTSTRAPPED_ADMIN_EMAIL = 'anvesha8642@gmail.com';

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
