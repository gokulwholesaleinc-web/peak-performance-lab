"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, Package, Receipt, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="flex items-center gap-2 font-medium">
              <HelpCircle className="h-4 w-4" />
              What happened?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You cancelled the payment process. If this was unintentional, you
              can try again by returning to the packages or invoices page.
            </p>
          </div>

          <Separator />

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Common reasons for cancellation:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Changed your mind about the purchase</li>
              <li>Needed to verify payment details</li>
              <li>Wanted to review the order</li>
              <li>Accidentally closed the payment window</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/dashboard/packages">
                <Package className="mr-2 h-4 w-4" />
                View Packages
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/dashboard/invoices">
                <Receipt className="mr-2 h-4 w-4" />
                View Invoices
              </Link>
            </Button>
          </div>
          <Button className="w-full" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
