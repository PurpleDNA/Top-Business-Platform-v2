"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  PackagePlus,
  BriefcaseBusiness,
  CircleDollarSign,
  UserPlus,
  AppWindow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const createItems = [
  {
    title: "New Sale",
    href: "/sale/new",
    icon: BriefcaseBusiness,
  },
  {
    title: "New Production",
    href: "/production/new",
    icon: PackagePlus,
  },
  {
    title: "New Payment",
    href: "/payment/new",
    icon: CircleDollarSign,
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
];

export const CreateFab = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide on login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Backdrop closes the menu when open. Sits below the FAB/pills. */}
      {open && (
        <div
          className="fixed inset-0 z-[44] bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/*
        Plain `fixed` positioning (no visualViewport listener) keeps the FAB
        pinned to the bottom-right of the layout viewport, so it does not jump
        above the mobile keyboard when an input is focused.
      */}
      <div className="fixed right-6 bottom-20 md:bottom-8 z-[45] flex flex-col-reverse items-end gap-3">
        {/* Trigger */}
        <button
          type="button"
          aria-label={open ? "Close create menu" : "Open create menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:bg-primary/90 active:scale-95"
        >
          <Plus
            className={cn(
              "h-7 w-7 transition-transform duration-200",
              open && "rotate-45",
            )}
          />
        </button>

        {/* Speed-dial action pills (rise above the trigger) */}
        {open &&
          createItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-full bg-background border border-border shadow-md pl-4 pr-2 py-2 text-foreground hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.title}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
              </Link>
            );
          })}
      </div>
    </>
  );
};
