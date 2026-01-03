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

// Validation schema for creating a service
const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  durationMins: z.number().int().positive(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  category: z.string().max(100).optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/services
 * List all active services
 */
export async function GET() {
  try {
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(services.name);

    return jsonResponse({ data: allServices });
  } catch (error) {
    console.error("Error fetching services:", error);
    return errorResponse("Failed to fetch services", 500);
  }
}

/**
 * POST /api/services
 * Create a new service (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createServiceSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const { name, description, durationMins, price, category, isActive } =
      validationResult.data;

    // Create the service
    const [newService] = await db
      .insert(services)
      .values({
        name,
        description: description || null,
        durationMins,
        price,
        category: category || null,
        isActive,
      })
      .returning();

    return jsonResponse({ data: newService }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error creating service:", error);
    return errorResponse("Failed to create service", 500);
  }
}
