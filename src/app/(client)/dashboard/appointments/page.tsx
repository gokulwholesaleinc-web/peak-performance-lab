"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  AppointmentCard,
  Appointment,
} from "@/components/shared/AppointmentCard";
import Link from "next/link";

// Mock data - replace with actual API calls
const mockAppointments: Appointment[] = [
  {
    id: "1",
    serviceName: "Personal Training Session",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    status: "scheduled",
    locationType: "mobile",
    location: "123 Main St, Chicago, IL",
  },
  {
    id: "2",
    serviceName: "Golf Fitness Assessment",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    startTime: "2:00 PM",
    endTime: "3:30 PM",
    status: "scheduled",
    locationType: "virtual",
  },
  {
    id: "3",
    serviceName: "Dry Needling Session",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    startTime: "9:00 AM",
    endTime: "9:45 AM",
    status: "scheduled",
    locationType: "mobile",
    location: "456 Oak Ave, Chicago, IL",
  },
  {
    id: "4",
    serviceName: "Personal Training Session",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    status: "completed",
    locationType: "mobile",
    location: "123 Main St, Chicago, IL",
  },
  {
    id: "5",
    serviceName: "Stretch Therapy",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    startTime: "3:00 PM",
    endTime: "3:45 PM",
    status: "completed",
    locationType: "virtual",
  },
  {
    id: "6",
    serviceName: "Cupping Therapy",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    startTime: "11:00 AM",
    endTime: "11:30 AM",
    status: "cancelled",
    locationType: "mobile",
    location: "789 Pine St, Chicago, IL",
  },
];

async function fetchAppointments(): Promise<Appointment[]> {
  // In production, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockAppointments), 500);
  });
}

async function cancelAppointment(id: string): Promise<void> {
  // In production, this would be an API call
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setCancelDialogOpen(false);
      setSelectedAppointmentId(null);
    },
  });

  const handleCancelClick = (id: string) => {
    setSelectedAppointmentId(id);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedAppointmentId) {
      cancelMutation.mutate(selectedAppointmentId);
    }
  };

  const handleReschedule = (id: string) => {
    // In production, navigate to reschedule flow
    console.log("Reschedule appointment:", id);
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

  const upcomingAppointments = (appointments || []).filter(
    (apt) => apt.status === "scheduled"
  );
  const pastAppointments = (appointments || []).filter(
    (apt) => apt.status !== "scheduled"
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
                  appointment={appointment}
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
                <SelectItem value="no_show">No Show</SelectItem>
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
                  appointment={appointment}
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
