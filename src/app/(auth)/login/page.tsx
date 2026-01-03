"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2, CheckCircle2, ShieldCheck, User } from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send login link");
      }

      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (err) {
      form.setError("email", {
        type: "manual",
        message:
          err instanceof Error ? err.message : "Failed to send login link",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTestLogin(type: "admin" | "customer") {
    const isAdmin = type === "admin";
    const setLoadingState = isAdmin ? setIsAdminLoading : setIsCustomerLoading;
    const credentials = isAdmin
      ? { username: "admin", password: "admin" }
      : { username: "test", password: "test" };
    const defaultRedirect = isAdmin ? "/admin" : "/dashboard";

    setLoadingState(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push(data.redirectTo || defaultRedirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoadingState(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="mt-2">
              We sent a login link to{" "}
              <span className="font-medium text-foreground">
                {submittedEmail}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Click the link in the email to sign in to your account. The link
              will expire in 15 minutes.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSuccess(false);
                form.reset();
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Peak Performance Lab</CardTitle>
          <CardDescription>
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Login Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900"
                onClick={() => handleTestLogin("admin")}
                disabled={isAdminLoading || isCustomerLoading}
              >
                {isAdminLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin (admin/admin)
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900"
                onClick={() => handleTestLogin("customer")}
                disabled={isAdminLoading || isCustomerLoading}
              >
                {isCustomerLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Customer (test/test)
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Magic Link Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Login Link"
                )}
              </Button>
            </form>
          </Form>
          <p className="text-center text-sm text-muted-foreground">
            We&apos;ll send you a magic link for a password-free sign in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
