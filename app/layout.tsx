import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layouts/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { OrdersProvider } from "@/contexts/orders-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { NotificationBanner } from "@/components/ui/notification-banner";

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
          <SidebarProvider>
            <NotificationProvider>
              <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                  <div className="pt-16 lg:pt-0 h-full">
                    {children}
                  </div>
                </main>
              </div>
              <NotificationBanner />
            </NotificationProvider>
          </SidebarProvider>
        </OrdersProvider>
        <Toaster />
      </body>
    </html>
  );
}
