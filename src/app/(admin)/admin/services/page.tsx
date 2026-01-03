"use client";

import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
} from "lucide-react";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  type Service,
  type ServiceFormData,
} from "@/hooks/use-api";

const categories = ["Training", "Therapy", "Recovery", "Assessment"];

export default function ServicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Form state
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    durationMins: 60,
    price: "0",
    category: "Training",
    isActive: true,
  });

  // API hooks
  const { data: services, isLoading } = useServices();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      durationMins: 60,
      price: "0",
      category: "Training",
      isActive: true,
    });
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      durationMins: service.durationMins,
      price: service.price,
      category: service.category || "Training",
      isActive: service.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    setServiceToDelete(service);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingService) {
        await updateMutation.mutateAsync({
          id: editingService.id,
          data: formData,
        });
        toast.success("Service updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Service created successfully");
      }
      setIsDialogOpen(false);
      setEditingService(null);
      resetForm();
    } catch (error) {
      toast.error(editingService ? "Failed to update service" : "Failed to create service");
    }
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteMutation.mutateAsync(serviceToDelete.id);
      toast.success("Service deleted successfully");
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      await updateMutation.mutateAsync({
        id: service.id,
        data: { isActive: !service.isActive },
      });
      toast.success(`Service ${service.isActive ? "deactivated" : "activated"} successfully`);
    } catch (error) {
      toast.error("Failed to update service status");
    }
  };

  const handleAddNew = () => {
    setEditingService(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Define columns for the data table
  const columns: Column<Service>[] = [
    {
      key: "name",
      header: "Service",
      sortable: true,
      render: (service) => (
        <div>
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {service.description}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (service) => (
        <Badge variant="outline">{service.category || "Uncategorized"}</Badge>
      ),
    },
    {
      key: "durationMins",
      header: "Duration",
      sortable: true,
      render: (service) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {service.durationMins} min
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (service) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          {parseFloat(service.price).toFixed(2)}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (service) => (
        <Badge variant={service.isActive ? "default" : "secondary"}>
          {service.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (service) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(service)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
              {service.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(service)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage the services you offer to clients
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Services table */}
      <DataTable
        data={services || []}
        columns={columns}
        searchable
        searchPlaceholder="Search services..."
        searchKeys={["name", "description", "category"]}
        isLoading={isLoading}
        emptyMessage="No services found."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update the service details below"
                : "Fill in the details for your new service"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Personal Training"
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
                placeholder="Describe the service..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationMins">Duration (minutes)</Label>
                <Input
                  id="durationMins"
                  type="number"
                  value={formData.durationMins}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMins: parseInt(e.target.value) || 0,
                    })
                  }
                  min={15}
                  step={15}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
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
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  : editingService
                    ? "Update Service"
                    : "Add Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{serviceToDelete?.name}
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
