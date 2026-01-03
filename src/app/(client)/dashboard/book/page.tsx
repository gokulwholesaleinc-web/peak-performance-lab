"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookingWizard,
  BookingData,
} from "@/components/shared/BookingWizard";
import Link from "next/link";
import { toast } from "sonner";
import {
  useServices,
  useClientPackages,
  useCreateBooking,
  type Service,
} from "@/lib/hooks/use-api";

export default function BookPage() {
  const router = useRouter();
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingData | null>(null);

  // Fetch services from API
  const {
    data: servicesData,
    isLoading: servicesLoading,
    error: servicesError,
  } = useServices();

  // Fetch client packages from API
  const {
    data: packagesData,
    isLoading: packagesLoading,
  } = useClientPackages();

  // Create booking mutation
  const createBookingMutation = useCreateBooking();

  const isLoading = servicesLoading || packagesLoading;

  const handleBookingComplete = async (booking: BookingData) => {
    try {
      // Find the selected time slot in ISO format from availability
      // For now, construct the scheduled datetime from date and time
      const [timePart, ampm] = booking.time.split(" ");
      const [hours, minutes] = timePart.split(":").map(Number);
      let hour24 = hours;
      if (ampm?.toUpperCase() === "PM" && hours !== 12) {
        hour24 = hours + 12;
      } else if (ampm?.toUpperCase() === "AM" && hours === 12) {
        hour24 = 0;
      }

      const scheduledAt = new Date(booking.date);
      scheduledAt.setHours(hour24, minutes, 0, 0);

      // Create the booking via API
      await createBookingMutation.mutateAsync({
        serviceId: parseInt(booking.serviceId, 10),
        scheduledAt: scheduledAt.toISOString(),
        locationType: booking.locationType,
        locationAddress: booking.location,
        notes: booking.notes,
      });

      // If not using package, redirect to Stripe checkout
      if (!booking.usePackage) {
        // TODO: Redirect to /api/payments/checkout
        // For now, just show success
        toast.success("Booking created! Payment integration pending.");
      } else {
        toast.success("Booking created successfully using package session!");
      }

      setBookingDetails(booking);
      setBookingComplete(true);
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create booking"
      );
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="text-destructive">Failed to load booking data</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Transform services data for BookingWizard
  const services: Service[] = servicesData?.data || [];

  // Transform packages data for BookingWizard
  const activePackages = (packagesData?.data?.active || []).map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    sessionsRemaining: pkg.sessionsRemaining,
    serviceId: pkg.packageId?.toString(),
  }));

  if (bookingComplete && bookingDetails) {
    const service = services.find(
      (s) => s.id.toString() === bookingDetails.serviceId
    );

    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription>
              Your {service?.name} has been successfully scheduled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {bookingDetails.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{bookingDetails.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {bookingDetails.locationType === "mobile"
                      ? "Mobile Session"
                      : "Virtual Session"}
                  </span>
                </div>
                {bookingDetails.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="max-w-[200px] text-right font-medium">
                      {bookingDetails.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              You will receive a confirmation email with all the details.
            </p>

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/appointments">View All Appointments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Book a Session</h1>
        <p className="text-muted-foreground">
          Schedule your next training or recovery session
        </p>
      </div>

      <BookingWizard
        services={services}
        activePackages={activePackages}
        onComplete={handleBookingComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
