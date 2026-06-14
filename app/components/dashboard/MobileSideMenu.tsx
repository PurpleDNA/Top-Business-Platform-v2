"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  UserPlus,
  Calculator,
  Settings,
  User,
  LogOut,
  AppWindow,
  ShoppingCart,
  Wallet,
  Users,
  Factory,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/auth-provider";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigationItems = [
  {
    title: "All Productions",
    href: "/productions/all",
    icon: Factory,
  },
  {
    title: "All Customers",
    href: "/customers/all",
    icon: Users,
  },
  {
    title: "All Sales",
    href: "/sales/all",
    icon: ShoppingCart,
  },
  {
    title: "All Payments",
    href: "/payments/all",
    icon: Wallet,
  },
  {
    title: "New Sale",
    href: "/sale/new",
    icon: BriefcaseBusiness,
  },
  {
    title: "New Payment",
    href: "/payment/new",
    icon: CircleDollarSign,
  },
  {
    title: "New Production",
    href: "/production/new",
    icon: FileText,
  },
  {
    title: "New Customer",
    href: "/customers/new",
    icon: UserPlus,
  },
  {
    title: "New Expense",
    href: "/expenses/new",
    icon: AppWindow,
  },
  {
    title: "Bread Calculator",
    href: "/calculator",
    icon: Calculator,
  },
];

interface MobileSideMenuProps {
  children: React.ReactNode;
}

export const MobileSideMenu = ({ children }: MobileSideMenuProps) => {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();
  const [open, setOpen] = useState(false);

  const handleNavigation = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-[70%] p-0">
        <div className="flex flex-col h-full">
          {/* Profile Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/placeholder-avatar.png" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {profile?.user_metadata?.display_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavigation}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-border" />

            {/* Settings */}
            <div className="px-3">
              <Link
                href="/settings"
                onClick={handleNavigation}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                  pathname.startsWith("/settings")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Settings
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    pathname.startsWith("/settings")
                      ? "text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-medium">Settings</span>
              </Link>
            </div>
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
