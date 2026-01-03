"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Receipt,
  Download,
  ExternalLink,
  Eye,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  amount: number;
  items: InvoiceItem[];
  paymentMethod?: string;
  paidAt?: string;
}

// Mock data - replace with actual API calls
const mockInvoices: Invoice[] = [
  {
    id: "1",
    number: "INV-2024-001",
    date: "2024-12-01",
    dueDate: "2024-12-15",
    status: "paid",
    amount: 150.0,
    items: [
      {
        description: "Personal Training Session",
        quantity: 1,
        unitPrice: 100,
        total: 100,
      },
      {
        description: "Dry Needling Session",
        quantity: 1,
        unitPrice: 50,
        total: 50,
      },
    ],
    paymentMethod: "Visa ending in 4242",
    paidAt: "2024-12-10",
  },
  {
    id: "2",
    number: "INV-2024-002",
    date: "2024-12-15",
    dueDate: "2025-01-15",
    status: "pending",
    amount: 500.0,
    items: [
      {
        description: "Personal Training Pro Package (10 Sessions)",
        quantity: 1,
        unitPrice: 500,
        total: 500,
      },
    ],
  },
  {
    id: "3",
    number: "INV-2024-003",
    date: "2024-11-15",
    dueDate: "2024-12-01",
    status: "overdue",
    amount: 85.0,
    items: [
      {
        description: "Dry Needling Session",
        quantity: 1,
        unitPrice: 85,
        total: 85,
      },
    ],
  },
  {
    id: "4",
    number: "INV-2024-004",
    date: "2024-11-01",
    dueDate: "2024-11-15",
    status: "paid",
    amount: 120.0,
    items: [
      {
        description: "Golf Performance Training",
        quantity: 1,
        unitPrice: 120,
        total: 120,
      },
    ],
    paymentMethod: "Mastercard ending in 5555",
    paidAt: "2024-11-14",
  },
  {
    id: "5",
    number: "INV-2024-005",
    date: "2024-10-15",
    dueDate: "2024-10-30",
    status: "cancelled",
    amount: 70.0,
    items: [
      {
        description: "Stretch Therapy",
        quantity: 1,
        unitPrice: 70,
        total: 70,
      },
    ],
  },
];

async function fetchInvoices(): Promise<Invoice[]> {
  // In production, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockInvoices), 500);
  });
}

async function initiatePayment(invoiceId: string): Promise<string> {
  // In production, this would call /api/payments/checkout
  console.log("Initiating payment for invoice:", invoiceId);
  return new Promise((resolve) => {
    setTimeout(() => resolve("https://checkout.stripe.com/..."), 500);
  });
}

async function downloadInvoice(invoiceId: string): Promise<void> {
  // In production, this would download the invoice PDF
  console.log("Downloading invoice:", invoiceId);
  alert("In production, this would download the invoice PDF");
}

const statusConfig = {
  paid: {
    label: "Paid",
    className: "bg-green-500/10 text-green-600",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-600",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/10 text-destructive",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const checkoutUrl = await initiatePayment(invoiceId);
      // In production, redirect to Stripe checkout
      console.log("Redirect to:", checkoutUrl);
      // window.location.href = checkoutUrl;
      alert("In production, this would redirect to Stripe checkout");
    } catch (error) {
      console.error("Failed to initiate payment:", error);
    }
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
        <p className="text-destructive">Failed to load invoices</p>
      </div>
    );
  }

  const filteredInvoices =
    statusFilter === "all"
      ? invoices
      : invoices?.filter((inv) => inv.status === statusFilter);

  const totalPending =
    invoices
      ?.filter((inv) => inv.status === "pending" || inv.status === "overdue")
      .reduce((acc, inv) => acc + inv.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            View and pay your invoices
          </p>
        </div>
        {totalPending > 0 && (
          <Card className="w-fit">
            <CardContent className="flex items-center gap-4 py-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-xl font-bold">${totalPending.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      {filteredInvoices?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No invoices found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "Your invoices will appear here"
                : `No ${statusFilter} invoices`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices?.map((invoice) => {
                const status = statusConfig[invoice.status];
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.number}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${invoice.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadInvoice(invoice.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {(invoice.status === "pending" ||
                          invoice.status === "overdue") && (
                          <Button
                            size="sm"
                            onClick={() => handlePayInvoice(invoice.id)}
                          >
                            Pay
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={() => setSelectedInvoice(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.number}</DialogTitle>
            <DialogDescription>
              Issued on{" "}
              {selectedInvoice &&
                new Date(selectedInvoice.date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={statusConfig[selectedInvoice.status].className}
                >
                  {statusConfig[selectedInvoice.status].label}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Items</h4>
                {selectedInvoice.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p>{item.description}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} x ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">${item.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span className="text-lg">
                  ${selectedInvoice.amount.toFixed(2)}
                </span>
              </div>

              {selectedInvoice.status === "paid" && (
                <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
                  <p className="font-medium">Payment received</p>
                  <p>
                    {selectedInvoice.paymentMethod} -{" "}
                    {selectedInvoice.paidAt &&
                      new Date(selectedInvoice.paidAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadInvoice(selectedInvoice.id)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                {(selectedInvoice.status === "pending" ||
                  selectedInvoice.status === "overdue") && (
                  <Button
                    className="flex-1"
                    onClick={() => handlePayInvoice(selectedInvoice.id)}
                  >
                    Pay Now
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
