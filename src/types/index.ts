// Shared types for Peak Performance Lab

export type UserRole = 'admin' | 'client';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type LocationType = 'mobile' | 'virtual';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  durationMins: number;
  price: string;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Package {
  id: number;
  name: string;
  description: string | null;
  sessionCount: number;
  price: string;
  validityDays: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Appointment {
  id: number;
  clientId: string;
  serviceId: number;
  scheduledAt: Date;
  durationMins: number;
  status: AppointmentStatus;
  locationType: LocationType;
  locationAddress: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  client?: User;
  service?: Service;
}

export interface ClientPackage {
  id: number;
  clientId: string;
  packageId: number;
  remainingSessions: number;
  purchasedAt: Date;
  expiresAt: Date | null;
  // Joined fields
  package?: Package;
}

export interface Invoice {
  id: number;
  clientId: string;
  amount: string;
  status: InvoiceStatus;
  stripeInvoiceId: string | null;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  // Joined fields
  client?: User;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: string;
  method: string | null;
  stripePaymentId: string | null;
  paidAt: Date;
}

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Availability {
  id: number;
  dayOfWeek: number; // 0-6, Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string;
  isActive: boolean;
}

export interface BlockedTime {
  id: number;
  startDatetime: Date;
  endDatetime: Date;
  reason: string | null;
  createdAt: Date;
}

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard stats
export interface DashboardStats {
  todayAppointments: number;
  monthRevenue: number;
  totalClients: number;
  upcomingAppointments: number;
}

// Booking request
export interface BookingRequest {
  serviceId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  locationType: LocationType;
  locationAddress?: string;
  notes?: string;
  usePackage?: boolean;
  packageId?: number;
}
