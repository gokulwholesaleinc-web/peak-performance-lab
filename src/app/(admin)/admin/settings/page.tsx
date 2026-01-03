"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Building, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  website: string;
}

interface Settings {
  availability: AvailabilitySlot[];
  businessInfo: BusinessInfo;
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const timeOptions = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // Start at 6 AM
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const displayHour = hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";
  const display = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  return { value: time, label: display };
});

// Fetch settings
async function fetchSettings(): Promise<Settings> {
  const response = await fetch("/api/admin/settings");
  if (!response.ok) {
    // Return mock data if API not available
    return {
      availability: [
        { id: "1", dayOfWeek: 1, startTime: "08:00", endTime: "18:00" },
        { id: "2", dayOfWeek: 2, startTime: "08:00", endTime: "18:00" },
        { id: "3", dayOfWeek: 3, startTime: "08:00", endTime: "18:00" },
        { id: "4", dayOfWeek: 4, startTime: "08:00", endTime: "18:00" },
        { id: "5", dayOfWeek: 5, startTime: "08:00", endTime: "18:00" },
        { id: "6", dayOfWeek: 6, startTime: "09:00", endTime: "14:00" },
      ],
      businessInfo: {
        name: "Peak Performance Lab",
        email: "contact@peakperformancelab.com",
        phone: "(312) 555-0100",
        address: "123 Fitness Avenue",
        city: "Chicago",
        state: "IL",
        zip: "60601",
        description:
          "Mobile fitness and wellness practice offering personal training, golf fitness, and therapeutic services.",
        website: "https://peakperformancelab.com",
      },
    };
  }
  return response.json();
}

// Save settings
async function saveSettings(settings: Settings): Promise<Settings> {
  const response = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error("Failed to save settings");
  }

  return response.json();
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("availability");

  // Local state for editing
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    description: "",
    website: "",
  });

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (settingsData) {
      setAvailability(settingsData.availability);
      setBusinessInfo(settingsData.businessInfo);
    }
  }, [settingsData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleSaveAvailability = () => {
    saveMutation.mutate({
      availability,
      businessInfo,
    });
  };

  const handleSaveBusinessInfo = () => {
    saveMutation.mutate({
      availability,
      businessInfo,
    });
  };

  const addAvailabilitySlot = () => {
    const newSlot: AvailabilitySlot = {
      id: `new-${Date.now()}`,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    };
    setAvailability([...availability, newSlot]);
  };

  const removeAvailabilitySlot = (id: string) => {
    setAvailability(availability.filter((slot) => slot.id !== id));
  };

  const updateAvailabilitySlot = (
    id: string,
    field: keyof AvailabilitySlot,
    value: string | number
  ) => {
    setAvailability(
      availability.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business settings and availability
        </p>
      </div>

      {/* Settings tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="availability">
            <Clock className="mr-2 h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="business">
            <Building className="mr-2 h-4 w-4" />
            Business Info
          </TabsTrigger>
        </TabsList>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>
                Set your regular availability for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availability.length > 0 ? (
                <div className="space-y-3">
                  {availability
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-4 rounded-lg border p-3"
                      >
                        <div className="w-32">
                          <Select
                            value={slot.dayOfWeek.toString()}
                            onValueChange={(value) =>
                              updateAvailabilitySlot(
                                slot.id,
                                "dayOfWeek",
                                parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {daysOfWeek.map((day, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={slot.startTime}
                            onValueChange={(value) =>
                              updateAvailabilitySlot(slot.id, "startTime", value)
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-muted-foreground">to</span>

                          <Select
                            value={slot.endTime}
                            onValueChange={(value) =>
                              updateAvailabilitySlot(slot.id, "endTime", value)
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAvailabilitySlot(slot.id)}
                          className="ml-auto text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No availability slots configured
                </p>
              )}

              <Button variant="outline" onClick={addAvailabilitySlot}>
                <Plus className="mr-2 h-4 w-4" />
                Add Time Slot
              </Button>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAvailability}
                  disabled={saveMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Info Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={businessInfo.name}
                    onChange={(e) =>
                      setBusinessInfo({ ...businessInfo, name: e.target.value })
                    }
                    placeholder="Peak Performance Lab"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={businessInfo.website}
                    onChange={(e) =>
                      setBusinessInfo({
                        ...businessInfo,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) =>
                      setBusinessInfo({ ...businessInfo, email: e.target.value })
                    }
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={businessInfo.phone}
                    onChange={(e) =>
                      setBusinessInfo({ ...businessInfo, phone: e.target.value })
                    }
                    placeholder="(312) 555-0100"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={businessInfo.address}
                  onChange={(e) =>
                    setBusinessInfo({ ...businessInfo, address: e.target.value })
                  }
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={businessInfo.city}
                    onChange={(e) =>
                      setBusinessInfo({ ...businessInfo, city: e.target.value })
                    }
                    placeholder="Chicago"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={businessInfo.state}
                    onChange={(e) =>
                      setBusinessInfo({ ...businessInfo, state: e.target.value })
                    }
                    placeholder="IL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={businessInfo.zip}
                    onChange={(e) =>
                      setBusinessInfo({ ...businessInfo, zip: e.target.value })
                    }
                    placeholder="60601"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={businessInfo.description}
                  onChange={(e) =>
                    setBusinessInfo({
                      ...businessInfo,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your business..."
                  rows={4}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveBusinessInfo}
                  disabled={saveMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
