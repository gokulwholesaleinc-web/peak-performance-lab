import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// Status Color Utilities
// ============================================

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled"

/**
 * Returns the badge variant for a booking/appointment status
 * Used for consistent status badge styling across the application
 */
export function getStatusColor(status: BookingStatus): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "confirmed":
      return "default"
    case "pending":
      return "secondary"
    case "completed":
      return "outline"
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

// ============================================
// Time Formatting Utilities
// ============================================

/**
 * Formats an appointment time range as "HH:mm - HH:mm"
 * @param scheduledAt - ISO datetime string of the appointment start
 * @param durationMins - Duration of the appointment in minutes
 * @returns Formatted time range string (e.g., "09:00 - 10:00")
 */
export function formatAppointmentTime(scheduledAt: string, durationMins: number): string {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMins * 60 * 1000)
  return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
}

/**
 * Returns the start and end times as separate strings
 * @param scheduledAt - ISO datetime string of the appointment start
 * @param durationMins - Duration of the appointment in minutes
 * @returns Object with startTime and endTime as "HH:mm" strings
 */
export function getAppointmentTimes(scheduledAt: string, durationMins: number): { startTime: string; endTime: string } {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMins * 60 * 1000)
  return {
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
  }
}

// ============================================
// Booking Transformation Utilities
// ============================================

export interface BookingFromAPI {
  id: number
  scheduledAt: string
  durationMins: number
  status: BookingStatus
  locationType: "mobile" | "virtual"
  locationAddress: string | null
  notes: string | null
  service: {
    id: number
    name: string
    durationMins: number
    price: string
  }
}

export interface FormattedAppointment {
  id: string
  serviceName: string
  date: Date
  startTime: string
  endTime: string
  status: string
  locationType: "mobile" | "virtual"
  location: string | undefined
}

/**
 * Transforms a booking from the API format to the UI display format
 * Used by AppointmentCard and other client-facing components
 */
export function transformBookingToAppointment(booking: BookingFromAPI): FormattedAppointment {
  const startDate = new Date(booking.scheduledAt)
  const endDate = new Date(startDate.getTime() + booking.durationMins * 60 * 1000)

  return {
    id: booking.id.toString(),
    serviceName: booking.service.name,
    date: startDate,
    startTime: startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    endTime: endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    status: booking.status === "pending" ? "scheduled" : booking.status,
    locationType: booking.locationType,
    location: booking.locationAddress || undefined,
  }
}
