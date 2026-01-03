"use client";

import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package as PackageIcon,
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
import { toast } from "sonner";
import {
  usePackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  type Package,
  type PackageFormData,
} from "@/hooks/use-api";

export default function PackagesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);

  // Form state
  const [formData, setFormData] = useState<PackageFormData>({
    name: "",
    description: "",
    sessionCount: 5,
    price: "0",
    validityDays: 60,
    isActive: true,
  });

  // API hooks
  const { data: packages, isLoading } = usePackages();
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const deleteMutation = useDeletePackage();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sessionCount: 5,
      price: "0",
      validityDays: 60,
      isActive: true,
    });
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      sessionCount: pkg.sessionCount,
      price: pkg.price,
      validityDays: pkg.validityDays,
      isActive: pkg.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (pkg: Package) => {
    setPackageToDelete(pkg);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPackage) {
        await updateMutation.mutateAsync({
          id: editingPackage.id,
          data: formData,
        });
        toast.success("Package updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Package created successfully");
      }
      setIsDialogOpen(false);
      setEditingPackage(null);
      resetForm();
    } catch (error) {
      toast.error(editingPackage ? "Failed to update package" : "Failed to create package");
    }
  };

  const handleConfirmDelete = async () => {
    if (!packageToDelete) return;

    try {
      await deleteMutation.mutateAsync(packageToDelete.id);
      toast.success("Package deleted successfully");
      setDeleteConfirmOpen(false);
      setPackageToDelete(null);
    } catch (error) {
      toast.error("Failed to delete package");
    }
  };

  const handleToggleStatus = async (pkg: Package) => {
    try {
      await updateMutation.mutateAsync({
        id: pkg.id,
        data: { isActive: !pkg.isActive },
      });
      toast.success(`Package ${pkg.isActive ? "deactivated" : "activated"} successfully`);
    } catch (error) {
      toast.error("Failed to update package status");
    }
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Calculate price per session
  const getPricePerSession = (pkg: Package) => {
    const price = parseFloat(pkg.price);
    return (price / pkg.sessionCount).toFixed(2);
  };

  // Calculate discount percentage (assuming base price could be computed)
  const getDiscountBadge = (pkg: Package) => {
    // We'll show a simple indicator based on session count
    // More sessions = higher discount implied
    if (pkg.sessionCount >= 10) {
      return { show: true, value: "15% off" };
    } else if (pkg.sessionCount >= 5) {
      return { show: true, value: "10% off" };
    }
    return { show: false, value: "" };
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const discount = getDiscountBadge(pkg);
            return (
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
                      {discount.show && (
                        <Badge variant="outline" className="text-green-600">
                          {discount.value}
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
                      <DropdownMenuItem onClick={() => handleToggleStatus(pkg)}>
                        {pkg.isActive ? "Deactivate" : "Activate"}
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
                    {pkg.description || "No description"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <PackageIcon className="h-4 w-4" />
                        Sessions
                      </div>
                      <span className="font-medium">{pkg.sessionCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        Total Price
                      </div>
                      <span className="font-medium">${parseFloat(pkg.price).toFixed(2)}</span>
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
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionCount">Number of Sessions</Label>
                <Input
                  id="sessionCount"
                  type="number"
                  value={formData.sessionCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sessionCount: parseInt(e.target.value) || 0,
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
                      price: e.target.value,
                    })
                  }
                  min={0}
                  step={0.01}
                  required
                />
              </div>
            </div>

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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
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
              onClick={handleConfirmDelete}
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
