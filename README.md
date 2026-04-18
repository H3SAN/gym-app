# Avengers-Gym-App

Phase 1 — Complete Core User Flows (In Progress)
These are features already scaffolded but not finished.

Task	Files to Touch	Priority
Class detail page — instructor info, booking CTA, attendee count	classes/[id]/page.tsx	High
Product detail page — images, description, add-to-cart	store/[id]/page.tsx	High
Cart checkout UI — review items, quantity controls, proceed to payment	store/ + new /cart page	High
Goal creation/editing — form to set & update fitness goals	progress/page.tsx, new API	Medium
Referral system backend — track referrals, apply rewards	new /api/referrals route	Medium
Phase 2 — E-Commerce & Payments
The Order + OrderItem schema exists but has no UI or payment logic.

Task	Details
Checkout flow	Cart → Address → Payment → Confirmation screens
Payment integration	Stripe (recommended) — card payments, webhooks for order status
Order history page	New /profile/orders route listing past purchases
Order status tracking	PENDING → CONFIRMED → SHIPPED → DELIVERED
Stock management	Decrement Product.stock on order confirmation
Phase 3 — Admin Dashboard
API endpoints for admin are protected but no UI exists.

Task	Details
Admin layout & auth guard	New /(admin) route group, role check
Class management	Create / edit / cancel classes, view bookings per class
Product management	Add / edit / deactivate products, manage stock levels
Member management	View all members, membership tiers, check-in history
Analytics overview	Revenue, class attendance trends, active members chart
Phase 4 — Enhanced Member Features
Features that elevate the member experience.

Task	Details
Push notifications	Web Push API — class reminders, booking confirmations
Workout plan builder	Assign/follow structured multi-week programs
Personal trainer booking	New Trainer model, session booking flow
Membership upgrade flow	In-app upsell: BASIC → PRO → ELITE with payment
Forgot password / reset	Email-based reset link flow
Phase 5 — Quality, Performance & Polish
Task	Details
Standardize API error responses	Consistent { error, code, status } shape across all routes
Persist cart to database	Sync useCart Zustand store with /api/cart on changes
Loading & skeleton states	Add skeleton loaders to all data-fetching pages
Image optimization	Migrate product/class images to Next.js <Image> with CDN
E2E tests	Playwright — cover auth, booking, checkout critical paths
Rate limiting	Add rate limits to auth + QR endpoints
Phase 6 — Native Mobile (Optional / Future)
Task	Details
React Native app	Shared Zustand stores, API layer reuse
Biometric check-in	Face ID / fingerprint for gym entry
Wearable integration	Apple Watch / Fitbit workout data sync
