import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

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
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
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

// ============ Services API ============
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

// ============ Packages API ============
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

// ============ Clients API ============
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

// ============ Bookings API ============
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
    name: string;
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

export function useBookings(options?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}) {
  const { startDate, endDate, status, clientId, page = 1, limit = 100 } = options || {};

  return useQuery({
    queryKey: ["bookings", { startDate, endDate, status, clientId, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (status) params.set("status", status);
      if (clientId) params.set("clientId", clientId);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const response = await apiFetch<PaginatedResponse<Booking>>(
        `/api/bookings?${params.toString()}`
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

// ============ Dashboard Stats API ============
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

// ============ Activity Feed ============
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
