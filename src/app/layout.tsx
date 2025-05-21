import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Transport Dashboard",
  description: "Modern transportation management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex flex-1 max-w-full overflow-hidden">
              <main className="flex-1 p-4 md:p-6 lg:p-8 w-full overflow-hidden">
                {children}
              </main>
            </div>
          </div>
          <Sonner />
        </AuthProvider>
      </body>
    </html>
  );
}
