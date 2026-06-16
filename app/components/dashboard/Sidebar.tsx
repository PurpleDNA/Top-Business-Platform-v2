"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Users,
  Factory,
  BriefcaseBusiness,
  CircleDollarSign,
  Calculator,
  Home,
  AppWindow,
  PackagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
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
  // {
  //   title: "New Production",
  //   href: "/production/new",
  //   icon: PackagePlus,
  // },
  // {
  //   title: "New Sale",
  //   href: "/sale/new",
  //   icon: BriefcaseBusiness,
  // },
  // {
  //   title: "New Payment",
  //   href: "/payment/new",
  //   icon: CircleDollarSign,
  // },
  // {
  //   title: "New Customer",
  //   href: "/customers/new",
  //   icon: UserPlus,
  // },
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

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();

  // Hide sidebar on login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Sidebar for desktop only */}
      <aside
        className={cn(
          "hidden md:flex flex-col relative bg-background border-r border-border transition-all duration-300 z-30 h-full flex-shrink-0 pt-16 md:pt-20",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-16 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition z-50"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 pb-4">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex relative items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {item.title}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {/* Collapse/Expand Button */}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Top Business Platform
            </p>
          </div>
        )}
      </aside>

      {/* Spacer for content */}
      {/* <div
        className={cn(
          "hidden md:block transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      /> */}
    </>
  );
};
