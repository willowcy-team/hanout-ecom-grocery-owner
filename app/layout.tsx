import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layouts/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { OrdersProvider } from "@/contexts/orders-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grocery Admin Dashboard",
  description: "Admin panel for grocery ordering system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OrdersProvider>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 lg:ml-0 ml-0 overflow-y-auto">
              {children}
            </main>
          </div>
        </OrdersProvider>
        <Toaster />
      </body>
    </html>
  );
}
