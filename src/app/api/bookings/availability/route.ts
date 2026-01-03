import { NextRequest } from "next/server";
import { db } from "@/db";
import { availability, blockedTimes, appointments, services } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

/**
 * GET /api/bookings/availability
 * Get available time slots for a date and service
 *
 * Query params:
 * - date: ISO date string (required)
 * - serviceId: Service ID (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const serviceIdStr = searchParams.get("serviceId");

    // Validate required parameters
    if (!dateStr) {
      return errorResponse("date parameter is required", 400);
    }
    if (!serviceIdStr) {
      return errorResponse("serviceId parameter is required", 400);
    }

    const serviceId = parseInt(serviceIdStr, 10);
    if (isNaN(serviceId)) {
      return errorResponse("Invalid serviceId", 400);
    }

    // Parse the date
    const requestedDate = new Date(dateStr);
    if (isNaN(requestedDate.getTime())) {
      return errorResponse("Invalid date format", 400);
    }

    // Get the service to know duration
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.isActive, true)))
      .limit(1);

    if (!service) {
      return errorResponse("Service not found or inactive", 404);
    }

    const serviceDuration = service.durationMins;

    // Get day of week (0-6, Sunday-Saturday)
    const dayOfWeek = requestedDate.getDay();

    // Get availability for this day
    const dayAvailability = await db
      .select()
      .from(availability)
      .where(and(eq(availability.dayOfWeek, dayOfWeek), eq(availability.isActive, true)));

    if (dayAvailability.length === 0) {
      return jsonResponse({ data: { date: dateStr, slots: [] } });
    }

    // Set up date boundaries for the requested date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get blocked times for this date
    const blockedTimesForDate = await db
      .select()
      .from(blockedTimes)
      .where(
        and(
          lte(blockedTimes.startDatetime, endOfDay),
          gte(blockedTimes.endDatetime, startOfDay)
        )
      );

    // Get existing appointments for this date
    const existingAppointments = await db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        durationMins: appointments.durationMins,
      })
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
          eq(appointments.status, "pending")
        )
      );

    // Also include confirmed appointments
    const confirmedAppointments = await db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        durationMins: appointments.durationMins,
      })
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduledAt, startOfDay),
          lte(appointments.scheduledAt, endOfDay),
          eq(appointments.status, "confirmed")
        )
      );

    const allBookedAppointments = [...existingAppointments, ...confirmedAppointments];

    // Generate available time slots
    const availableSlots: { startTime: string; endTime: string }[] = [];

    for (const avail of dayAvailability) {
      // Parse availability times
      const [startHour, startMin] = avail.startTime.split(":").map(Number);
      const [endHour, endMin] = avail.endTime.split(":").map(Number);

      // Create slot start and end times for this availability window
      const windowStart = new Date(requestedDate);
      windowStart.setHours(startHour, startMin, 0, 0);
      const windowEnd = new Date(requestedDate);
      windowEnd.setHours(endHour, endMin, 0, 0);

      // Generate slots at 30-minute intervals (or service duration, whichever is smaller)
      const slotInterval = Math.min(30, serviceDuration);
      let currentSlotStart = new Date(windowStart);

      while (currentSlotStart.getTime() + serviceDuration * 60 * 1000 <= windowEnd.getTime()) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + serviceDuration * 60 * 1000);

        // Check if slot is in the past
        const now = new Date();
        if (currentSlotStart <= now) {
          currentSlotStart = new Date(currentSlotStart.getTime() + slotInterval * 60 * 1000);
          continue;
        }

        // Check if slot overlaps with blocked times
        let isBlocked = false;
        for (const blocked of blockedTimesForDate) {
          if (
            currentSlotStart < new Date(blocked.endDatetime) &&
            currentSlotEnd > new Date(blocked.startDatetime)
          ) {
            isBlocked = true;
            break;
          }
        }

        if (isBlocked) {
          currentSlotStart = new Date(currentSlotStart.getTime() + slotInterval * 60 * 1000);
          continue;
        }

        // Check if slot overlaps with existing appointments
        let isBooked = false;
        for (const appt of allBookedAppointments) {
          const apptStart = new Date(appt.scheduledAt);
          const apptEnd = new Date(apptStart.getTime() + appt.durationMins * 60 * 1000);

          if (currentSlotStart < apptEnd && currentSlotEnd > apptStart) {
            isBooked = true;
            break;
          }
        }

        if (!isBooked) {
          availableSlots.push({
            startTime: currentSlotStart.toISOString(),
            endTime: currentSlotEnd.toISOString(),
          });
        }

        currentSlotStart = new Date(currentSlotStart.getTime() + slotInterval * 60 * 1000);
      }
    }

    return jsonResponse({
      data: {
        date: dateStr,
        service: {
          id: service.id,
          name: service.name,
          durationMins: service.durationMins,
        },
        slots: availableSlots,
      },
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return errorResponse("Failed to fetch availability", 500);
  }
}
