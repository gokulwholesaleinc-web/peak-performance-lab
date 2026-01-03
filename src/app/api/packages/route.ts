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

// Validation schema for creating a package
const createPackageSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sessionCount: z.number().int().positive(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  validityDays: z.number().int().positive(),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/packages
 * List all packages (optionally include inactive)
 * Query params:
 * - includeInactive: Set to "true" to include inactive packages (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    let allPackages;

    if (includeInactive) {
      // For including inactive packages, require admin access
      try {
        await requireAdmin();
        allPackages = await db
          .select()
          .from(packages)
          .orderBy(packages.name);
      } catch {
        // If not admin, fall back to active only
        allPackages = await db
          .select()
          .from(packages)
          .where(eq(packages.isActive, true))
          .orderBy(packages.name);
      }
    } else {
      allPackages = await db
        .select()
        .from(packages)
        .where(eq(packages.isActive, true))
        .orderBy(packages.name);
    }

    return jsonResponse({ data: allPackages });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return errorResponse("Failed to fetch packages", 500);
  }
}

/**
 * POST /api/packages
 * Create a new package (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createPackageSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const { name, description, sessionCount, price, validityDays, isActive } =
      validationResult.data;

    // Create the package
    const [newPackage] = await db
      .insert(packages)
      .values({
        name,
        description: description || null,
        sessionCount,
        price,
        validityDays,
        isActive,
      })
      .returning();

    return jsonResponse({ data: newPackage }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error creating package:", error);
    return errorResponse("Failed to create package", 500);
  }
}
