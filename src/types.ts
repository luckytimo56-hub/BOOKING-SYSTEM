export type PressurePreference = 
  | 'Light / Gentle' 
  | 'Medium / Balanced' 
  | 'Firm' 
  | 'Deep Tissue / Intensive' 
  | 'Deep Acupressure';

export type ServiceCategory = 
  | 'relaxation' 
  | 'therapeutic' 
  | 'specialty' 
  | 'holistic' 
  | 'thai-traditional' 
  | 'foot-spa' 
  | 'aromatherapy' 
  | 'express';

export interface ServiceDurationOption {
  durationMinutes: number;
  price: number;
}

export interface MassageService {
  id: string;
  name: string;
  category: ServiceCategory;
  tagline: string;
  description: string;
  durations: ServiceDurationOption[];
  recommendedAddons: string[];
  pressureLevels: PressurePreference[];
  image: string;
  popular?: boolean;
}

export interface AddonOption {
  id: string;
  name: string;
  description: string;
  price: number;
  extraMinutes: number;
  icon: string;
}

export interface Therapist {
  id: string;
  name: string;
  title: string;
  licenseNumber: string;
  avatar: string;
  bio: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  workingDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  shiftStart: string; // "09:00"
  shiftEnd: string; // "18:00"
  breakStart: string; // "13:00"
  breakEnd: string; // "14:00"
  roomNumber: string;
  isActive: boolean;
}

export interface ShiftOverride {
  id: string;
  therapistId: string;
  date: string; // YYYY-MM-DD
  isOff: boolean;
  shiftStart?: string;
  shiftEnd?: string;
  breakStart?: string;
  breakEnd?: string;
  reason?: string;
}

export interface ClientDetails {
  fullName: string;
  email: string;
  phone: string;
  receiveSmsReminders?: boolean;
  notes?: string;
  pressurePreference: PressurePreference;
  focusAreas: string[];
  medicalConditions: string[];
}

export interface AppointmentPricing {
  servicePrice: number;
  addonsTotal: number;
  discount: number;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentType: 'full' | 'deposit';
}

export interface PaymentDetails {
  method: 'credit_card' | 'apple_pay' | 'google_pay' | 'gift_card';
  transactionId: string;
  authCode: string;
  paidAt: string;
  last4?: string;
  cardBrand?: string;
  receiptUrl?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in-service' | 'completed' | 'declined' | 'cancelled' | 'rescheduled';

export interface Appointment {
  id: string;
  confirmationCode: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  therapistId: string;
  therapistName: string;
  therapistAvatar: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "10:00"
  endTime: string; // "11:00"
  roomNumber: string;
  addons: { id: string; name: string; price: number }[];
  client: ClientDetails;
  pricing: AppointmentPricing;
  payment: PaymentDetails;
  status: AppointmentStatus;
  emailSent: boolean;
  emailSentAt: string;
  smsSent?: boolean;
  smsSentAt?: string;
  createdAt: string;
  // Front Desk control & audit tracking
  branchId?: string;
  declineReason?: string;
  declinedAt?: string;
  declinedBy?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  checkedInAt?: string;
  completedAt?: string;
  frontDeskNotes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  therapistIds: string[];
  isLocked?: boolean;
  lockedBy?: string;
}

export interface EmailLog {
  id: string;
  appointmentId: string;
  confirmationCode: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  sentAt: string;
  type: 'booking_confirmation' | 'reminder_24h' | 'rescheduled' | 'cancellation' | 'cancelled' | 'receipt' | string;
  status: 'delivered' | 'opened' | 'sent';
  htmlBody: string;
  htmlContent?: string;
}

export type EmailNotification = EmailLog;

export interface NotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  reminder24hSms: boolean;
  instantConfirmationSms: boolean;
  reminder2hSms: boolean;
  senderPhone?: string;
  smsGateway?: string;
}

export interface SmsLog {
  id: string;
  appointmentId?: string;
  confirmationCode?: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  sentAt: string;
  type: 'booking_confirmation' | 'reminder_24h' | 'reminder_2h' | 'rescheduled' | 'cancellation' | 'test' | string;
  status: 'delivered' | 'sent' | 'queued';
}

export interface GeneratedAmbianceImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  imageSize?: '1K' | '2K' | '4K' | string;
  createdAt: string;
}

export interface TherapistPerformanceStat {
  therapistId: string;
  name: string;
  avatar: string;
  title: string;
  completedBookings: number;
  totalRevenue: number;
  totalTips: number;
  utilizationRate: number; // percentage, e.g. 84.5
  averageRating: number;
  reviewCount: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  bookings: number;
  tips?: number;
}

export interface AnalyticsSummary {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueGrowthPct: number;
  totalBookings: number;
  averageTicketValue: number;
  depositCollected: number;
  remainingBalanceDue: number;
  monthlyTrend: MonthlyRevenuePoint[];
  revenueByService: { serviceName: string; revenue: number; percentage: number; bookingsCount: number }[];
  therapistPerformance: TherapistPerformanceStat[];
}

export type LoyaltyTier = 'Classic' | 'Silver Suki' | 'Gold VIP' | 'Platinum Royal';

export type LoyaltyAuditAction = 
  | 'CARD_CREATED'
  | 'STAMPS_ADDED'
  | 'STAMPS_DEDUCTED'
  | 'TIER_UPGRADED'
  | 'TIER_DOWNGRADED'
  | 'POINTS_ADJUSTED'
  | 'REWARD_GRANTED'
  | 'REWARD_REDEEMED'
  | 'PROFILE_EDITED'
  | 'STATUS_CHANGED'
  | 'EXPIRY_EXTENDED'
  | 'MANUAL_CORRECTION'
  | 'CARD_EDITED';

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  expiresAt?: string;
  status: 'available' | 'redeemed' | 'expired';
  redeemedAt?: string;
  redeemedByAdmin?: string;
}

export interface LoyaltyAuditTrail {
  id: string;
  cardId: string;
  cardNumber: string;
  customerName: string;
  timestamp: string;
  adminName: string;
  adminRole: string;
  action: LoyaltyAuditAction;
  fieldChanged: string;
  previousValue: string;
  newValue: string;
  reason: string;
  branch: string;
}

export interface LoyaltyCard {
  id: string;
  cardNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  tier: LoyaltyTier;
  stamps: number;
  stampsTarget: number;
  points: number;
  totalVisits: number;
  lifetimeSpend: number;
  rewards: LoyaltyReward[];
  status: 'active' | 'suspended' | 'expired';
  homeBranch: string;
  issuedAt: string;
  expiresAt: string;
  notes?: string;
  auditTrail: LoyaltyAuditTrail[];
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  city?: string;
  openingHours?: string;
  podCount?: number;
  isActive?: boolean;
}
