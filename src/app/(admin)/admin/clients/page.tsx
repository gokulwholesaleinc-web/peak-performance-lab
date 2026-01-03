"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  totalAppointments: number;
  activePackages: number;
  status: "active" | "inactive";
}

interface ClientAppointment {
  id: string;
  serviceName: string;
  date: string;
  startTime: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
}

interface ClientPackage {
  id: string;
  packageName: string;
  sessionsRemaining: number;
  totalSessions: number;
  expiresAt: string;
}

// Fetch clients
async function fetchClients(): Promise<Client[]> {
  const response = await fetch("/api/clients");
  if (!response.ok) {
    // Return mock data if API not available
    return [
      {
        id: "1",
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "(312) 555-0101",
        createdAt: "2024-01-15T10:00:00Z",
        totalAppointments: 24,
        activePackages: 1,
        status: "active",
      },
      {
        id: "2",
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.j@example.com",
        phone: "(312) 555-0102",
        createdAt: "2024-02-20T14:30:00Z",
        totalAppointments: 12,
        activePackages: 2,
        status: "active",
      },
      {
        id: "3",
        firstName: "Mike",
        lastName: "Davis",
        email: "mike.davis@example.com",
        phone: "(312) 555-0103",
        createdAt: "2024-03-10T09:15:00Z",
        totalAppointments: 8,
        activePackages: 0,
        status: "active",
      },
      {
        id: "4",
        firstName: "Emily",
        lastName: "Brown",
        email: "emily.b@example.com",
        phone: "(312) 555-0104",
        createdAt: "2024-01-05T16:00:00Z",
        totalAppointments: 35,
        activePackages: 1,
        status: "active",
      },
      {
        id: "5",
        firstName: "Robert",
        lastName: "Wilson",
        email: "robert.w@example.com",
        phone: "(312) 555-0105",
        createdAt: "2023-11-20T11:00:00Z",
        totalAppointments: 42,
        activePackages: 0,
        status: "inactive",
      },
      {
        id: "6",
        firstName: "Lisa",
        lastName: "Chen",
        email: "lisa.chen@example.com",
        phone: "(312) 555-0106",
        createdAt: "2024-04-01T08:30:00Z",
        totalAppointments: 3,
        activePackages: 1,
        status: "active",
      },
    ];
  }
  return response.json();
}

// Fetch client appointments
async function fetchClientAppointments(
  clientId: string
): Promise<ClientAppointment[]> {
  const response = await fetch(`/api/clients/${clientId}/appointments`);
  if (!response.ok) {
    // Return mock data
    return [
      {
        id: "1",
        serviceName: "Personal Training",
        date: "2024-05-01",
        startTime: "10:00",
        status: "completed",
      },
      {
        id: "2",
        serviceName: "Golf Fitness",
        date: "2024-05-08",
        startTime: "11:00",
        status: "completed",
      },
      {
        id: "3",
        serviceName: "Personal Training",
        date: "2024-05-15",
        startTime: "10:00",
        status: "confirmed",
      },
    ];
  }
  return response.json();
}

// Fetch client packages
async function fetchClientPackages(clientId: string): Promise<ClientPackage[]> {
  const response = await fetch(`/api/clients/${clientId}/packages`);
  if (!response.ok) {
    // Return mock data
    return [
      {
        id: "1",
        packageName: "10 Session Personal Training",
        sessionsRemaining: 6,
        totalSessions: 10,
        expiresAt: "2024-08-15",
      },
    ];
  }
  return response.json();
}

function getStatusColor(status: Client["status"]) {
  switch (status) {
    case "active":
      return "default";
    case "inactive":
      return "secondary";
    default:
      return "secondary";
  }
}

function getAppointmentStatusColor(status: ClientAppointment["status"]) {
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

export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Fetch clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  // Fetch client appointments when a client is selected
  const { data: clientAppointments, isLoading: appointmentsLoading } = useQuery(
    {
      queryKey: ["client-appointments", selectedClient?.id],
      queryFn: () => fetchClientAppointments(selectedClient!.id),
      enabled: !!selectedClient,
    }
  );

  // Fetch client packages when a client is selected
  const { data: clientPackages, isLoading: packagesLoading } = useQuery({
    queryKey: ["client-packages", selectedClient?.id],
    queryFn: () => fetchClientPackages(selectedClient!.id),
    enabled: !!selectedClient,
  });

  // Define columns for the data table
  const columns: Column<Client>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (client) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">
              {client.firstName} {client.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (client) => client.phone,
    },
    {
      key: "totalAppointments",
      header: "Appointments",
      sortable: true,
      render: (client) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {client.totalAppointments}
        </div>
      ),
    },
    {
      key: "activePackages",
      header: "Packages",
      sortable: true,
      render: (client) => (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          {client.activePackages}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (client) => (
        <Badge variant={getStatusColor(client.status)}>{client.status}</Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      render: (client) => format(new Date(client.createdAt), "MMM d, yyyy"),
    },
    {
      key: "actions",
      header: "",
      render: (client) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedClient(client)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Client</DropdownMenuItem>
            <DropdownMenuItem>Book Appointment</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client database and view their history
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Clients table */}
      <DataTable
        data={clients || []}
        columns={columns}
        searchable
        searchPlaceholder="Search clients..."
        searchKeys={["firstName", "lastName", "email", "phone"]}
        isLoading={isLoading}
        emptyMessage="No clients found."
        onRowClick={setSelectedClient}
      />

      {/* Client details drawer */}
      <Sheet
        open={!!selectedClient}
        onOpenChange={() => setSelectedClient(null)}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Client Details</SheetTitle>
            <SheetDescription>
              View and manage client information
            </SheetDescription>
          </SheetHeader>

          {selectedClient && (
            <div className="mt-6 space-y-6">
              {/* Client info */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </h3>
                  <Badge variant={getStatusColor(selectedClient.status)}>
                    {selectedClient.status}
                  </Badge>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedClient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Client since{" "}
                    {format(new Date(selectedClient.createdAt), "MMMM yyyy")}
                  </span>
                </div>
              </div>

              {/* Tabs for appointments and packages */}
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="appointments" className="flex-1">
                    Appointments
                  </TabsTrigger>
                  <TabsTrigger value="packages" className="flex-1">
                    Packages
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="appointments">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Appointment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {appointmentsLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      ) : clientAppointments && clientAppointments.length > 0 ? (
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {clientAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                              >
                                <div>
                                  <p className="font-medium">
                                    {apt.serviceName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(apt.date), "MMM d, yyyy")}{" "}
                                    at {apt.startTime}
                                  </p>
                                </div>
                                <Badge
                                  variant={getAppointmentStatusColor(apt.status)}
                                >
                                  {apt.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No appointments found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="packages">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Active Packages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {packagesLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      ) : clientPackages && clientPackages.length > 0 ? (
                        <div className="space-y-3">
                          {clientPackages.map((pkg) => (
                            <div key={pkg.id} className="rounded-lg border p-3">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{pkg.packageName}</p>
                                <Badge variant="outline">
                                  {pkg.sessionsRemaining}/{pkg.totalSessions}{" "}
                                  left
                                </Badge>
                              </div>
                              <div className="mt-2">
                                <div className="h-2 rounded-full bg-muted">
                                  <div
                                    className="h-2 rounded-full bg-primary"
                                    style={{
                                      width: `${(pkg.sessionsRemaining / pkg.totalSessions) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">
                                Expires:{" "}
                                {format(new Date(pkg.expiresAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No active packages
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button className="flex-1">Book Appointment</Button>
                <Button variant="outline" className="flex-1">
                  Edit Client
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
