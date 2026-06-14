/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  LoaderCircle,
  Plus,
  Search,
  User,
  UserRoundX,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DarkModeToggle } from "./DarkModeToggle";
import { useAuth } from "@/app/providers/auth-provider";
import { Bungee } from "next/font/google";
import { useState, useEffect } from "react";
import { Customer, searchCustomers } from "@/app/services/customers";
import { MobileSideMenu } from "./MobileSideMenu";

export const bungee = Bungee({
  subsets: ["latin"],
  variable: "--font-bungee",
  weight: ["400"],
});

export const DashboardHeader = ({ profile }: { profile: any }) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const pathname = usePathname();

  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchValue.length >= 3) {
        handleSearch(searchValue);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  const handleSearch = async (search: string) => {
    if (search.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const results = (await searchCustomers(search)) as Customer[];
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.log(error);
    } finally {
      setSearching(false);
    }
  };

  const handleCustomerClick = (customerId: string) => {
    router.push(`/customers/page/${customerId}`);
    setSearchValue("");
    setSearchResults([]);
    setShowResults(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowResults(false);
    };

    if (showResults) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showResults]);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background ${
        bungee.className
      } ${pathname === "/login" ? "hidden" : ""}`}
    >
      <div className="flex h-16 items-center justify-between px-6">
        <div
          className="flex items-center gap-4 cursor-pointer hover:scale-95 transition-all duration-200"
          onClick={() => router.push("/")}
        >
          <h1 className="text-xl font-semibold text-foreground ">
            Top Special
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="relative hidden md:block"
            onClick={(e) => e.stopPropagation()}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Search customers..."
              className="w-64 pl-10"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
            />
            {searching && (
              <LoaderCircle
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary"
              />
            )}

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full mt-2 w-full max-h-64 overflow-y-auto bg-background text-foreground border border-border rounded-md shadow-lg z-50">
                {searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleCustomerClick(customer.id)}
                        className="px-4 py-2 hover:bg-accent cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {customer.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {customer.phone_number}
                          </div>
                        </div>
                        {customer.has_debt && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Debt
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <UserRoundX size={18} />
                    No customers found
                  </div>
                )}
              </div>
            )}
          </div>

          <DarkModeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="relative hidden md:flex"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
              3
            </span>
          </Button>

          {/* Desktop Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full cursor-pointer hidden md:flex"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder-avatar.png" alt="User" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <MobileSideMenu>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </MobileSideMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
