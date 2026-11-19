/**
 * Security Rule Verification Suite for Smart Canteen (Dirty Dozen Payloads)
 * Designed to run against the Firebase Local Emulator Suite (@firebase/rules-unit-testing).
 */
export interface AdversarialScenario {
  id: string;
  title: string;
  collection: 'users' | 'admins' | 'foodItems' | 'orders';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actor: 'anonymous' | 'student1' | 'student2' | 'unverifiedAdminEmail' | 'verifiedAdmin';
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOW';
}

export const DIRTY_DOZEN_SCENARIOS: AdversarialScenario[] = [
  {
    id: 'DD-01',
    title: 'Self-Admin Escalation on User Registration',
    collection: 'users',
    operation: 'create',
    actor: 'student1',
    payload: {
      uid: 'student1',
      name: 'Mallory Student',
      email: 'mallory@college.edu',
      phone: '9876543210',
      studentId: 'CS2026-099',
      department: 'Computer Science',
      role: 'admin',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    title: 'Profile Role Escalation on Update',
    collection: 'users',
    operation: 'update',
    actor: 'student1',
    payload: { role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    title: 'Cross-User PII Read Attempt',
    collection: 'users',
    operation: 'get',
    actor: 'student2',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    title: 'Unverified Email Spoofing Bootstrapped Admin',
    collection: 'foodItems',
    operation: 'create',
    actor: 'unverifiedAdminEmail',
    payload: {
      name: 'Free Hacked Item',
      description: 'Injected item via unverified email claim',
      category: 'Snacks',
      price: 1,
      imageUrl: '/src/assets/images/food_samosa_platter_1795078059708.jpg',
      available: true,
      isPopular: false,
      isSpecial: false,
      isVeg: true,
      prepTimeMinutes: 5,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    title: 'Student Attempting to Create Food Item',
    collection: 'foodItems',
    operation: 'create',
    actor: 'student1',
    payload: { name: 'Unauthorized Item', price: 10 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    title: 'Order Identity Spoofing (Wrong userId)',
    collection: 'orders',
    operation: 'create',
    actor: 'student1',
    payload: {
      orderNumber: 'SC-1001',
      userId: 'student2',
      status: 'Pending',
      paymentMethod: 'Cash at Counter',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    title: 'Order State Shortcutting (Creating Completed Order)',
    collection: 'orders',
    operation: 'create',
    actor: 'student1',
    payload: {
      orderNumber: 'SC-1002',
      userId: 'student1',
      status: 'Completed',
      paymentMethod: 'Cash at Counter',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    title: 'Student Tampering with Order Status or Total',
    collection: 'orders',
    operation: 'update',
    actor: 'student1',
    payload: { status: 'Ready', totalAmount: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    title: 'Shadow Field Injection on Order Create',
    collection: 'orders',
    operation: 'create',
    actor: 'student1',
    payload: {
      orderNumber: 'SC-1003',
      userId: 'student1',
      status: 'Pending',
      paymentMethod: 'Cash at Counter',
      isFreeDiscountOverride: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    title: 'Client Timestamp Forgery on Order Create',
    collection: 'orders',
    operation: 'create',
    actor: 'student1',
    payload: {
      orderNumber: 'SC-1004',
      userId: 'student1',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    title: 'ID Poisoning via Oversized / Invalid Document ID',
    collection: 'orders',
    operation: 'create',
    actor: 'student1',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    title: 'Unauthenticated Order Listing',
    collection: 'orders',
    operation: 'list',
    actor: 'anonymous',
    expected: 'PERMISSION_DENIED',
  },
];
