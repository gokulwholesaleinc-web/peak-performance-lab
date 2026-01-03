"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Types
interface Payment {
  id: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "refunded";
  type: "package" | "invoice" | "session";
  description: string;
  stripePaymentId?: string;
  createdAt: string;
}

interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedPayments: number;
}

// Fetch payments
async function fetchPayments(): Promise<Payment[]> {
  const response = await fetch("/api/admin/payments");
  if (!response.ok) {
    // Return mock data if endpoint doesn't exist yet
    return mockPayments;
  }
  return response.json();
}

// Fetch payment stats
async function fetchPaymentStats(): Promise<PaymentStats> {
  const response = await fetch("/api/admin/payments/stats");
  if (!response.ok) {
    // Return mock data if endpoint doesn't exist yet
    return mockStats;
  }
  return response.json();
}

// Mock data for development
const mockPayments: Payment[] = [
  {
    id: 1,
    clientId: "client-1",
    clientName: "John Smith",
    clientEmail: "john@example.com",
    amount: 599.00,
    status: "completed",
    type: "package",
    description: "10-Session Personal Training Package",
    stripePaymentId: "pi_3abc123",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    clientId: "client-2",
    clientName: "Sarah Johnson",
    clientEmail: "sarah@example.com",
    amount: 85.00,
    status: "completed",
    type: "session",
    description: "Single Training Session",
    stripePaymentId: "pi_3def456",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    clientId: "client-3",
    clientName: "Mike Williams",
    clientEmail: "mike@example.com",
    amount: 150.00,
    status: "pending",
    type: "invoice",
    description: "Invoice #INV-2024-003",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    clientId: "client-4",
    clientName: "Emily Brown",
    clientEmail: "emily@example.com",
    amount: 299.00,
    status: "completed",
    type: "package",
    description: "5-Session Golf Fitness Package",
    stripePaymentId: "pi_3ghi789",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    clientId: "client-1",
    clientName: "John Smith",
    clientEmail: "john@example.com",
    amount: 85.00,
    status: "refunded",
    type: "session",
    description: "Cancelled Session - Refund",
    stripePaymentId: "pi_3jkl012",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockStats: PaymentStats = {
  totalRevenue: 15750.00,
  monthlyRevenue: 3250.00,
  pendingPayments: 2,
  completedPayments: 45,
};

// Status badge component
function StatusBadge({ status }: { status: Payment["status"] }) {
  const config = {
    completed: { label: "Completed", variant: "default" as const, icon: CheckCircle2 },
    pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
    failed: { label: "Failed", variant: "destructive" as const, icon: XCircle },
    refunded: { label: "Refunded", variant: "outline" as const, icon: RefreshCw },
  };

  const { label, variant, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// Type badge component
function TypeBadge({ type }: { type: Payment["type"] }) {
  const config = {
    package: { label: "Package", className: "bg-blue-100 text-blue-800" },
    invoice: { label: "Invoice", className: "bg-purple-100 text-purple-800" },
    session: { label: "Session", className: "bg-green-100 text-green-800" },
  };

  const { label, className } = config[type];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Fetch data
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["adminPayments"],
    queryFn: fetchPayments,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminPaymentStats"],
    queryFn: fetchPaymentStats,
  });

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesType = typeFilter === "all" || payment.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track and manage all payment transactions
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.monthlyRevenue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.pendingPayments || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.completedPayments || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View and manage all payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="package">Package</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="session">Session</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No payments found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.clientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.clientEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {payment.description}
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={payment.type} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {payment.stripePaymentId && (
                              <DropdownMenuItem>
                                <CreditCard className="mr-2 h-4 w-4" />
                                View in Stripe
                              </DropdownMenuItem>
                            )}
                            {payment.status === "completed" && (
                              <DropdownMenuItem className="text-destructive">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Issue Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Transaction information and status
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={selectedPayment.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <TypeBadge type={selectedPayment.type} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(selectedPayment.createdAt)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Client</p>
                <p>{selectedPayment.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment.clientEmail}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Description</p>
                <p className="text-muted-foreground">
                  {selectedPayment.description}
                </p>
              </div>

              {selectedPayment.stripePaymentId && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Stripe Payment ID</p>
                  <code className="block rounded bg-muted p-2 text-xs">
                    {selectedPayment.stripePaymentId}
                  </code>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
