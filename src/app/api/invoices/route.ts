import { db } from "@/db";
import { invoices, payments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAuth,
  parsePagination,
  paginatedResponse,
  AuthError,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";

/**
 * GET /api/invoices
 * Get current user's invoices
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await requireAuth();

    const { page, limit, offset } = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build where conditions
    const conditions = [eq(invoices.clientId, currentUser.id)];

    // Only admin can view all invoices
    if (currentUser.role === "admin") {
      const clientId = searchParams.get("clientId");
      if (clientId) {
        conditions.length = 0; // Clear default condition
        conditions.push(eq(invoices.clientId, clientId));
      } else {
        conditions.length = 0; // Clear to get all invoices for admin
      }
    }

    // Status filter
    if (status && ["draft", "sent", "paid", "cancelled"].includes(status)) {
      conditions.push(eq(invoices.status, status as "draft" | "sent" | "paid" | "cancelled"));
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(invoices);

    if (conditions.length > 0) {
      countQuery.where(conditions.length === 1 ? conditions[0] : sql`${conditions.map(c => sql`${c}`).reduce((a, b) => sql`${a} AND ${b}`)}`);
    }

    const [countResult] = await countQuery;
    const total = Number(countResult?.count || 0);

    // Get invoices with payment info
    const invoiceQuery = db
      .select({
        id: invoices.id,
        amount: invoices.amount,
        status: invoices.status,
        stripeInvoiceId: invoices.stripeInvoiceId,
        dueDate: invoices.dueDate,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
        clientId: invoices.clientId,
      })
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      invoiceQuery.where(conditions.length === 1 ? conditions[0] : sql`${conditions.map(c => sql`${c}`).reduce((a, b) => sql`${a} AND ${b}`)}`);
    }

    const invoicesList = await invoiceQuery;

    // Get payments for each invoice
    const invoicesWithPayments = await Promise.all(
      invoicesList.map(async (invoice) => {
        const invoicePayments = await db
          .select()
          .from(payments)
          .where(eq(payments.invoiceId, invoice.id));

        // Generate invoice number (using ID and year)
        const year = new Date(invoice.createdAt).getFullYear();
        const invoiceNumber = `INV-${year}-${String(invoice.id).padStart(3, "0")}`;

        // Determine if overdue
        const now = new Date();
        const isOverdue =
          invoice.status === "sent" &&
          invoice.dueDate &&
          new Date(invoice.dueDate) < now;

        return {
          id: invoice.id.toString(),
          number: invoiceNumber,
          date: invoice.createdAt,
          dueDate: invoice.dueDate,
          status: isOverdue ? "overdue" : invoice.status,
          amount: parseFloat(invoice.amount),
          paidAt: invoice.paidAt,
          stripeInvoiceId: invoice.stripeInvoiceId,
          payments: invoicePayments.map((p) => ({
            id: p.id,
            amount: parseFloat(p.amount),
            method: p.method,
            paidAt: p.paidAt,
          })),
        };
      })
    );

    return paginatedResponse(invoicesWithPayments, total, page, limit);
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error fetching invoices:", error);
    return errorResponse("Failed to fetch invoices", 500);
  }
}
