"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

interface CheckoutResponse {
  sessionId: string;
  url: string;
}

interface PortalResponse {
  url: string;
}

interface ApiError {
  error: string;
  details?: unknown;
}

// ============================================
// API Functions
// ============================================

async function createPackageCheckout(packageId: number): Promise<CheckoutResponse> {
  const response = await fetch("/api/payments/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ packageId }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to create checkout session");
  }

  return response.json();
}

async function createInvoiceCheckout(invoiceId: number): Promise<CheckoutResponse> {
  const response = await fetch("/api/payments/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoiceId }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to create checkout session");
  }

  return response.json();
}

async function getCustomerPortalUrl(returnUrl?: string): Promise<PortalResponse> {
  const params = new URLSearchParams();
  if (returnUrl) {
    params.set("returnUrl", returnUrl);
  }

  const url = `/api/payments/portal${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to get portal URL");
  }

  return response.json();
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to purchase a package
 * Redirects the user to Stripe Checkout
 */
export function usePurchasePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPackageCheckout,
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error("Failed to get checkout URL");
      }
    },
    onError: (error: Error) => {
      console.error("Package checkout error:", error);
      toast.error(error.message || "Failed to initiate checkout");
    },
    onSettled: () => {
      // Invalidate relevant queries after checkout attempt
      queryClient.invalidateQueries({ queryKey: ["clientPackages"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/**
 * Hook to pay an invoice
 * Redirects the user to Stripe Checkout
 */
export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvoiceCheckout,
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error("Failed to get checkout URL");
      }
    },
    onError: (error: Error) => {
      console.error("Invoice checkout error:", error);
      toast.error(error.message || "Failed to initiate payment");
    },
    onSettled: () => {
      // Invalidate invoices query after payment attempt
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/**
 * Hook to open the Stripe Customer Portal
 * Opens the portal in a new window or redirects to it
 */
export function useCustomerPortal() {
  const router = useRouter();

  return useMutation({
    mutationFn: (options?: { returnUrl?: string; openInNewTab?: boolean }) =>
      getCustomerPortalUrl(options?.returnUrl),
    onSuccess: (data, variables) => {
      if (data.url) {
        if (variables?.openInNewTab) {
          // Open in new tab
          window.open(data.url, "_blank", "noopener,noreferrer");
        } else {
          // Redirect in current window
          window.location.href = data.url;
        }
      } else {
        toast.error("Failed to get portal URL");
      }
    },
    onError: (error: Error) => {
      console.error("Customer portal error:", error);
      toast.error(error.message || "Failed to open customer portal");
    },
  });
}

/**
 * Convenience hook that returns all payment-related mutations
 */
export function usePayments() {
  const purchasePackage = usePurchasePackage();
  const payInvoice = usePayInvoice();
  const openCustomerPortal = useCustomerPortal();

  return {
    purchasePackage,
    payInvoice,
    openCustomerPortal,
    isLoading:
      purchasePackage.isPending ||
      payInvoice.isPending ||
      openCustomerPortal.isPending,
  };
}
