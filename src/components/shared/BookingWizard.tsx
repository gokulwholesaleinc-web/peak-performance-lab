"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  MapPin,
  Video,
  Loader2,
  CreditCard,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAvailability, useCreateBooking, type Service } from "@/hooks/use-api";

export interface ActivePackage {
  id: string;
  name: string;
  sessionsRemaining: number;
  serviceId?: string;
  packageId?: number;
}

export interface BookingData {
  serviceId: string;
  date: Date;
  time: string;
  locationType: "mobile" | "virtual";
  location?: string;
  usePackage: boolean;
  packageId?: string;
  notes?: string;
}

interface BookingWizardProps {
  services: Service[];
  activePackages: ActivePackage[];
  onComplete: (booking: BookingData) => void;
  onCancel: () => void;
}

// Re-export Service type for backward compatibility
export type { Service };

type Step = 1 | 2 | 3 | 4;

const steps = [
  { number: 1, title: "Select Service" },
  { number: 2, title: "Choose Date" },
  { number: 3, title: "Select Time" },
  { number: 4, title: "Confirm & Pay" },
];

export function BookingWizard({
  services,
  activePackages,
  onComplete,
  onCancel,
}: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [locationType, setLocationType] = useState<"mobile" | "virtual">(
    "mobile"
  );
  const [location, setLocation] = useState("");
  const [usePackage, setUsePackage] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date for API
  const formattedDate = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;

  // Fetch availability from API
  const {
    data: availabilityData,
    isLoading: availabilityLoading,
    error: availabilityError,
  } = useAvailability(formattedDate, selectedService?.id || null);

  // Reset time when date or service changes
  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate, selectedService]);

  // Get time slots from API response
  const timeSlots =
    availabilityData?.data?.slots?.map((slot) => {
      const startDate = new Date(slot.startTime);
      return {
        time: startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        isoTime: slot.startTime,
        available: true,
      };
    }) || [];

  // Get applicable packages for selected service
  const applicablePackages = selectedService
    ? activePackages.filter(
        (pkg) =>
          pkg.sessionsRemaining > 0 &&
          // Match package to service (simplified matching)
          (pkg.serviceId === selectedService.id.toString() ||
            pkg.name.toLowerCase().includes(selectedService.category?.toLowerCase() || ""))
      )
    : [];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedDate !== undefined;
      case 3:
        return selectedTime !== "" && locationType !== undefined;
      case 4:
        return locationType === "virtual" || location.trim() !== "";
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);

    // Find the selected time slot to get ISO time
    const selectedSlot = timeSlots.find((slot) => slot.time === selectedTime);

    const bookingData: BookingData = {
      serviceId: selectedService.id.toString(),
      date: selectedDate,
      time: selectedTime,
      locationType,
      location: locationType === "mobile" ? location : undefined,
      usePackage,
      packageId: usePackage ? selectedPackage : undefined,
      notes: notes || undefined,
    };

    try {
      await onComplete(bookingData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group services by category
  const servicesByCategory = services.reduce(
    (acc, service) => {
      const category = service.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                currentStep === step.number
                  ? "border-primary bg-primary text-primary-foreground"
                  : currentStep > step.number
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted text-muted-foreground"
              )}
            >
              {currentStep > step.number ? (
                <Check className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                "ml-2 hidden text-sm font-medium sm:block",
                currentStep >= step.number
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-4 h-0.5 w-8 sm:w-16",
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Select a Service</h2>
                <p className="text-sm text-muted-foreground">
                  Choose the type of session you would like to book
                </p>
              </div>
              {Object.entries(servicesByCategory).map(
                ([category, categoryServices]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {category}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {categoryServices.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={cn(
                            "flex flex-col items-start rounded-lg border p-4 text-left transition-colors hover:bg-accent",
                            selectedService?.id === service.id
                              ? "border-primary bg-primary/5"
                              : "border-input"
                          )}
                        >
                          <div className="flex w-full items-start justify-between">
                            <p className="font-medium">{service.name}</p>
                            <p className="font-semibold">
                              ${parseFloat(service.price).toFixed(2)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {service.description}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {service.durationMins} min
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Step 2: Choose Date */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Choose a Date</h2>
                <p className="text-sm text-muted-foreground">
                  Select an available date for your {selectedService?.name}
                </p>
              </div>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) =>
                    date < new Date() ||
                    date.getDay() === 0 ||
                    date.getDay() === 6
                  }
                  className="rounded-md border"
                />
              </div>
            </div>
          )}

          {/* Step 3: Select Time */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Select Time & Location
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose an available time slot and session type
                </p>
              </div>

              {/* Time Slots */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Available Times</h3>
                {availabilityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading available times...
                    </span>
                  </div>
                ) : availabilityError ? (
                  <div className="py-4 text-center text-sm text-destructive">
                    Failed to load available times. Please try again.
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No available times for this date. Please select a different
                    date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() =>
                          slot.available && setSelectedTime(slot.time)
                        }
                        disabled={!slot.available}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                          slot.available
                            ? selectedTime === slot.time
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input hover:bg-accent"
                            : "cursor-not-allowed border-muted bg-muted/50 text-muted-foreground line-through"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Type */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Session Type</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setLocationType("mobile")}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                      locationType === "mobile"
                        ? "border-primary bg-primary/5"
                        : "border-input hover:bg-accent"
                    )}
                  >
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Mobile Session</p>
                      <p className="text-sm text-muted-foreground">
                        I&apos;ll come to your location
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setLocationType("virtual")}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                      locationType === "virtual"
                        ? "border-primary bg-primary/5"
                        : "border-input hover:bg-accent"
                    )}
                  >
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Virtual Session</p>
                      <p className="text-sm text-muted-foreground">
                        Video call session
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm & Pay */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Confirm Your Booking</h2>
                <p className="text-sm text-muted-foreground">
                  Review your booking details and complete payment
                </p>
              </div>

              {/* Booking Summary */}
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Booking Summary</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {selectedDate &&
                        format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Session Type</span>
                    <span className="font-medium">
                      {locationType === "mobile" ? "Mobile" : "Virtual"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Input (for mobile sessions) */}
              {locationType === "mobile" && (
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Your Address
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your address"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific requests or information..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Payment Options */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Payment Method</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {applicablePackages.length > 0 && (
                    <button
                      onClick={() => {
                        setUsePackage(true);
                        setSelectedPackage(applicablePackages[0]?.id || "");
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                        usePackage
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-accent"
                      )}
                    >
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Use Package Session</p>
                        <p className="text-sm text-muted-foreground">
                          {applicablePackages[0]?.sessionsRemaining} sessions
                          remaining
                        </p>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => setUsePackage(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                      !usePackage
                        ? "border-primary bg-primary/5"
                        : "border-input hover:bg-accent"
                    )}
                  >
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Pay Now</p>
                      <p className="text-sm text-muted-foreground">
                        ${selectedService ? parseFloat(selectedService.price).toFixed(2) : "0.00"}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">
                  {usePackage
                    ? "1 Session"
                    : `$${selectedService ? parseFloat(selectedService.price).toFixed(2) : "0.00"}`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : usePackage ? (
              "Confirm Booking"
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
