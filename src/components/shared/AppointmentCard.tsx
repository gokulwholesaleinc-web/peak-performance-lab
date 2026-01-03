"use client";

import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  MoreVertical,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Appointment {
  id: string;
  serviceName: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  locationType: "mobile" | "virtual";
  location?: string;
  notes?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  variant?: "default" | "compact";
  showActions?: boolean;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

const statusConfig = {
  scheduled: {
    label: "Scheduled",
    variant: "default" as const,
    className: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  },
  completed: {
    label: "Completed",
    variant: "secondary" as const,
    className: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive" as const,
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  no_show: {
    label: "No Show",
    variant: "outline" as const,
    className: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  },
};

export function AppointmentCard({
  appointment,
  variant = "default",
  showActions = true,
  onCancel,
  onReschedule,
}: AppointmentCardProps) {
  const status = statusConfig[appointment.status];
  const isUpcoming = appointment.status === "scheduled";
  const isPast =
    appointment.status === "completed" || appointment.status === "no_show";

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10">
            <span className="text-xs font-medium text-primary">
              {format(appointment.date, "MMM")}
            </span>
            <span className="text-lg font-bold text-primary">
              {format(appointment.date, "d")}
            </span>
          </div>
          <div>
            <p className="font-medium">{appointment.serviceName}</p>
            <p className="text-sm text-muted-foreground">
              {appointment.startTime} - {appointment.endTime}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
          {showActions && isUpcoming && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onReschedule?.(appointment.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCancel?.(appointment.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(isPast && "opacity-75")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{appointment.serviceName}</CardTitle>
            <CardDescription>
              {format(appointment.date, "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className={status.className}>
              {status.label}
            </Badge>
            {showActions && isUpcoming && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onReschedule?.(appointment.id)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reschedule
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onCancel?.(appointment.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {appointment.startTime} - {appointment.endTime}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {appointment.locationType === "virtual" ? (
            <>
              <Video className="h-4 w-4" />
              <span>Virtual Session</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span>{appointment.location || "Mobile - At your location"}</span>
            </>
          )}
        </div>
        {appointment.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Calendar className="mt-0.5 h-4 w-4" />
            <span>{appointment.notes}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
