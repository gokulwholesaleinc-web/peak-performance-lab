import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { appointments, services, users } from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAuth,
  parsePagination,
  paginatedResponse,
  AuthError,
} from "@/lib/api-utils";

// Validation schema for creating an appointment
const createAppointmentSchema = z.object({
  clientId: z.string().uuid().optional(), // Optional for clients booking themselves
  serviceId: z.number().int().positive(),
  scheduledAt: z.string().datetime(),
  locationType: z.enum(["mobile", "virtual"]),
  locationAddress: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/bookings
 * List appointments with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    const { page, limit, offset } = parsePagination(request);
    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    // Build base conditions
    const conditions = [];

    // Non-admin users can only see their own appointments
    if (currentUser.role !== "admin") {
      conditions.push(eq(appointments.clientId, currentUser.id));
    } else if (clientId) {
      conditions.push(eq(appointments.clientId, clientId));
    }

    // Date filters
    if (startDate) {
      conditions.push(gte(appointments.scheduledAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(appointments.scheduledAt, new Date(endDate)));
    }

    // Status filter
    if (status && ["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      conditions.push(eq(appointments.status, status as "pending" | "confirmed" | "completed" | "cancelled"));
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // Get appointments with related data
    const appointmentsList = await db
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
          phone: users.phone,
        },
        service: {
          id: services.id,
          name: services.name,
          durationMins: services.durationMins,
          price: services.price,
        },
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.clientId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(whereClause)
      .orderBy(desc(appointments.scheduledAt))
      .limit(limit)
      .offset(offset);

    return paginatedResponse(appointmentsList, total, page, limit);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error fetching appointments:", error);
    return errorResponse("Failed to fetch appointments", 500);
  }
}

/**
 * POST /api/bookings
 * Create a new appointment
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAppointmentSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const { serviceId, scheduledAt, locationType, locationAddress, notes } =
      validationResult.data;

    // Determine client ID
    let { clientId } = validationResult.data;
    if (!clientId) {
      // If no clientId provided, use current user (must be a client)
      if (currentUser.role === "admin") {
        return errorResponse("Admin must specify a clientId", 400);
      }
      clientId = currentUser.id;
    } else {
      // Only admin can book for other clients
      if (currentUser.role !== "admin" && clientId !== currentUser.id) {
        return errorResponse("Cannot book appointments for other clients", 403);
      }
    }

    // Validate client exists
    const [client] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, clientId), eq(users.role, "client")))
      .limit(1);

    if (!client) {
      return errorResponse("Client not found", 404);
    }

    // Validate service exists and is active
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.isActive, true)))
      .limit(1);

    if (!service) {
      return errorResponse("Service not found or inactive", 404);
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return errorResponse("Cannot book appointments in the past", 400);
    }

    // Check for overlapping appointments
    const appointmentEndTime = new Date(scheduledDate.getTime() + service.durationMins * 60 * 1000);

    const overlappingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "pending"),
          gte(appointments.scheduledAt, scheduledDate),
          lte(appointments.scheduledAt, appointmentEndTime)
        )
      )
      .limit(1);

    // Also check for appointments that would end during this one
    const conflictingAppointments = await db
      .select()
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(
        and(
          eq(appointments.status, "pending"),
          lte(appointments.scheduledAt, scheduledDate),
          sql`${appointments.scheduledAt} + (${services.durationMins} * interval '1 minute') > ${scheduledDate}`
        )
      )
      .limit(1);

    if (overlappingAppointments.length > 0 || conflictingAppointments.length > 0) {
      return errorResponse("This time slot is not available", 409);
    }

    // Create the appointment
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        clientId,
        serviceId,
        scheduledAt: scheduledDate,
        durationMins: service.durationMins,
        status: "pending",
        locationType,
        locationAddress: locationAddress || null,
        notes: notes || null,
      })
      .returning();

    // Fetch the complete appointment with relations
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
      .where(eq(appointments.id, newAppointment.id))
      .limit(1);

    return jsonResponse({ data: completeAppointment }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error creating appointment:", error);
    return errorResponse("Failed to create appointment", 500);
  }
}
