"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { useInvoices, type Invoice } from "@/lib/hooks/use-api";
import { usePayInvoice } from "@/hooks/use-payments";

const statusConfig = {
  paid: {
    label: "Paid",
    className: "bg-green-500/10 text-green-600",
  },
  sent: {
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
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
};

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);

  const {
    data: invoicesData,
    isLoading,
    error,
  } = useInvoices({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: 20,
  });

  const payInvoice = usePayInvoice();

  const handlePayInvoice = (invoiceId: string) => {
    // Convert string ID to number for the API
    const numericId = parseInt(invoiceId, 10);
    if (isNaN(numericId)) {
      toast.error("Invalid invoice ID");
      return;
    }
    payInvoice.mutate(numericId);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // TODO: Download PDF invoice
    toast.info("PDF download coming soon. Invoice ID: " + invoiceId);
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

  const invoices = invoicesData?.data || [];
  const pagination = invoicesData?.pagination;

  const totalPending = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">View and pay your invoices</p>
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
            <SelectItem value="sent">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No invoices found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "Your invoices will appear here"
                : `No ${statusFilter === "sent" ? "pending" : statusFilter} invoices`}
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
              {invoices.map((invoice) => {
                const status =
                  statusConfig[invoice.status as keyof typeof statusConfig] ||
                  statusConfig.draft;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.number}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : "-"}
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
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
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
                                Pay
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pagination.limit + 1} to{" "}
                {Math.min(page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} invoices
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
                  className={
                    statusConfig[
                      selectedInvoice.status as keyof typeof statusConfig
                    ]?.className || ""
                  }
                >
                  {statusConfig[
                    selectedInvoice.status as keyof typeof statusConfig
                  ]?.label || selectedInvoice.status}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Due:{" "}
                  {selectedInvoice.dueDate
                    ? new Date(selectedInvoice.dueDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Invoice Details</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Number</span>
                  <span className="font-medium">{selectedInvoice.number}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(selectedInvoice.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span className="text-lg">
                  ${selectedInvoice.amount.toFixed(2)}
                </span>
              </div>

              {selectedInvoice.status === "paid" && selectedInvoice.paidAt && (
                <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
                  <p className="font-medium">Payment received</p>
                  <p>
                    Paid on{" "}
                    {new Date(selectedInvoice.paidAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                {(selectedInvoice.status === "sent" ||
                  selectedInvoice.status === "overdue") && (
                  <Button
                    className="flex-1"
                    onClick={() => handlePayInvoice(selectedInvoice.id)}
                    disabled={payInvoice.isPending}
                  >
                    {payInvoice.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
