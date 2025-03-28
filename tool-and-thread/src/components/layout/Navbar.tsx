"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close the mobile menu when the path changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = session
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/transactions", label: "Transactions" },
        { href: "/admin/transactions/new", label: "New Transaction" },
        { href: "/settings", label: "Settings" },
        {
          href: "#",
          label: "Sign Out",
          onClick: () => signOut({ callbackUrl: "/" }),
        },
      ]
    : [];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center">
              <div className="mr-2 h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-500 font-serif">
                  T&T
                </span>
              </div>
              <span className="text-xl font-bold text-slate-800 font-serif tracking-tight">
                Tool & Thread
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.onClick}
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation */}
          {navItems.length > 0 && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-md"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white">
                <SheetHeader>
                  <SheetTitle className="font-serif text-xl text-slate-800">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-1 mt-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="w-full"
                      onClick={() => {
                        setIsOpen(false); // Add this to close the sheet
                        if (item.onClick) {
                          item.onClick(); // Remove the argument
                        }
                      }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50 h-14 text-base px-4"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
