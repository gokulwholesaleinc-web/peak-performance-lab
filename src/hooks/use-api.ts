"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================
// Shared Types & Utilities
// ============================================

// Base API error class
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Generic API response type
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Base fetch helper with error handling
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(error.error || "Request failed", response.status);
  }

  return response.json();
}

// ============================================
// User / Auth Hooks (Client Portal)
// ============================================

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "client";
  createdAt: string;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => apiFetch<{ user: CurrentUser }>("/api/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// Services API (Admin & Client)
// ============================================

export interface Service {
  id: number;
  name: string;
  description: string | null;
  durationMins: number;
  price: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceFormData {
  name: string;
  description?: string;
  durationMins: number;
  price: string;
  category?: string;
  isActive?: boolean;
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await apiFetch<ApiResponse<Service[]>>("/api/services");
      return response.data;
    },
  });
}

export function useAllServices() {
  return useQuery({
    queryKey: ["services", "all"],
    queryFn: async () => {
      const response = await apiFetch<ApiResponse<Service[]>>("/api/services?includeInactive=true");
      return response.data;
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const response = await apiFetch<ApiResponse<Service>>("/api/services", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServiceFormData> }) => {
      const response = await apiFetch<ApiResponse<Service>>(`/api/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch<ApiResponse<Service>>(`/api/services/${id}`, {
        method: "DELETE",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

// ============================================
// Packages API (Admin)
// ============================================

export interface Package {
  id: number;
  name: string;
  description: string | null;
  sessionCount: number;
  price: string;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface PackageFormData {
  name: string;
  description?: string;
  sessionCount: number;
  price: string;
  validityDays: number;
  isActive?: boolean;
}

export function usePackages() {
  return useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await apiFetch<ApiResponse<Package[]>>("/api/packages");
      return response.data;
    },
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PackageFormData) => {
      const response = await apiFetch<ApiResponse<Package>>("/api/packages", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PackageFormData> }) => {
      const response = await apiFetch<ApiResponse<Package>>(`/api/packages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiFetch<ApiResponse<Package>>(`/api/packages/${id}`, {
        method: "DELETE",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

// ============================================
// Available Packages (Client Portal - for purchase)
// ============================================

export interface AvailablePackage {
  id: number;
  name: string;
  description: string | null;
  sessionCount: number;
  price: string;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
}

export function useAvailablePackages() {
  return useQuery({
    queryKey: ["availablePackages"],
    queryFn: () => apiFetch<{ data: AvailablePackage[] }>("/api/packages"),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================
// Client Packages (Client Portal - purchased packages)
// ============================================

export interface ClientPackage {
  id: string;
  name: string;
  description: string | null;
  sessionsUsed: number;
  sessionsRemaining: number;
  sessionsTotal: number;
  purchasedAt: string;
  expiresAt: string | null;
  status: "active" | "expired" | "depleted";
  serviceType: string;
  packageId: number;
}

export interface ClientPackagesResponse {
  data: {
    active: ClientPackage[];
    inactive: ClientPackage[];
    all: ClientPackage[];
  };
}

export function useClientPackages() {
  return useQuery({
    queryKey: ["clientPackages"],
    queryFn: () => apiFetch<ClientPackagesResponse>("/api/client/packages"),
  });
}

// ============================================
// Clients API (Admin)
// ============================================

export interface Client {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithStats extends Client {
  totalAppointments?: number;
  activePackages?: number;
}

export function useClients(options?: { search?: string; page?: number; limit?: number }) {
  const { search, page = 1, limit = 20 } = options || {};

  return useQuery({
    queryKey: ["clients", { search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const response = await apiFetch<PaginatedResponse<Client>>(
        `/api/clients?${params.toString()}`
      );
      return response;
    },
  });
}

// ============================================
// Client Profile (Client Portal)
// ============================================

export interface ClientProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "client";
  createdAt: string;
  updatedAt: string;
  appointments: Array<{
    id: number;
    scheduledAt: string;
    durationMins: number;
    status: string;
    locationType: string;
    locationAddress: string | null;
    notes: string | null;
    createdAt: string;
    service: {
      id: number;
      name: string;
      price: string;
    };
  }>;
  packages: Array<{
    id: number;
    remainingSessions: number;
    purchasedAt: string;
    expiresAt: string;
    package: {
      id: number;
      name: string;
      sessionCount: number;
      price: string;
    };
  }>;
}

export function useClientProfile(clientId: string | undefined) {
  return useQuery({
    queryKey: ["clientProfile", clientId],
    queryFn: () => apiFetch<{ data: ClientProfile }>(`/api/clients/${clientId}`),
    enabled: !!clientId,
  });
}

export interface UpdateProfileData {
  name?: string;
  phone?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: UpdateProfileData }) =>
      apiFetch<{ data: ClientProfile }>(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientProfile", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

// ============================================
// Bookings / Appointments API (Admin & Client)
// ============================================

export interface Booking {
  id: number;
  scheduledAt: string;
  durationMins: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  locationType: "mobile" | "virtual";
  locationAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  service: {
    id: number;
    name: string;
    durationMins: number;
    price: string;
  };
}

// Alias for client portal compatibility
export type Appointment = Booking;

export interface BookingsParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export function useBookings(params: BookingsParams = {}) {
  const { startDate, endDate, status, clientId, page = 1, limit = 100 } = params;

  return useQuery({
    queryKey: ["bookings", { startDate, endDate, status, clientId, page, limit }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.set("startDate", startDate);
      if (endDate) queryParams.set("endDate", endDate);
      if (status) queryParams.set("status", status);
      if (clientId) queryParams.set("clientId", clientId);
      queryParams.set("page", String(page));
      queryParams.set("limit", String(limit));

      const response = await apiFetch<PaginatedResponse<Booking>>(
        `/api/bookings?${queryParams.toString()}`
      );
      return response;
    },
  });
}

export function useTodaysBookings() {
  const today = new Date();
  const startDate = today.toISOString().split("T")[0];
  const endDate = startDate;

  return useBookings({ startDate, endDate, limit: 50 });
}

export function useUpcomingBookings() {
  const today = new Date().toISOString();
  return useBookings({ startDate: today, status: "pending" });
}

// ============================================
// Booking Availability & Creation (Client Portal)
// ============================================

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponse {
  data: {
    date: string;
    service: {
      id: number;
      name: string;
      durationMins: number;
    };
    slots: TimeSlot[];
  };
}

export function useAvailability(date: string | null, serviceId: number | null) {
  return useQuery({
    queryKey: ["availability", date, serviceId],
    queryFn: () =>
      apiFetch<AvailabilityResponse>(
        `/api/bookings/availability?date=${date}&serviceId=${serviceId}`
      ),
    enabled: !!date && !!serviceId,
  });
}

export interface CreateBookingData {
  serviceId: number;
  scheduledAt: string;
  locationType: "mobile" | "virtual";
  locationAddress?: string;
  notes?: string;
  clientId?: string;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingData) =>
      apiFetch<{ data: Appointment }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: number) =>
      apiFetch<{ data: Appointment; message: string }>(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

// ============================================
// Invoices API (Client Portal)
// ============================================

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string | null;
  status: "draft" | "sent" | "paid" | "cancelled" | "overdue";
  amount: number;
  paidAt: string | null;
  stripeInvoiceId: string | null;
  payments: {
    id: number;
    amount: number;
    method: string | null;
    paidAt: string;
  }[];
}

export function useInvoices(params: { status?: string; page?: number; limit?: number } = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.set("status", params.status);
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.limit) queryParams.set("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = `/api/invoices${queryString ? `?${queryString}` : ""}`;

  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => apiFetch<PaginatedResponse<Invoice>>(url),
  });
}

// ============================================
// Dashboard Stats API (Admin)
// ============================================

export interface DashboardStats {
  totalClients: number;
  upcomingAppointments: number;
  todayAppointments: number;
  revenueThisMonth: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Fetch clients count
      const clientsResponse = await apiFetch<PaginatedResponse<Client>>("/api/clients?limit=1");

      // Fetch today's bookings
      const today = new Date().toISOString().split("T")[0];
      const todayBookingsResponse = await apiFetch<PaginatedResponse<Booking>>(
        `/api/bookings?startDate=${today}&endDate=${today}&limit=1`
      );

      // Fetch upcoming bookings (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingBookingsResponse = await apiFetch<PaginatedResponse<Booking>>(
        `/api/bookings?startDate=${today}&endDate=${nextWeek.toISOString().split("T")[0]}&limit=1`
      );

      return {
        totalClients: clientsResponse.pagination.total,
        todayAppointments: todayBookingsResponse.pagination.total,
        upcomingAppointments: upcomingBookingsResponse.pagination.total,
        revenueThisMonth: 0, // TODO: Add revenue API endpoint
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

// ============================================
// Activity Feed (Admin)
// ============================================

export interface ActivityItem {
  id: string;
  type: "booking" | "payment" | "client" | "cancellation";
  message: string;
  timestamp: string;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      // Fetch recent bookings and transform into activity
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const bookingsResponse = await apiFetch<PaginatedResponse<Booking>>(
        `/api/bookings?startDate=${weekAgo.toISOString().split("T")[0]}&limit=10`
      );

      // Transform bookings into activity items
      const activities: ActivityItem[] = bookingsResponse.data.map((booking) => ({
        id: String(booking.id),
        type: booking.status === "cancelled" ? "cancellation" : "booking",
        message: booking.status === "cancelled"
          ? `Appointment cancelled: ${booking.client.name} - ${booking.service.name}`
          : `New booking: ${booking.client.name} for ${booking.service.name}`,
        timestamp: booking.createdAt,
      }));

      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activities.slice(0, 5);
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}
