import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { appointments, services, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAuth,
  AuthError,
} from "@/lib/api-utils";

// Validation schema for updating an appointment
const updateAppointmentSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  locationType: z.enum(["mobile", "virtual"]).optional(),
  locationAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/bookings/[id]
 * Get appointment details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    const { id } = await params;
    const appointmentId = parseInt(id, 10);

    if (isNaN(appointmentId)) {
      return errorResponse("Invalid appointment ID", 400);
    }

    // Get appointment with related data
    const [appointment] = await db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        durationMins: appointments.durationMins,
        status: appointments.status,
        locationType: appointments.locationType,
        locationAddress: appointments.locationAddress,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        clientId: appointments.clientId,
        client: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
        service: {
          id: services.id,
          name: services.name,
          durationMins: services.durationMins,
          price: services.price,
          category: services.category,
        },
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.clientId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment) {
      return errorResponse("Appointment not found", 404);
    }

    // Non-admin users can only view their own appointments
    if (currentUser.role !== "admin" && appointment.clientId !== currentUser.id) {
      return errorResponse("Forbidden", 403);
    }

    return jsonResponse({ data: appointment });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error fetching appointment:", error);
    return errorResponse("Failed to fetch appointment", 500);
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update appointment (reschedule, change status)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    const { id } = await params;
    const appointmentId = parseInt(id, 10);

    if (isNaN(appointmentId)) {
      return errorResponse("Invalid appointment ID", 400);
    }

    // Get existing appointment
    const [existingAppointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!existingAppointment) {
      return errorResponse("Appointment not found", 404);
    }

    // Non-admin users can only update their own appointments
    if (currentUser.role !== "admin" && existingAppointment.clientId !== currentUser.id) {
      return errorResponse("Forbidden", 403);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateAppointmentSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const updateData = validationResult.data;

    // Non-admin users have limited update permissions
    if (currentUser.role !== "admin") {
      // Clients can only cancel or reschedule pending appointments
      if (existingAppointment.status !== "pending") {
        return errorResponse("Can only modify pending appointments", 400);
      }

      // Clients can only set status to cancelled
      if (updateData.status && updateData.status !== "cancelled") {
        return errorResponse("Clients can only cancel appointments", 403);
      }
    }

    // If rescheduling, validate the new time
    if (updateData.scheduledAt) {
      const newScheduledAt = new Date(updateData.scheduledAt);
      if (newScheduledAt <= new Date()) {
        return errorResponse("Cannot schedule appointments in the past", 400);
      }
    }

    // Build update object
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateData.scheduledAt) {
      updateValues.scheduledAt = new Date(updateData.scheduledAt);
    }
    if (updateData.status) {
      updateValues.status = updateData.status;
    }
    if (updateData.locationType) {
      updateValues.locationType = updateData.locationType;
    }
    if (updateData.locationAddress !== undefined) {
      updateValues.locationAddress = updateData.locationAddress;
    }
    if (updateData.notes !== undefined) {
      updateValues.notes = updateData.notes;
    }

    // Update the appointment
    const [updatedAppointment] = await db
      .update(appointments)
      .set(updateValues)
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Fetch complete appointment with relations
    const [completeAppointment] = await db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        durationMins: appointments.durationMins,
        status: appointments.status,
        locationType: appointments.locationType,
        locationAddress: appointments.locationAddress,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        client: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        service: {
          id: services.id,
          name: services.name,
          price: services.price,
        },
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.clientId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    return jsonResponse({ data: completeAppointment });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error updating appointment:", error);
    return errorResponse("Failed to update appointment", 500);
  }
}

/**
 * DELETE /api/bookings/[id]
 * Cancel an appointment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    const { id } = await params;
    const appointmentId = parseInt(id, 10);

    if (isNaN(appointmentId)) {
      return errorResponse("Invalid appointment ID", 400);
    }

    // Get existing appointment
    const [existingAppointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!existingAppointment) {
      return errorResponse("Appointment not found", 404);
    }

    // Non-admin users can only cancel their own appointments
    if (currentUser.role !== "admin" && existingAppointment.clientId !== currentUser.id) {
      return errorResponse("Forbidden", 403);
    }

    // Check if appointment can be cancelled
    if (existingAppointment.status === "completed") {
      return errorResponse("Cannot cancel a completed appointment", 400);
    }
    if (existingAppointment.status === "cancelled") {
      return errorResponse("Appointment is already cancelled", 400);
    }

    // Cancel the appointment (soft delete by setting status to cancelled)
    const [cancelledAppointment] = await db
      .update(appointments)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    return jsonResponse({
      data: cancelledAppointment,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error cancelling appointment:", error);
    return errorResponse("Failed to cancel appointment", 500);
  }
}
