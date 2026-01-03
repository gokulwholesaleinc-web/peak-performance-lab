"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Package,
  Receipt,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentCard, Appointment } from "@/components/shared/AppointmentCard";
import { Badge } from "@/components/ui/badge";

interface PackageBalance {
  id: string;
  name: string;
  sessionsRemaining: number;
  totalSessions: number;
  expiresAt: string | null;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
}

interface DashboardData {
  upcomingAppointments: Appointment[];
  packageBalances: PackageBalance[];
  recentInvoices: Invoice[];
}

// Mock data for demonstration - replace with actual API calls
const mockDashboardData: DashboardData = {
  upcomingAppointments: [
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
      endTime: "3:00 PM",
      status: "scheduled",
      locationType: "virtual",
    },
  ],
  packageBalances: [
    {
      id: "1",
      name: "Personal Training (10 Sessions)",
      sessionsRemaining: 7,
      totalSessions: 10,
      expiresAt: "2025-03-15",
    },
    {
      id: "2",
      name: "Recovery Sessions (5 Pack)",
      sessionsRemaining: 3,
      totalSessions: 5,
      expiresAt: null,
    },
  ],
  recentInvoices: [
    {
      id: "1",
      number: "INV-2024-001",
      amount: 150.0,
      status: "paid",
      dueDate: "2024-12-15",
    },
    {
      id: "2",
      number: "INV-2024-002",
      amount: 500.0,
      status: "pending",
      dueDate: "2025-01-15",
    },
  ],
};

async function fetchDashboardData(): Promise<DashboardData> {
  // In production, this would be an API call
  // const response = await fetch('/api/dashboard');
  // return response.json();
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDashboardData), 500);
  });
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

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
        <p className="text-destructive">Failed to load dashboard data</p>
      </div>
    );
  }

  const { upcomingAppointments, packageBalances, recentInvoices } = data!;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, John!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your fitness journey.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/book">
            <CalendarDays className="mr-2 h-5 w-5" />
            Book Session
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Sessions
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {upcomingAppointments.length === 0
                ? "No upcoming sessions"
                : `Next: ${upcomingAppointments[0]?.serviceName}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Sessions Available
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packageBalances.reduce(
                (acc, pkg) => acc + pkg.sessionsRemaining,
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {packageBalances.length} active packages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invoices
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {recentInvoices
                .filter((inv) => inv.status === "pending")
                .reduce((acc, inv) => acc + inv.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentInvoices.filter((inv) => inv.status === "pending").length}{" "}
              invoice(s) awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                  Your scheduled sessions for the coming days
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/appointments">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No upcoming appointments
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/dashboard/book">Book a Session</Link>
                </Button>
              </div>
            ) : (
              upcomingAppointments
                .slice(0, 3)
                .map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    variant="compact"
                    showActions={false}
                  />
                ))
            )}
          </CardContent>
        </Card>

        {/* Package Balances */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Package Balances</CardTitle>
                <CardDescription>
                  Your active packages and remaining sessions
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/packages">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {packageBalances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No active packages
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/dashboard/packages">Purchase a Package</Link>
                </Button>
              </div>
            ) : (
              packageBalances.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{pkg.name}</p>
                    {pkg.expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(pkg.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {pkg.sessionsRemaining}/{pkg.totalSessions}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      sessions left
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>
                  Your latest billing activity
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/invoices">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No invoices yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.number}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold">
                        ${invoice.amount.toFixed(2)}
                      </p>
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "secondary"
                            : invoice.status === "overdue"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          invoice.status === "paid"
                            ? "bg-green-500/10 text-green-600"
                            : invoice.status === "overdue"
                            ? ""
                            : "bg-yellow-500/10 text-yellow-600"
                        }
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </Badge>
                      {invoice.status === "pending" && (
                        <Button size="sm">Pay Now</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
