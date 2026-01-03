"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  useCurrentUser,
  useClientProfile,
  useUpdateProfile,
} from "@/lib/hooks/use-api";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current user to get ID
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userId = userData?.user?.id;

  // Fetch full profile
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useClientProfile(userId);

  // Update mutation
  const updateMutation = useUpdateProfile();

  const profile = profileData?.data;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
        email: profile.email,
        phone: profile.phone || "",
      });
    }
  }, [profile, profileForm]);

  const handleProfileSubmit = async (data: ProfileFormValues) => {
    if (!userId) return;

    try {
      await updateMutation.mutateAsync({
        clientId: userId,
        data: {
          name: data.name,
          phone: data.phone,
        },
      });
      toast.success("Profile updated successfully!");
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  const isLoading = userLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">Failed to load profile</p>
      </div>
    );
  }

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-green-500/10 p-4 text-green-600">
          {successMessage}
        </div>
      )}

      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" alt={profile?.name || "User"} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{profile?.name}</h2>
            <p className="text-muted-foreground">{profile?.email}</p>
            <p className="text-sm text-muted-foreground">
              Member since{" "}
              {profile?.createdAt &&
                new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
              className="space-y-6"
            >
              {/* Name */}
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        Contact support to change your email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Account Summary */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
            <CardDescription>
              Quick overview of your account activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Recent Appointments
                </h3>
                <p className="mt-1 text-2xl font-bold">
                  {profile.appointments?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last {profile.appointments?.length || 0} appointments
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Active Packages
                </h3>
                <p className="mt-1 text-2xl font-bold">
                  {profile.packages?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile.packages?.reduce(
                    (acc, pkg) => acc + pkg.remainingSessions,
                    0
                  ) || 0}{" "}
                  sessions remaining
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
