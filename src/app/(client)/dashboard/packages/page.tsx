"use client";

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
import { useClientPackages, useAvailablePackages } from "@/hooks/use-api";
import { usePurchasePackage } from "@/hooks/use-payments";
import { LoadingSpinner, EmptyState } from "@/components/shared";

export default function PackagesPage() {
  const {
    data: clientPackagesData,
    isLoading: clientPackagesLoading,
    error: clientPackagesError,
  } = useClientPackages();

  const {
    data: availablePackagesData,
    isLoading: availablePackagesLoading,
    error: availablePackagesError,
  } = useAvailablePackages();

  const purchasePackage = usePurchasePackage();

  const isLoading = clientPackagesLoading || availablePackagesLoading;
  const error = clientPackagesError || availablePackagesError;

  const handlePurchase = (packageId: number) => {
    purchasePackage.mutate(packageId);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">Failed to load packages</p>
      </div>
    );
  }

  const activePackages = clientPackagesData?.data?.active || [];
  const inactivePackages = clientPackagesData?.data?.inactive || [];
  const availablePackages = availablePackagesData?.data || [];

  // Group available packages by determining service type from name
  const packagesByType = availablePackages.reduce(
    (acc, pkg) => {
      let serviceType = "Personal Training";
      if (pkg.name.toLowerCase().includes("golf")) {
        serviceType = "Golf Fitness";
      } else if (pkg.name.toLowerCase().includes("recovery")) {
        serviceType = "Recovery";
      }

      if (!acc[serviceType]) {
        acc[serviceType] = [];
      }
      acc[serviceType].push({
        ...pkg,
        pricePerSession: (parseFloat(pkg.price) / pkg.sessionCount).toFixed(2),
        popular: pkg.sessionCount === 10, // Mark 10-session packages as popular
      });
      return acc;
    },
    {} as Record<
      string,
      Array<
        (typeof availablePackages)[0] & { pricePerSession: string; popular: boolean }
      >
    >
  );

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
          <EmptyState
            icon={Package}
            title="No active packages"
            description="Purchase a package below to save on your sessions"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePackages.map((pkg) => {
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
                          {pkg.sessionsRemaining} of {pkg.sessionsTotal} remaining
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

                    {pkg.description && (
                      <p className="text-sm text-muted-foreground">
                        {pkg.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* History of depleted/expired packages */}
        {inactivePackages.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <span>View package history ({inactivePackages.length})</span>
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactivePackages.map((pkg) => (
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
                        ${parseFloat(pkg.price).toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {pkg.sessionCount} sessions
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
                      disabled={purchasePackage.isPending}
                    >
                      {purchasePackage.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Purchase
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {availablePackages.length === 0 && (
          <EmptyState
            icon={Package}
            title="No packages available"
            description="Check back later for available packages"
          />
        )}
      </section>
    </div>
  );
}
