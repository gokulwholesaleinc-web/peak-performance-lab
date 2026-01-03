"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  Service,
  ActivePackage,
  BookingData,
} from "@/components/shared/BookingWizard";
import Link from "next/link";

// Mock data - replace with actual API calls
const mockServices: Service[] = [
  {
    id: "1",
    name: "Personal Training Session",
    description: "One-on-one personal training tailored to your goals",
    duration: 60,
    price: 100,
    category: "Training",
  },
  {
    id: "2",
    name: "Golf Fitness Assessment",
    description: "Comprehensive golf-specific fitness evaluation",
    duration: 90,
    price: 150,
    category: "Training",
  },
  {
    id: "3",
    name: "Golf Performance Training",
    description: "Specialized training to improve your golf game",
    duration: 60,
    price: 120,
    category: "Training",
  },
  {
    id: "4",
    name: "Dry Needling Session",
    description: "Targeted dry needling for muscle release and pain relief",
    duration: 45,
    price: 85,
    category: "Recovery",
  },
  {
    id: "5",
    name: "IASTM Treatment",
    description: "Instrument-assisted soft tissue mobilization",
    duration: 30,
    price: 65,
    category: "Recovery",
  },
  {
    id: "6",
    name: "Cupping Therapy",
    description: "Traditional cupping for improved circulation and recovery",
    duration: 30,
    price: 55,
    category: "Recovery",
  },
  {
    id: "7",
    name: "Stretch Therapy",
    description: "Assisted stretching for improved flexibility",
    duration: 45,
    price: 70,
    category: "Recovery",
  },
  {
    id: "8",
    name: "Kinesio Taping",
    description: "Athletic taping for support and pain relief",
    duration: 20,
    price: 35,
    category: "Recovery",
  },
];

const mockActivePackages: ActivePackage[] = [
  {
    id: "pkg-1",
    name: "Personal Training (10 Sessions)",
    sessionsRemaining: 7,
    serviceId: "1",
  },
  {
    id: "pkg-2",
    name: "Recovery Pack (5 Sessions)",
    sessionsRemaining: 3,
    serviceId: "4",
  },
];

interface BookingFormData {
  services: Service[];
  activePackages: ActivePackage[];
}

async function fetchBookingData(): Promise<BookingFormData> {
  // In production, this would be an API call
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          services: mockServices,
          activePackages: mockActivePackages,
        }),
      500
    );
  });
}

export default function BookPage() {
  const router = useRouter();
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingData | null>(
    null
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["bookingData"],
    queryFn: fetchBookingData,
  });

  const handleBookingComplete = async (booking: BookingData) => {
    // In production, this would submit to the API
    console.log("Booking submitted:", booking);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // If not using package, redirect to Stripe checkout
    if (!booking.usePackage) {
      // In production: redirect to /api/payments/checkout
      console.log("Redirecting to Stripe checkout...");
    }

    setBookingDetails(booking);
    setBookingComplete(true);
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

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">Failed to load booking data</p>
      </div>
    );
  }

  if (bookingComplete && bookingDetails) {
    const service = data?.services.find(
      (s) => s.id === bookingDetails.serviceId
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
                    <span className="font-medium text-right max-w-[200px]">
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
        services={data?.services || []}
        activePackages={data?.activePackages || []}
        onComplete={handleBookingComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
