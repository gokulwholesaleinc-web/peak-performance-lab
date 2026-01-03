import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql, desc, ilike, or } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  parsePagination,
  paginatedResponse,
  AuthError,
} from "@/lib/api-utils";

// Validation schema for creating a client
const createClientSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().max(20).optional(),
});

/**
 * GET /api/clients
 * List clients with pagination (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin();

    const { page, limit, offset } = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // Build where conditions
    const whereConditions = [eq(users.role, "client")];

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        search
          ? sql`${users.role} = 'client' AND (${ilike(users.name, `%${search}%`)} OR ${ilike(users.email, `%${search}%`)})`
          : eq(users.role, "client")
      );

    const total = Number(countResult?.count || 0);

    // Get clients
    const clients = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(
        search
          ? sql`${users.role} = 'client' AND (${ilike(users.name, `%${search}%`)} OR ${ilike(users.email, `%${search}%`)})`
          : eq(users.role, "client")
      )
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return paginatedResponse(clients, total, page, limit);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error fetching clients:", error);
    return errorResponse("Failed to fetch clients", 500);
  }
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createClientSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const { email, name, phone } = validationResult.data;

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return errorResponse("A user with this email already exists", 409);
    }

    // Create the client
    const [newClient] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name,
        phone: phone || null,
        role: "client",
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      });

    return jsonResponse({ data: newClient }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error creating client:", error);
    return errorResponse("Failed to create client", 500);
  }
}
