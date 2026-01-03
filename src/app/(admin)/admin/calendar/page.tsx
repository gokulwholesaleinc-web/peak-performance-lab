"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addDays,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useBookings, type Booking } from "@/hooks/use-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStatusColor, getAppointmentTimes } from "@/lib/utils";

function getStatusBgColor(status: Booking["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800";
    case "pending":
      return "bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800";
    case "completed":
      return "bg-gray-100 border-gray-300 dark:bg-gray-950 dark:border-gray-800";
    case "cancelled":
      return "bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800";
    default:
      return "bg-gray-100 border-gray-300";
  }
}

// Time slots for the day view
const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 8; // Start at 8 AM
  return `${hour.toString().padStart(2, "0")}:00`;
});

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedAppointment, setSelectedAppointment] = useState<Booking | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Booking | null>(null);

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel appointment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Appointment cancelled successfully");
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
      setSelectedAppointment(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update appointment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Appointment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCancelClick = (appointment: Booking) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (appointmentToCancel) {
      cancelMutation.mutate(appointmentToCancel.id);
    }
  };

  const handleReschedule = () => {
    toast.info("Reschedule feature coming soon!");
  };

  // Calculate week boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch appointments for the current week
  const { data: bookingsResponse, isLoading } = useBookings({
    startDate: format(weekStart, "yyyy-MM-dd"),
    endDate: format(weekEnd, "yyyy-MM-dd"),
    limit: 100,
  });

  const appointments = bookingsResponse?.data || [];

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        const dateKey = format(new Date(appointment.scheduledAt), "yyyy-MM-dd");
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(appointment);
        return acc;
      },
      {} as Record<string, Booking[]>
    );
  }, [appointments]);

  // Get appointments for the current day (in day view)
  const dayAppointments = useMemo(() => {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    return appointmentsByDate[dateKey] || [];
  }, [appointmentsByDate, currentDate]);

  // Navigation functions
  const goToNextPeriod = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToPreviousPeriod = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your appointments and schedule
          </p>
        </div>
      </div>

      {/* Calendar controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-lg font-medium">
            {viewMode === "week"
              ? `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
              : format(currentDate, "EEEE, MMMM d, yyyy")}
          </span>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "week" | "day")}
        >
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : viewMode === "week" ? (
        /* Week View */
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayAppointmentsList = appointmentsByDate[dateKey] || [];
            const isCurrentDay = isToday(day);

            return (
              <Card
                key={dateKey}
                className={`min-h-[200px] ${isCurrentDay ? "ring-2 ring-primary" : ""}`}
              >
                <CardHeader className="p-3 pb-2">
                  <CardTitle
                    className={`text-sm font-medium ${
                      isCurrentDay ? "text-primary" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-muted-foreground">
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={`text-lg ${
                          isCurrentDay
                            ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            : ""
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {dayAppointmentsList.length > 0 ? (
                        dayAppointmentsList
                          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                          .map((appointment) => {
                            const { startTime } = getAppointmentTimes(appointment.scheduledAt, appointment.durationMins);
                            return (
                              <button
                                key={appointment.id}
                                onClick={() => setSelectedAppointment(appointment)}
                                className={`w-full text-left rounded border p-1.5 text-xs transition-colors hover:opacity-80 ${getStatusBgColor(appointment.status)}`}
                              >
                                <div className="font-medium truncate">
                                  {startTime} - {appointment.client.name}
                                </div>
                                <div className="text-muted-foreground truncate">
                                  {appointment.service.name}
                                </div>
                              </button>
                            );
                          })
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No appointments
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Day View */
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              {timeSlots.map((time) => {
                const slotAppointments = dayAppointments.filter((apt) => {
                  const aptHour = new Date(apt.scheduledAt).getHours();
                  const slotHour = parseInt(time.split(":")[0]);
                  return aptHour === slotHour;
                });

                return (
                  <div
                    key={time}
                    className="flex min-h-[60px] border-t first:border-t-0"
                  >
                    <div className="w-20 flex-shrink-0 py-2 pr-4 text-right text-sm text-muted-foreground">
                      {time}
                    </div>
                    <div className="flex-1 py-2 pl-4">
                      {slotAppointments.length > 0 ? (
                        <div className="space-y-1">
                          {slotAppointments.map((appointment) => {
                            const { startTime, endTime } = getAppointmentTimes(appointment.scheduledAt, appointment.durationMins);
                            return (
                              <button
                                key={appointment.id}
                                onClick={() => setSelectedAppointment(appointment)}
                                className={`w-full text-left rounded border p-2 transition-colors hover:opacity-80 ${getStatusBgColor(appointment.status)}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">
                                      {appointment.client.name}
                                    </span>
                                    <span className="mx-2 text-muted-foreground">
                                      |
                                    </span>
                                    <span>{appointment.service.name}</span>
                                  </div>
                                  <Badge variant={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {startTime} - {endTime}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Dialog */}
      <Dialog
        open={!!selectedAppointment}
        onOpenChange={() => setSelectedAppointment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View and manage appointment information
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{selectedAppointment.client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.client.email}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(
                      new Date(selectedAppointment.scheduledAt),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {(() => {
                      const { startTime, endTime } = getAppointmentTimes(
                        selectedAppointment.scheduledAt,
                        selectedAppointment.durationMins
                      );
                      return `${startTime} - ${endTime}`;
                    })()}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Service</p>
                <p className="text-muted-foreground">
                  {selectedAppointment.service.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  ${parseFloat(selectedAppointment.service.price).toFixed(2)} - {selectedAppointment.durationMins} min
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={getStatusColor(selectedAppointment.status)}>
                  {selectedAppointment.status}
                </Badge>
              </div>

              {selectedAppointment.notes && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {selectedAppointment.locationAddress && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.locationType === "mobile" ? "Mobile: " : "Virtual: "}
                    {selectedAppointment.locationAddress}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReschedule}
                >
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleCancelClick(selectedAppointment)}
                  disabled={selectedAppointment.status === "cancelled" || selectedAppointment.status === "completed"}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the appointment for{" "}
              {appointmentToCancel?.client.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
