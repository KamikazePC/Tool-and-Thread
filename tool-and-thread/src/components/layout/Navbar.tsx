"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = session ? [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/transactions", label: "Transactions" },
    { href: "/admin/transactions/new", label: "New Transaction" },
    { href: "/settings", label: "Settings" },
    {
      href: "#",
      label: "Sign Out",
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ] : (
    pathname !== "/" ? [{ href: "/login", label: "Sign In" }] : []
  );

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/admin" className="font-serif font-bold text-xl text-slate-800 tracking-tight hover:text-primary-600 transition-colors">
          Tool & Thread
        </Link>

        {/* Mobile Menu */}
        {navItems.length > 0 && (
          <Sheet>
            <SheetTrigger asChild className="md:hidden ml-auto">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white">
              <SheetHeader>
                <SheetTitle className="font-serif text-xl text-slate-800">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-4">
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start font-medium text-slate-700 hover:text-primary-600"
                    onClick={item.onClick}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Desktop Menu */}
        <div className="hidden md:flex ml-auto space-x-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname?.startsWith(item.href));
            
            return (
              <Button
                key={item.href}
                variant="ghost"
                onClick={item.onClick}
                className={`font-medium ${isActive ? 'text-primary-600' : 'text-slate-700 hover:text-primary-600'}`}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
