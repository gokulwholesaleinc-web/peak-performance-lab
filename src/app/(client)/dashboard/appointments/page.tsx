"use client";

import { useState } from "react";
import { Loader2, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import Link from "next/link";
import { toast } from "sonner";
import { useBookings, useCancelBooking } from "@/lib/hooks/use-api";

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  // Fetch all appointments
  const { data: appointmentsData, isLoading, error } = useBookings({ limit: 100 });

  // Cancel mutation
  const cancelMutation = useCancelBooking();

  const handleCancelClick = (id: string) => {
    setSelectedAppointmentId(parseInt(id, 10));
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (selectedAppointmentId) {
      try {
        await cancelMutation.mutateAsync(selectedAppointmentId);
        toast.success("Appointment cancelled successfully");
        setCancelDialogOpen(false);
        setSelectedAppointmentId(null);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to cancel appointment"
        );
      }
    }
  };

  const handleReschedule = (id: string) => {
    // TODO: Navigate to reschedule flow
    toast.info("Reschedule feature coming soon!");
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
        <p className="text-destructive">Failed to load appointments</p>
      </div>
    );
  }

  const appointments = appointmentsData?.data || [];

  // Transform appointments for AppointmentCard
  const formattedAppointments = appointments.map((apt) => ({
    id: apt.id.toString(),
    serviceName: apt.service.name,
    date: new Date(apt.scheduledAt),
    startTime: new Date(apt.scheduledAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    endTime: new Date(
      new Date(apt.scheduledAt).getTime() + apt.durationMins * 60 * 1000
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    status: apt.status === "pending" ? "scheduled" : apt.status,
    locationType: apt.locationType,
    location: apt.locationAddress || undefined,
  }));

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = formattedAppointments.filter(
    (apt) => apt.status === "scheduled" || apt.status === "pending" || apt.status === "confirmed"
  );
  const pastAppointments = formattedAppointments.filter(
    (apt) => apt.status === "completed" || apt.status === "cancelled"
  );

  const filteredPastAppointments =
    statusFilter === "all"
      ? pastAppointments
      : pastAppointments.filter((apt) => apt.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">
            View and manage your scheduled sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/book">
            <Calendar className="mr-2 h-4 w-4" />
            Book New Session
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No upcoming appointments</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book a session to get started on your fitness journey
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/book">Book a Session</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment as any}
                  showActions
                  onCancel={handleCancelClick}
                  onReschedule={handleReschedule}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPastAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No past appointments</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your appointment history will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPastAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment as any}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
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
