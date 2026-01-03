import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  AuthError,
} from "@/lib/api-utils";

// Validation schema for updating a service
const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  durationMins: z.number().int().positive().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").optional(),
  category: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/services/[id]
 * Get a service by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return errorResponse("Invalid service ID", 400);
    }

    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (!service) {
      return errorResponse("Service not found", 404);
    }

    return jsonResponse({ data: service });
  } catch (error) {
    console.error("Error fetching service:", error);
    return errorResponse("Failed to fetch service", 500);
  }
}

/**
 * PATCH /api/services/[id]
 * Update a service (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin access
    await requireAdmin();

    const { id } = await params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return errorResponse("Invalid service ID", 400);
    }

    // Check if service exists
    const [existingService] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (!existingService) {
      return errorResponse("Service not found", 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateServiceSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const updateData = validationResult.data;

    // Update the service
    const [updatedService] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, serviceId))
      .returning();

    return jsonResponse({ data: updatedService });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error updating service:", error);
    return errorResponse("Failed to update service", 500);
  }
}

/**
 * DELETE /api/services/[id]
 * Soft delete a service (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin access
    await requireAdmin();

    const { id } = await params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return errorResponse("Invalid service ID", 400);
    }

    // Check if service exists
    const [existingService] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (!existingService) {
      return errorResponse("Service not found", 404);
    }

    // Soft delete by setting isActive to false
    const [deletedService] = await db
      .update(services)
      .set({ isActive: false })
      .where(eq(services.id, serviceId))
      .returning();

    return jsonResponse({ data: deletedService, message: "Service deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error deleting service:", error);
    return errorResponse("Failed to delete service", 500);
  }
}
