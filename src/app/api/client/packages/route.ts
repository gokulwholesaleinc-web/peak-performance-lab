import { db } from "@/db";
import { clientPackages, packages } from "@/db/schema";
import { eq, and, gte, or, isNull, gt } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAuth,
  AuthError,
} from "@/lib/api-utils";

/**
 * GET /api/client/packages
 * Get current user's purchased packages with remaining sessions
 */
export async function GET() {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    // Get client's packages (active: not expired and has remaining sessions)
    const userPackages = await db
      .select({
        id: clientPackages.id,
        remainingSessions: clientPackages.remainingSessions,
        purchasedAt: clientPackages.purchasedAt,
        expiresAt: clientPackages.expiresAt,
        package: {
          id: packages.id,
          name: packages.name,
          description: packages.description,
          sessionCount: packages.sessionCount,
          price: packages.price,
          validityDays: packages.validityDays,
        },
      })
      .from(clientPackages)
      .innerJoin(packages, eq(clientPackages.packageId, packages.id))
      .where(eq(clientPackages.clientId, currentUser.id))
      .orderBy(clientPackages.purchasedAt);

    // Categorize packages
    const now = new Date();
    const activePackages = userPackages.filter((pkg) => {
      const isNotExpired = pkg.expiresAt === null || new Date(pkg.expiresAt) > now;
      const hasRemainingSessions = pkg.remainingSessions > 0;
      return isNotExpired && hasRemainingSessions;
    });

    const expiredOrDepletedPackages = userPackages.filter((pkg) => {
      const isExpired = pkg.expiresAt !== null && new Date(pkg.expiresAt) <= now;
      const isDepleted = pkg.remainingSessions <= 0;
      return isExpired || isDepleted;
    });

    // Format response to match frontend expectations
    const formattedActivePackages = activePackages.map((pkg) => ({
      id: pkg.id.toString(),
      name: pkg.package.name,
      description: pkg.package.description,
      sessionsUsed: pkg.package.sessionCount - pkg.remainingSessions,
      sessionsRemaining: pkg.remainingSessions,
      sessionsTotal: pkg.package.sessionCount,
      purchasedAt: pkg.purchasedAt,
      expiresAt: pkg.expiresAt,
      status: "active" as const,
      serviceType: pkg.package.name.includes("Golf")
        ? "Golf Fitness"
        : pkg.package.name.includes("Recovery")
          ? "Recovery"
          : "Personal Training",
      packageId: pkg.package.id,
    }));

    const formattedInactivePackages = expiredOrDepletedPackages.map((pkg) => {
      const isExpired = pkg.expiresAt !== null && new Date(pkg.expiresAt) <= now;
      return {
        id: pkg.id.toString(),
        name: pkg.package.name,
        description: pkg.package.description,
        sessionsUsed: pkg.package.sessionCount - pkg.remainingSessions,
        sessionsRemaining: pkg.remainingSessions,
        sessionsTotal: pkg.package.sessionCount,
        purchasedAt: pkg.purchasedAt,
        expiresAt: pkg.expiresAt,
        status: isExpired ? ("expired" as const) : ("depleted" as const),
        serviceType: pkg.package.name.includes("Golf")
          ? "Golf Fitness"
          : pkg.package.name.includes("Recovery")
            ? "Recovery"
            : "Personal Training",
        packageId: pkg.package.id,
      };
    });

    return jsonResponse({
      data: {
        active: formattedActivePackages,
        inactive: formattedInactivePackages,
        all: [...formattedActivePackages, ...formattedInactivePackages],
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error fetching client packages:", error);
    return errorResponse("Failed to fetch packages", 500);
  }
}
