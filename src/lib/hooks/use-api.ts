"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types for API responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

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

// Generic fetch function with error handling
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ============================================
// User / Auth Hooks
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
    queryFn: () => fetchApi<{ user: CurrentUser }>("/api/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// Services Hooks
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

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => fetchApi<{ data: Service[] }>("/api/services"),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================
// Bookings / Appointments Hooks
// ============================================

export interface Appointment {
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

export interface BookingsParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export function useBookings(params: BookingsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.set("startDate", params.startDate);
  if (params.endDate) queryParams.set("endDate", params.endDate);
  if (params.status) queryParams.set("status", params.status);
  if (params.clientId) queryParams.set("clientId", params.clientId);
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.limit) queryParams.set("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = `/api/bookings${queryString ? `?${queryString}` : ""}`;

  return useQuery({
    queryKey: ["bookings", params],
    queryFn: () => fetchApi<PaginatedResponse<Appointment>>(url),
  });
}

export function useUpcomingBookings() {
  const today = new Date().toISOString();
  return useBookings({ startDate: today, status: "pending" });
}

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
      fetchApi<AvailabilityResponse>(
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
      fetchApi<{ data: Appointment }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: number) =>
      fetchApi<{ data: Appointment; message: string }>(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ============================================
// Client Packages Hooks
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
    queryFn: () => fetchApi<ClientPackagesResponse>("/api/client/packages"),
  });
}

// ============================================
// Available Packages (for purchase)
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
    queryFn: () => fetchApi<{ data: AvailablePackage[] }>("/api/packages"),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================
// Invoices Hooks
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
    queryFn: () => fetchApi<PaginatedResponse<Invoice>>(url),
  });
}

// ============================================
// Profile / Client Hooks
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
    queryFn: () => fetchApi<{ data: ClientProfile }>(`/api/clients/${clientId}`),
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
      fetchApi<{ data: ClientProfile }>(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientProfile", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
