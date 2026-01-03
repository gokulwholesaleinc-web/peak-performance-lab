"use client";

import Link from "next/link";
import {
  CalendarDays,
  Package,
  Receipt,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { Badge } from "@/components/ui/badge";
import {
  useCurrentUser,
  useUpcomingBookings,
  useClientPackages,
  useInvoices,
} from "@/hooks/use-api";
import { usePayInvoice } from "@/hooks/use-payments";
import { transformBookingToAppointment } from "@/lib/utils";

export default function DashboardPage() {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: bookingsData, isLoading: bookingsLoading } = useUpcomingBookings();
  const payInvoice = usePayInvoice();

  const handlePayInvoice = (invoiceId: string) => {
    const numericId = parseInt(invoiceId, 10);
    if (!isNaN(numericId)) {
      payInvoice.mutate(numericId);
    }
  };
  const { data: packagesData, isLoading: packagesLoading } = useClientPackages();
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ limit: 5 });

  const isLoading = userLoading || bookingsLoading || packagesLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userName = userData?.user?.name?.split(" ")[0] || "there";
  const upcomingAppointments = bookingsData?.data || [];
  const packageBalances = packagesData?.data?.active || [];
  const recentInvoices = invoicesData?.data || [];

  // Transform appointments to match AppointmentCard format
  const formattedAppointments = upcomingAppointments.map(transformBookingToAppointment);

  // Calculate pending invoices total
  const pendingInvoices = recentInvoices.filter(
    (inv) => inv.status === "sent" || inv.status === "overdue"
  );
  const pendingTotal = pendingInvoices.reduce((acc, inv) => acc + inv.amount, 0);

  // Calculate total remaining sessions
  const totalRemainingSessions = packageBalances.reduce(
    (acc, pkg) => acc + pkg.sessionsRemaining,
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {userName}!
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
              {formattedAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {formattedAppointments.length === 0
                ? "No upcoming sessions"
                : `Next: ${formattedAppointments[0]?.serviceName}`}
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
            <div className="text-2xl font-bold">{totalRemainingSessions}</div>
            <p className="text-xs text-muted-foreground">
              Across {packageBalances.length} active package
              {packageBalances.length !== 1 ? "s" : ""}
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
            <div className="text-2xl font-bold">${pendingTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInvoices.length} invoice(s) awaiting payment
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
            {formattedAppointments.length === 0 ? (
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
              formattedAppointments.slice(0, 3).map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment as any}
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
                      {pkg.sessionsRemaining}/{pkg.sessionsTotal}
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
                <CardDescription>Your latest billing activity</CardDescription>
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
                <p className="text-sm text-muted-foreground">No invoices yet</p>
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
                        Due:{" "}
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString()
                          : "N/A"}
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
                      {(invoice.status === "sent" ||
                        invoice.status === "overdue") && (
                        <Button
                          size="sm"
                          onClick={() => handlePayInvoice(invoice.id)}
                          disabled={payInvoice.isPending}
                        >
                          {payInvoice.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Pay Now
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
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
