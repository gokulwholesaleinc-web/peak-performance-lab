"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  sessions: number;
  price: number;
  validityDays: number;
  serviceId: string;
  serviceName: string;
  isActive: boolean;
  discount: number; // percentage off compared to single sessions
}

interface Service {
  id: string;
  name: string;
  price: number;
}

// Fetch packages
async function fetchPackages(): Promise<ServicePackage[]> {
  const response = await fetch("/api/packages");
  if (!response.ok) {
    // Return mock data if API not available
    return [
      {
        id: "1",
        name: "Personal Training - 5 Sessions",
        description: "5-session personal training package with 10% discount",
        sessions: 5,
        price: 450,
        validityDays: 60,
        serviceId: "1",
        serviceName: "Personal Training",
        isActive: true,
        discount: 10,
      },
      {
        id: "2",
        name: "Personal Training - 10 Sessions",
        description: "10-session personal training package with 15% discount",
        sessions: 10,
        price: 850,
        validityDays: 90,
        serviceId: "1",
        serviceName: "Personal Training",
        isActive: true,
        discount: 15,
      },
      {
        id: "3",
        name: "Golf Fitness - 5 Sessions",
        description: "5-session golf fitness package with 10% discount",
        sessions: 5,
        price: 540,
        validityDays: 60,
        serviceId: "2",
        serviceName: "Golf Fitness",
        isActive: true,
        discount: 10,
      },
      {
        id: "4",
        name: "Golf Fitness - 10 Sessions",
        description: "10-session golf fitness package with 15% discount",
        sessions: 10,
        price: 1020,
        validityDays: 120,
        serviceId: "2",
        serviceName: "Golf Fitness",
        isActive: true,
        discount: 15,
      },
      {
        id: "5",
        name: "Therapy Bundle - 5 Sessions",
        description:
          "5 therapy sessions (Dry Needling, IASTM, or Cupping) with 12% discount",
        sessions: 5,
        price: 280,
        validityDays: 60,
        serviceId: "3",
        serviceName: "Dry Needling",
        isActive: true,
        discount: 12,
      },
      {
        id: "6",
        name: "Monthly Wellness - 8 Sessions",
        description: "8 sessions per month - mix of training and therapy",
        sessions: 8,
        price: 640,
        validityDays: 30,
        serviceId: "1",
        serviceName: "Personal Training",
        isActive: false,
        discount: 20,
      },
    ];
  }
  return response.json();
}

// Fetch services for the dropdown
async function fetchServices(): Promise<Service[]> {
  const response = await fetch("/api/services");
  if (!response.ok) {
    return [
      { id: "1", name: "Personal Training", price: 100 },
      { id: "2", name: "Golf Fitness", price: 120 },
      { id: "3", name: "Dry Needling", price: 80 },
      { id: "4", name: "IASTM", price: 60 },
      { id: "5", name: "Cupping Therapy", price: 50 },
    ];
  }
  return response.json();
}

// Save package
async function savePackage(
  pkg: Partial<ServicePackage>
): Promise<ServicePackage> {
  const isNew = !pkg.id;
  const url = isNew ? "/api/packages" : `/api/packages/${pkg.id}`;
  const method = isNew ? "POST" : "PATCH";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pkg),
  });

  if (!response.ok) {
    throw new Error("Failed to save package");
  }

  return response.json();
}

// Delete package
async function deletePackage(id: string): Promise<void> {
  const response = await fetch(`/api/packages/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete package");
  }
}

export default function PackagesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] =
    useState<Partial<ServicePackage> | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] =
    useState<ServicePackage | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ServicePackage>>({
    name: "",
    description: "",
    sessions: 5,
    price: 0,
    validityDays: 60,
    serviceId: "",
    isActive: true,
    discount: 10,
  });

  // Fetch packages
  const { data: packages, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: fetchPackages,
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: savePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      setIsDialogOpen(false);
      setEditingPackage(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      setDeleteConfirmOpen(false);
      setPackageToDelete(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sessions: 5,
      price: 0,
      validityDays: 60,
      serviceId: "",
      isActive: true,
      discount: 10,
    });
  };

  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setFormData(pkg);
    setIsDialogOpen(true);
  };

  const handleDelete = (pkg: ServicePackage) => {
    setPackageToDelete(pkg);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      id: editingPackage?.id,
    });
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Calculate price per session
  const getPricePerSession = (pkg: ServicePackage) => {
    return (pkg.price / pkg.sessions).toFixed(2);
  };

  // Group packages by service
  const packagesByService = packages?.reduce(
    (acc, pkg) => {
      if (!acc[pkg.serviceName]) {
        acc[pkg.serviceName] = [];
      }
      acc[pkg.serviceName].push(pkg);
      return acc;
    },
    {} as Record<string, ServicePackage[]>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
          <p className="text-muted-foreground">
            Create and manage session packages with discounts
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      {/* Packages grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : packages && packages.length > 0 ? (
        <div className="space-y-8">
          {packagesByService &&
            Object.entries(packagesByService).map(([serviceName, pkgs]) => (
              <div key={serviceName}>
                <h2 className="text-xl font-semibold mb-4">{serviceName}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pkgs.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={pkg.isActive ? "" : "opacity-60"}
                    >
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={pkg.isActive ? "default" : "secondary"}
                            >
                              {pkg.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {pkg.discount > 0 && (
                              <Badge variant="outline" className="text-green-600">
                                {pkg.discount}% off
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(pkg)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(pkg)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {pkg.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Package className="h-4 w-4" />
                              Sessions
                            </div>
                            <span className="font-medium">{pkg.sessions}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              Total Price
                            </div>
                            <span className="font-medium">${pkg.price}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              Per Session
                            </div>
                            <span className="font-medium">
                              ${getPricePerSession(pkg)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Valid For
                            </div>
                            <span className="font-medium">
                              {pkg.validityDays} days
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No packages yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first package to offer discounted session bundles
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Edit Package" : "Add New Package"}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? "Update the package details below"
                : "Create a new session package with discount pricing"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Personal Training - 10 Sessions"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the package..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, serviceId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} (${service.price}/session)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessions">Number of Sessions</Label>
                <Input
                  id="sessions"
                  type="number"
                  value={formData.sessions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sessions: parseInt(e.target.value) || 0,
                    })
                  }
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Total Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  step={5}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validityDays">Validity (days)</Label>
                <Input
                  id="validityDays"
                  type="number"
                  value={formData.validityDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validityDays: parseInt(e.target.value) || 0,
                    })
                  }
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : editingPackage
                    ? "Update Package"
                    : "Add Package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{packageToDelete?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                packageToDelete && deleteMutation.mutate(packageToDelete.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
