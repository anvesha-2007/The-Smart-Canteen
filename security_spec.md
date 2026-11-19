# Smart Canteen Security Specification (Phase 0)

## 1. Data Invariants
1. **Identity Isolation (PII Protection)**: A user document `/users/{userId}` can only be read by its owner (`request.auth.uid == userId`) or a verified canteen administrator. Students cannot list all user profiles.
2. **Privilege Escalation Prevention**: A student creating `/users/{userId}` can only assign `role: "student"` (unless the caller is already a verified admin). Students cannot update their `role`, `uid`, `email`, or `createdAt` fields, nor can they write to `/admins/{adminId}`.
3. **Menu Integrity**: Only verified canteen administrators (`isAdmin()`) can create, edit, toggle availability, or delete documents in `/foodItems/{foodId}`.
4. **Order Ownership & Immutability**: A student can only create an order `/orders/{orderId}` where `userId == request.auth.uid`, `status == "Pending"`, `paymentMethod == "Cash at Counter"`, and server timestamps (`request.time`) match `createdAt` and `updatedAt`.
5. **Order Status Authority**: Only verified canteen administrators can update `/orders/{orderId}` (`status` transitions among `Pending`, `Preparing`, `Ready`, `Completed`). Students cannot mark their own orders as `Completed` or alter `totalAmount`.
6. **Strict Schema Enforcement**: Every collection strictly enforces `hasAll` and `hasOnly` keys, string `.size()` bounds, numeric boundaries, enum values, and valid ID regexes (`^[a-zA-Z0-9_\\-]+$`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation on Signup**: `POST /users/student1` with `{ role: "admin", ... }` -> `PERMISSION_DENIED`.
2. **Profile Role Tampering on Update**: `PATCH /users/student1` with `{ role: "admin" }` -> `PERMISSION_DENIED`.
3. **Cross-User PII Read**: Authenticated `student2` attempting `GET /users/student1` -> `PERMISSION_DENIED`.
4. **Unverified Email Spoofing Admin**: Token with `email: "anvesha8642@gmail.com"` and `email_verified: false` -> `PERMISSION_DENIED`.
5. **Student Creating Menu Item**: Authenticated `student1` attempting `POST /foodItems/samosa` -> `PERMISSION_DENIED`.
6. **Student Spoofing Another User's Order**: `student1` creating `/orders/ord1` with `userId: "student2"` -> `PERMISSION_DENIED`.
7. **Student Creating Pre-Completed Order**: `student1` creating `/orders/ord1` with `status: "Completed"` -> `PERMISSION_DENIED`.
8. **Student Updating Order Status / Price**: `student1` updating `/orders/ord1` with `{ status: "Ready", totalAmount: 1 }` -> `PERMISSION_DENIED`.
9. **Shadow / Ghost Field Injection**: `student1` creating `/orders/ord1` with extra key `isFree: true` -> `PERMISSION_DENIED`.
10. **Client Timestamp Forgery**: Creating `/orders/ord1` with `createdAt` different from `request.time` -> `PERMISSION_DENIED`.
11. **Oversized ID Poisoning**: Creating `/orders/` with 200-character invalid ID containing spaces -> `PERMISSION_DENIED`.
12. **Unauthenticated Order Listing**: Anonymous caller attempting `LIST /orders` -> `PERMISSION_DENIED`.
