"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  addDays,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

// Fetch appointments for a date range
async function fetchAppointments(
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  const response = await fetch(
    `/api/bookings?startDate=${startDate}&endDate=${endDate}`
  );
  if (!response.ok) {
    // Return mock data if API not available
    const mockAppointments: Appointment[] = [
      {
        id: "1",
        clientId: "c1",
        clientName: "John Smith",
        clientEmail: "john@example.com",
        serviceId: "s1",
        serviceName: "Personal Training",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "10:00",
        status: "confirmed",
        notes: "Focus on upper body strength",
      },
      {
        id: "2",
        clientId: "c2",
        clientName: "Sarah Johnson",
        clientEmail: "sarah@example.com",
        serviceId: "s2",
        serviceName: "Golf Fitness",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "10:30",
        endTime: "11:30",
        status: "scheduled",
      },
      {
        id: "3",
        clientId: "c3",
        clientName: "Mike Davis",
        clientEmail: "mike@example.com",
        serviceId: "s3",
        serviceName: "Dry Needling",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "13:00",
        endTime: "13:45",
        status: "confirmed",
      },
      {
        id: "4",
        clientId: "c4",
        clientName: "Emily Brown",
        clientEmail: "emily@example.com",
        serviceId: "s4",
        serviceName: "Stretching Session",
        date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        startTime: "10:00",
        endTime: "10:30",
        status: "scheduled",
      },
      {
        id: "5",
        clientId: "c5",
        clientName: "Robert Wilson",
        clientEmail: "robert@example.com",
        serviceId: "s1",
        serviceName: "Personal Training",
        date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        startTime: "14:00",
        endTime: "15:00",
        status: "confirmed",
      },
      {
        id: "6",
        clientId: "c6",
        clientName: "Lisa Chen",
        clientEmail: "lisa@example.com",
        serviceId: "s5",
        serviceName: "Cupping Therapy",
        date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
        startTime: "11:00",
        endTime: "11:30",
        status: "scheduled",
      },
    ];
    return mockAppointments;
  }
  return response.json();
}

function getStatusColor(status: Appointment["status"]) {
  switch (status) {
    case "confirmed":
      return "default";
    case "scheduled":
      return "secondary";
    case "completed":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusBgColor(status: Appointment["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800";
    case "scheduled":
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  // Calculate week boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: [
      "calendar-appointments",
      format(weekStart, "yyyy-MM-dd"),
      format(weekEnd, "yyyy-MM-dd"),
    ],
    queryFn: () =>
      fetchAppointments(
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd")
      ),
  });

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    if (!appointments) return {};
    return appointments.reduce(
      (acc, appointment) => {
        if (!acc[appointment.date]) {
          acc[appointment.date] = [];
        }
        acc[appointment.date].push(appointment);
        return acc;
      },
      {} as Record<string, Appointment[]>
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
            const dayAppointments = appointmentsByDate[dateKey] || [];
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
                      {dayAppointments.length > 0 ? (
                        dayAppointments
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((appointment) => (
                            <button
                              key={appointment.id}
                              onClick={() => setSelectedAppointment(appointment)}
                              className={`w-full text-left rounded border p-1.5 text-xs transition-colors hover:opacity-80 ${getStatusBgColor(appointment.status)}`}
                            >
                              <div className="font-medium truncate">
                                {appointment.startTime} - {appointment.clientName}
                              </div>
                              <div className="text-muted-foreground truncate">
                                {appointment.serviceName}
                              </div>
                            </button>
                          ))
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
                  const aptHour = parseInt(apt.startTime.split(":")[0]);
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
                          {slotAppointments.map((appointment) => (
                            <button
                              key={appointment.id}
                              onClick={() => setSelectedAppointment(appointment)}
                              className={`w-full text-left rounded border p-2 transition-colors hover:opacity-80 ${getStatusBgColor(appointment.status)}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">
                                    {appointment.clientName}
                                  </span>
                                  <span className="mx-2 text-muted-foreground">
                                    |
                                  </span>
                                  <span>{appointment.serviceName}</span>
                                </div>
                                <Badge variant={getStatusColor(appointment.status)}>
                                  {appointment.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {appointment.startTime} - {appointment.endTime}
                              </div>
                            </button>
                          ))}
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
                  <p className="font-medium">{selectedAppointment.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.clientEmail}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(
                      new Date(selectedAppointment.date),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedAppointment.startTime} -{" "}
                    {selectedAppointment.endTime}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Service</p>
                <p className="text-muted-foreground">
                  {selectedAppointment.serviceName}
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

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  Reschedule
                </Button>
                <Button variant="destructive" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
