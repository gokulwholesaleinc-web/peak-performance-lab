"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  DollarSign,
  Users,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
}

interface DashboardStats {
  revenueThisMonth: number;
  totalClients: number;
  upcomingAppointments: number;
  appointmentsToday: number;
}

interface ActivityItem {
  id: string;
  type: "booking" | "payment" | "client" | "cancellation";
  message: string;
  timestamp: string;
}

// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/admin/stats");
  if (!response.ok) {
    // Return mock data if API not available
    return {
      revenueThisMonth: 12450,
      totalClients: 48,
      upcomingAppointments: 23,
      appointmentsToday: 6,
    };
  }
  return response.json();
}

// Fetch today's appointments
async function fetchTodaysAppointments(): Promise<Appointment[]> {
  const response = await fetch(
    `/api/bookings?date=${format(new Date(), "yyyy-MM-dd")}`
  );
  if (!response.ok) {
    // Return mock data if API not available
    return [
      {
        id: "1",
        clientName: "John Smith",
        serviceName: "Personal Training",
        startTime: "09:00",
        endTime: "10:00",
        status: "confirmed",
      },
      {
        id: "2",
        clientName: "Sarah Johnson",
        serviceName: "Golf Fitness",
        startTime: "10:30",
        endTime: "11:30",
        status: "scheduled",
      },
      {
        id: "3",
        clientName: "Mike Davis",
        serviceName: "Dry Needling",
        startTime: "13:00",
        endTime: "13:45",
        status: "confirmed",
      },
      {
        id: "4",
        clientName: "Emily Brown",
        serviceName: "Stretching Session",
        startTime: "14:00",
        endTime: "14:30",
        status: "scheduled",
      },
      {
        id: "5",
        clientName: "Robert Wilson",
        serviceName: "Personal Training",
        startTime: "15:00",
        endTime: "16:00",
        status: "confirmed",
      },
      {
        id: "6",
        clientName: "Lisa Chen",
        serviceName: "Cupping Therapy",
        startTime: "16:30",
        endTime: "17:00",
        status: "scheduled",
      },
    ];
  }
  return response.json();
}

// Fetch recent activity
async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const response = await fetch("/api/admin/activity");
  if (!response.ok) {
    // Return mock data if API not available
    return [
      {
        id: "1",
        type: "booking",
        message: "New booking from John Smith for Personal Training",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "2",
        type: "payment",
        message: "Payment received: $150 from Sarah Johnson",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: "3",
        type: "client",
        message: "New client registered: Mike Davis",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: "4",
        type: "cancellation",
        message: "Appointment cancelled by Emily Brown",
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: "5",
        type: "booking",
        message: "Rescheduled: Robert Wilson moved to 3PM",
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      },
    ];
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

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "booking":
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case "payment":
      return <DollarSign className="h-4 w-4 text-green-500" />;
    case "client":
      return <Users className="h-4 w-4 text-purple-500" />;
    case "cancellation":
      return <Clock className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return format(date, "MMM d");
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["todays-appointments"],
    queryFn: fetchTodaysAppointments,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: fetchRecentActivity,
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue This Month"
          value={
            statsLoading
              ? "..."
              : `$${stats?.revenueThisMonth.toLocaleString() ?? 0}`
          }
          description="from last month"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Total Clients"
          value={statsLoading ? "..." : stats?.totalClients ?? 0}
          description="active clients"
          icon={Users}
          trend={{ value: 4, isPositive: true }}
        />
        <StatCard
          title="Upcoming Appointments"
          value={statsLoading ? "..." : stats?.upcomingAppointments ?? 0}
          description="next 7 days"
          icon={Calendar}
        />
        <StatCard
          title="Today's Appointments"
          value={statsLoading ? "..." : stats?.appointmentsToday ?? 0}
          description={format(new Date(), "EEEE, MMMM d")}
          icon={Clock}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s Appointments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/calendar">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : appointments && appointments.length > 0 ? (
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{appointment.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.serviceName}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">
                          {appointment.startTime} - {appointment.endTime}
                        </p>
                        <Badge variant={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2 opacity-50" />
                <p>No appointments scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : activity && activity.length > 0 ? (
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{item.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Clock className="h-12 w-12 mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
