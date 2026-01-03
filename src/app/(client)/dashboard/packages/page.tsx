"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ClientPackage {
  id: string;
  name: string;
  description: string;
  sessionsUsed: number;
  sessionsTotal: number;
  purchasedAt: string;
  expiresAt: string | null;
  status: "active" | "expired" | "depleted";
  serviceType: string;
}

interface AvailablePackage {
  id: string;
  name: string;
  description: string;
  sessions: number;
  price: number;
  pricePerSession: number;
  validityDays: number | null;
  serviceType: string;
  popular?: boolean;
}

interface PackagesData {
  clientPackages: ClientPackage[];
  availablePackages: AvailablePackage[];
}

// Mock data - replace with actual API calls
const mockPackagesData: PackagesData = {
  clientPackages: [
    {
      id: "1",
      name: "Personal Training (10 Sessions)",
      description: "One-on-one personal training sessions",
      sessionsUsed: 3,
      sessionsTotal: 10,
      purchasedAt: "2024-11-01",
      expiresAt: "2025-05-01",
      status: "active",
      serviceType: "Personal Training",
    },
    {
      id: "2",
      name: "Recovery Pack (5 Sessions)",
      description: "Any recovery service - dry needling, cupping, IASTM, or stretch therapy",
      sessionsUsed: 2,
      sessionsTotal: 5,
      purchasedAt: "2024-12-01",
      expiresAt: null,
      status: "active",
      serviceType: "Recovery",
    },
    {
      id: "3",
      name: "Golf Fitness (8 Sessions)",
      description: "Golf-specific fitness training",
      sessionsUsed: 8,
      sessionsTotal: 8,
      purchasedAt: "2024-08-15",
      expiresAt: "2025-02-15",
      status: "depleted",
      serviceType: "Golf Fitness",
    },
  ],
  availablePackages: [
    {
      id: "pkg-1",
      name: "Personal Training Starter",
      description: "Perfect for getting started with personal training",
      sessions: 5,
      price: 450,
      pricePerSession: 90,
      validityDays: 90,
      serviceType: "Personal Training",
    },
    {
      id: "pkg-2",
      name: "Personal Training Pro",
      description: "Our most popular training package",
      sessions: 10,
      price: 850,
      pricePerSession: 85,
      validityDays: 180,
      serviceType: "Personal Training",
      popular: true,
    },
    {
      id: "pkg-3",
      name: "Personal Training Elite",
      description: "Maximum value for committed athletes",
      sessions: 20,
      price: 1500,
      pricePerSession: 75,
      validityDays: 365,
      serviceType: "Personal Training",
    },
    {
      id: "pkg-4",
      name: "Golf Fitness Pack",
      description: "Specialized golf fitness training",
      sessions: 8,
      price: 880,
      pricePerSession: 110,
      validityDays: 180,
      serviceType: "Golf Fitness",
    },
    {
      id: "pkg-5",
      name: "Recovery Essentials",
      description: "Any recovery service - dry needling, cupping, IASTM, stretch therapy",
      sessions: 5,
      price: 300,
      pricePerSession: 60,
      validityDays: null,
      serviceType: "Recovery",
    },
    {
      id: "pkg-6",
      name: "Recovery Premium",
      description: "Extended recovery package for optimal results",
      sessions: 10,
      price: 550,
      pricePerSession: 55,
      validityDays: null,
      serviceType: "Recovery",
      popular: true,
    },
  ],
};

async function fetchPackagesData(): Promise<PackagesData> {
  // In production, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockPackagesData), 500);
  });
}

async function initiateCheckout(packageId: string): Promise<string> {
  // In production, this would call /api/payments/checkout
  // and return a Stripe checkout URL
  console.log("Initiating checkout for package:", packageId);
  return new Promise((resolve) => {
    setTimeout(() => resolve("https://checkout.stripe.com/..."), 500);
  });
}

export default function PackagesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["packages"],
    queryFn: fetchPackagesData,
  });

  const handlePurchase = async (packageId: string) => {
    try {
      const checkoutUrl = await initiateCheckout(packageId);
      // In production, redirect to Stripe checkout
      console.log("Redirect to:", checkoutUrl);
      // window.location.href = checkoutUrl;
      alert("In production, this would redirect to Stripe checkout");
    } catch (error) {
      console.error("Failed to initiate checkout:", error);
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
        <p className="text-destructive">Failed to load packages</p>
      </div>
    );
  }

  const { clientPackages, availablePackages } = data!;
  const activePackages = clientPackages.filter((pkg) => pkg.status === "active");

  // Group available packages by service type
  const packagesByType = availablePackages.reduce((acc, pkg) => {
    if (!acc[pkg.serviceType]) {
      acc[pkg.serviceType] = [];
    }
    acc[pkg.serviceType].push(pkg);
    return acc;
  }, {} as Record<string, AvailablePackage[]>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Packages</h1>
        <p className="text-muted-foreground">
          Manage your session packages and purchase new ones
        </p>
      </div>

      {/* Active Packages */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your Active Packages</h2>

        {activePackages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No active packages</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Purchase a package below to save on your sessions
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePackages.map((pkg) => {
              const sessionsRemaining = pkg.sessionsTotal - pkg.sessionsUsed;
              const percentUsed = (pkg.sessionsUsed / pkg.sessionsTotal) * 100;

              return (
                <Card key={pkg.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{pkg.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {pkg.serviceType}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-600"
                      >
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sessions</span>
                        <span className="font-medium">
                          {sessionsRemaining} of {pkg.sessionsTotal} remaining
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${100 - percentUsed}%` }}
                        />
                      </div>
                    </div>

                    {pkg.expiresAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Expires:{" "}
                          {new Date(pkg.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      {pkg.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* History of depleted/expired packages */}
        {clientPackages.filter((pkg) => pkg.status !== "active").length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <span>
                View package history (
                {clientPackages.filter((pkg) => pkg.status !== "active").length})
              </span>
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientPackages
                .filter((pkg) => pkg.status !== "active")
                .map((pkg) => (
                  <Card key={pkg.id} className="opacity-60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{pkg.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {pkg.serviceType}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {pkg.status === "depleted" ? "Used" : "Expired"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {pkg.sessionsUsed} of {pkg.sessionsTotal} sessions used
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </details>
        )}
      </section>

      <Separator />

      {/* Available Packages */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Purchase New Package</h2>
          <p className="text-sm text-muted-foreground">
            Save money by purchasing session packages
          </p>
        </div>

        {Object.entries(packagesByType).map(([type, packages]) => (
          <div key={type} className="space-y-4">
            <h3 className="font-medium text-muted-foreground">{type}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={cn(
                    "relative",
                    pkg.popular && "border-primary shadow-md"
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        ${pkg.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {pkg.sessions} sessions
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>${pkg.pricePerSession} per session</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>
                          {pkg.validityDays
                            ? `Valid for ${pkg.validityDays} days`
                            : "Never expires"}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant={pkg.popular ? "default" : "outline"}
                      onClick={() => handlePurchase(pkg.id)}
                    >
                      Purchase
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
