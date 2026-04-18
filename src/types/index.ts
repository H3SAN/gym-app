export type Role = 'CUSTOMER' | 'ADMIN' | 'TRAINER'
export type ReferralStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED'
export type MembershipTier = 'BASIC' | 'PRO' | 'ELITE'
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'ATTENDED'
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED'
export type WeightUnit = 'KG' | 'LBS'

export interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  avatarUrl?: string | null
  role: Role
  deviceIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Membership {
  id: string
  userId: string
  tier: MembershipTier
  startDate: string
  endDate: string
  isActive: boolean
  autoRenew: boolean
}

export interface Class {
  id: string
  name: string
  description: string
  instructorName: string
  instructorPhoto?: string | null
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  difficulty: Difficulty
  isPro: boolean
  isCancelled: boolean
  location: string
  createdAt: string
}

export interface Booking {
  id: string
  userId: string
  classId: string
  bookedAt: string
  status: BookingStatus
  class?: Class
  user?: User
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string | null
  category: string
  stock: number
  isActive: boolean
  createdAt: string
}

export interface CartItem {
  id: string
  userId: string
  productId: string
  quantity: number
  addedAt: string
  product?: Product
}

export interface Order {
  id: string
  userId: string
  total: number
  status: OrderStatus
  paymentIntentId?: string | null
  shippingName?: string | null
  shippingLine1?: string | null
  shippingCity?: string | null
  shippingState?: string | null
  shippingPostal?: string | null
  shippingCountry?: string | null
  createdAt: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product?: Product
}

export interface WorkoutExercise {
  id: string
  workoutLogId: string
  name: string
  sets: number
  reps: number
  weight: number
  unit: WeightUnit
}

export interface WorkoutLog {
  id: string
  userId: string
  date: string
  notes?: string | null
  createdAt: string
  exercises?: WorkoutExercise[]
}

export interface CheckInLog {
  id: string
  userId: string
  checkedInAt: string
  deviceId?: string | null
  qrToken: string
  isValid: boolean
}

export interface QRToken {
  id: string
  userId: string
  token: string
  expiresAt: string
  used: boolean
  createdAt: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  targetValue: number
  currentValue: number
  unit: string
  targetDate: string
  createdAt: string
}

export interface Referral {
  id: string
  referrerId: string
  referredId: string | null
  code: string
  status: ReferralStatus
  rewardGiven: boolean
  createdAt: string
  completedAt: string | null
  referred?: Pick<User, 'id' | 'name' | 'createdAt'> | null
}

export interface AuthUser extends User {
  membership?: Membership | null
  faceEnrolled?: boolean
}

export type PlanDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type SessionType = 'STANDARD' | 'EXPRESS'
export type SessionStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface Trainer {
  id: string
  name: string
  bio: string
  photoUrl?: string | null
  specialties: string[]
  isActive: boolean
  createdAt: string
}

export interface TrainerSession {
  id: string
  trainerId: string
  userId: string
  scheduledAt: string
  duration: number
  type: SessionType
  status: SessionStatus
  notes?: string | null
  createdAt: string
  trainer?: Pick<Trainer, 'id' | 'name' | 'photoUrl'>
}

export interface WorkoutPlan {
  id: string
  trainerId: string
  title: string
  description: string
  difficulty: PlanDifficulty
  durationWeeks: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  trainer?: Pick<Trainer, 'id' | 'name' | 'photoUrl' | 'specialties'>
}

export interface WorkoutPlanWeek {
  id: string
  planId: string
  weekNumber: number
  days: WorkoutPlanDay[]
}

export interface WorkoutPlanDay {
  id: string
  weekId: string
  dayNumber: number
  label?: string | null
  isRest: boolean
  exercises: WorkoutPlanExercise[]
}

export interface WorkoutPlanExercise {
  id: string
  dayId: string
  name: string
  sets: number
  reps: number
  restSeconds: number
  notes?: string | null
  order: number
}

export interface UserWorkoutPlan {
  id: string
  userId: string
  planId: string
  startedAt: string
  isActive: boolean
  plan?: WorkoutPlan
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface CartState {
  items: (CartItem & { product: Product })[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
}
