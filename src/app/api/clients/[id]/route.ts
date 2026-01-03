import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users, appointments, clientPackages, packages, services } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAuth,
  AuthError,
} from "@/lib/api-utils";

// Validation schema for updating a client
const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/clients/[id]
 * Get client details with appointments and packages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return errorResponse("Invalid client ID", 400);
    }

    // Non-admin users can only view their own profile
    if (currentUser.role !== "admin" && currentUser.id !== id) {
      return errorResponse("Forbidden", 403);
    }

    // Get client details
    const [client] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "client")))
      .limit(1);

    if (!client) {
      return errorResponse("Client not found", 404);
    }

    // Get client's appointments
    const clientAppointments = await db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        durationMins: appointments.durationMins,
        status: appointments.status,
        locationType: appointments.locationType,
        locationAddress: appointments.locationAddress,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        service: {
          id: services.id,
          name: services.name,
          price: services.price,
        },
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.clientId, id))
      .orderBy(desc(appointments.scheduledAt))
      .limit(10);

    // Get client's active packages
    const activePackages = await db
      .select({
        id: clientPackages.id,
        remainingSessions: clientPackages.remainingSessions,
        purchasedAt: clientPackages.purchasedAt,
        expiresAt: clientPackages.expiresAt,
        package: {
          id: packages.id,
          name: packages.name,
          sessionCount: packages.sessionCount,
          price: packages.price,
        },
      })
      .from(clientPackages)
      .innerJoin(packages, eq(clientPackages.packageId, packages.id))
      .where(
        and(
          eq(clientPackages.clientId, id),
          gte(clientPackages.expiresAt, new Date())
        )
      )
      .orderBy(desc(clientPackages.purchasedAt));

    return jsonResponse({
      data: {
        ...client,
        appointments: clientAppointments,
        packages: activePackages,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error fetching client:", error);
    return errorResponse("Failed to fetch client", 500);
  }
}

/**
 * PATCH /api/clients/[id]
 * Update client details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return errorResponse("Invalid client ID", 400);
    }

    // Non-admin users can only update their own profile
    if (currentUser.role !== "admin" && currentUser.id !== id) {
      return errorResponse("Forbidden", 403);
    }

    // Check if client exists
    const [existingClient] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "client")))
      .limit(1);

    if (!existingClient) {
      return errorResponse("Client not found", 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateClientSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const updateData = validationResult.data;

    // Update the client
    const [updatedClient] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return jsonResponse({ data: updatedClient });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error updating client:", error);
    return errorResponse("Failed to update client", 500);
  }
}
