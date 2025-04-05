import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Fashion Equipment and Accessories",
  description:
    "Manage your tailoring materials and Fashion Equipment and Accessoriess",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          inter.className
        )}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div
              className="flex min-h-screen flex-col"
              suppressHydrationWarning
            >
              <Navbar />
              <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {children}
              </main>
              <Toaster
                position="top-right"
                toastOptions={{
                  className: "react-hot-toast",
                }}
              />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
