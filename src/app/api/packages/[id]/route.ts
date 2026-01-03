import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { packages } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  AuthError,
} from "@/lib/api-utils";

// Validation schema for updating a package
const updatePackageSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  sessionCount: z.number().int().positive().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").optional(),
  validityDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/packages/[id]
 * Update a package (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin access
    await requireAdmin();

    const { id } = await params;
    const packageId = parseInt(id, 10);

    if (isNaN(packageId)) {
      return errorResponse("Invalid package ID", 400);
    }

    // Check if package exists
    const [existingPackage] = await db
      .select()
      .from(packages)
      .where(eq(packages.id, packageId))
      .limit(1);

    if (!existingPackage) {
      return errorResponse("Package not found", 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePackageSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const updateData = validationResult.data;

    // Update the package
    const [updatedPackage] = await db
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, packageId))
      .returning();

    return jsonResponse({ data: updatedPackage });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error updating package:", error);
    return errorResponse("Failed to update package", 500);
  }
}

/**
 * DELETE /api/packages/[id]
 * Soft delete a package (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require admin access
    await requireAdmin();

    const { id } = await params;
    const packageId = parseInt(id, 10);

    if (isNaN(packageId)) {
      return errorResponse("Invalid package ID", 400);
    }

    // Check if package exists
    const [existingPackage] = await db
      .select()
      .from(packages)
      .where(eq(packages.id, packageId))
      .limit(1);

    if (!existingPackage) {
      return errorResponse("Package not found", 404);
    }

    // Soft delete by setting isActive to false
    const [deletedPackage] = await db
      .update(packages)
      .set({ isActive: false })
      .where(eq(packages.id, packageId))
      .returning();

    return jsonResponse({ data: deletedPackage, message: "Package deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error deleting package:", error);
    return errorResponse("Failed to delete package", 500);
  }
}
