"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
// import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function LoginPage() {
  // const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      window.location.href = "/admin";
    }
  }, [session]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
        return;
      }

      // Show success message
      toast.success("Signed in successfully");
      console.log("✅ Authentication successful, preparing to navigate...");
      console.log("Checking session before navigation...");
      const session = await fetch("/api/auth/session");
      console.log("Session data:", await session.json());

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // router.refresh();
      // router.push("/admin");
      window.location.href = "/admin";
    } catch (error) {
      console.error("❌ Sign-in error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 w-full bg-gradient-to-b from-background to-muted">
        <div className="container px-4 py-8 md:py-16 mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left side - Welcome Text */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                Welcome to Fashion Equipment and Accessories
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Your one-stop solution for managing transactions and generating
                receipts efficiently.
              </p>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full max-w-sm lg:max-w-md bg-card rounded-lg shadow-lg p-6 md:p-8">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold">Sign In</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your credentials to continue
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4" method="post">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    name="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      required
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Link href="/register" className="block">
                  <Button variant="outline" className="w-full">
                    Create an account
                  </Button>
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background py-6">
        <div className="container px-4 mx-auto text-center text-sm text-muted-foreground">
          <p>
            {" "}
            {new Date().getFullYear()} Fashion Equipment and Accessories. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
