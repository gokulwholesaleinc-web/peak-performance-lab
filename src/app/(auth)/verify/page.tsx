"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

type VerificationState = "loading" | "success" | "error";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    // Check if we're coming back from the API with an error
    if (error) {
      setState("error");
      const errorMessages: Record<string, string> = {
        missing_token: "No verification token provided",
        invalid_or_expired_token: "This link has expired or already been used",
        verification_failed: "Verification failed. Please try again.",
      };
      setErrorMessage(errorMessages[error] || "Verification failed");
      return;
    }

    if (!token) {
      setState("error");
      setErrorMessage("No verification token provided");
      return;
    }

    // Redirect to API which handles verification and sets cookie
    // The API will redirect to dashboard on success or back with error
    window.location.href = `/api/auth/verify?token=${token}`;
  }, [searchParams]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Verifying your link</CardTitle>
            <CardDescription>
              Please wait while we verify your login link...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">You&apos;re signed in!</CardTitle>
            <CardDescription>Redirecting to your dashboard...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Verification failed</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            The link may have expired or already been used. Please request a new
            login link.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <CardTitle className="text-2xl">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
