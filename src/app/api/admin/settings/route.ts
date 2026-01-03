import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { availability } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  jsonResponse,
  errorResponse,
  requireAdmin,
  AuthError,
} from "@/lib/api-utils";

// Validation schema for availability slot
const availabilitySlotSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

// Validation schema for business info
const businessInfoSchema = z.object({
  name: z.string().max(255),
  email: z.string().email(),
  phone: z.string().max(20),
  address: z.string().max(255),
  city: z.string().max(100),
  state: z.string().max(50),
  zip: z.string().max(20),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

// Validation schema for settings
const settingsSchema = z.object({
  availability: z.array(availabilitySlotSchema),
  businessInfo: businessInfoSchema,
});

// Default business info (stored in memory for now, could be moved to DB)
let businessInfoStore = {
  name: "Peak Performance Lab",
  email: "contact@peakperformancelab.com",
  phone: "(312) 555-0100",
  address: "123 Fitness Avenue",
  city: "Chicago",
  state: "IL",
  zip: "60601",
  description:
    "Mobile fitness and wellness practice offering personal training, golf fitness, and therapeutic services.",
  website: "https://peakperformancelab.com",
};

/**
 * GET /api/admin/settings
 * Get admin settings (availability and business info)
 */
export async function GET() {
  try {
    // Require admin access
    await requireAdmin();

    // Get availability from database
    const availabilitySlots = await db
      .select({
        id: availability.id,
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
        isActive: availability.isActive,
      })
      .from(availability)
      .where(eq(availability.isActive, true))
      .orderBy(availability.dayOfWeek);

    // Format availability slots for frontend
    const formattedAvailability = availabilitySlots.map((slot) => ({
      id: slot.id.toString(),
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    return jsonResponse({
      availability: formattedAvailability,
      businessInfo: businessInfoStore,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error fetching settings:", error);
    return errorResponse("Failed to fetch settings", 500);
  }
}

/**
 * PUT /api/admin/settings
 * Update admin settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = settingsSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0]?.message || "Invalid request body",
        400
      );
    }

    const { availability: newAvailability, businessInfo } = validationResult.data;

    // Update business info (in memory)
    businessInfoStore = {
      ...businessInfoStore,
      ...businessInfo,
    };

    // Update availability in database
    // First, deactivate all current availability
    await db
      .update(availability)
      .set({ isActive: false });

    // Then, insert or update the new availability slots
    for (const slot of newAvailability) {
      if (slot.id && !slot.id.startsWith("new-")) {
        // Update existing slot
        const slotId = parseInt(slot.id, 10);
        if (!isNaN(slotId)) {
          await db
            .update(availability)
            .set({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isActive: true,
            })
            .where(eq(availability.id, slotId));
        }
      } else {
        // Insert new slot
        await db.insert(availability).values({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
        });
      }
    }

    // Fetch updated availability
    const updatedAvailability = await db
      .select({
        id: availability.id,
        dayOfWeek: availability.dayOfWeek,
        startTime: availability.startTime,
        endTime: availability.endTime,
      })
      .from(availability)
      .where(eq(availability.isActive, true))
      .orderBy(availability.dayOfWeek);

    const formattedAvailability = updatedAvailability.map((slot) => ({
      id: slot.id.toString(),
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    return jsonResponse({
      availability: formattedAvailability,
      businessInfo: businessInfoStore,
      message: "Settings updated successfully",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Error updating settings:", error);
    return errorResponse("Failed to update settings", 500);
  }
}
