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
  const { data: session, status } = useSession();

  const navItems = session ? [
    { href: "/admin", label: "Admin" },
    {
      href: "#",
      label: "Sign Out",
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ] : (
    pathname !== "/" ? [{ href: "/login", label: "Sign In" }] : []
  );

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="font-bold text-lg">
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
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-4">
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start"
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
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              onClick={item.onClick}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
