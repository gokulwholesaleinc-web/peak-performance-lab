"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut, User, Bell, Dumbbell } from "lucide-react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AdminNav } from "@/components/shared/AdminNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 lg:px-6">
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="border-b px-6 py-4">
                  <SheetTitle className="text-left">
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Dumbbell className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="text-lg">Peak Performance</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 py-4 px-4">
                  <AdminNav onItemClick={() => setMobileMenuOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link
              href="/admin"
              className="flex items-center gap-2 font-semibold"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Dumbbell className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="hidden md:inline-block text-lg text-foreground">
                Peak Performance Lab
              </span>
              <span className="md:hidden text-lg text-foreground">PPL</span>
            </Link>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  3
                </span>
                <span className="sr-only">Notifications</span>
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="Admin" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Admin</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        admin@peakperformancelab.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/40">
            <ScrollArea className="flex-1 py-4 px-4">
              <AdminNav />
            </ScrollArea>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container py-6">{children}</div>
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
