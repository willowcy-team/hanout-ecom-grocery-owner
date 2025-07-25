"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Users,
  Settings,
  Menu,
  X,
  TrendingUp,
  Bell,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePendingOrdersCount } from "@/contexts/orders-context";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    badge: true,
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
  },
  {
    name: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { pendingOrdersCount, isConnected, connectionStatus, reconnectAttempts } = usePendingOrdersCount();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Grocery Admin
                </h1>
                <p className="text-xs text-gray-500">Management Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-colors",
                      isActive
                        ? "text-orange-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  {item.name}
                  {item.badge && (
                    <div className="ml-auto flex items-center space-x-1">
                      {pendingOrdersCount > 0 && (
                        <Badge 
                          className={cn(
                            "text-xs animate-pulse",
                            pendingOrdersCount > 0 
                              ? "bg-orange-600 text-white" 
                              : "bg-gray-200 text-gray-600"
                          )}
                        >
                          {pendingOrdersCount}
                        </Badge>
                      )}
                      {/* Enhanced connection status indicator */}
                      <div 
                        className="w-2 h-2 rounded-full" 
                        title={
                          connectionStatus === 'connected' 
                            ? "Live updates connected" 
                            : connectionStatus === 'connecting'
                            ? `Connecting${reconnectAttempts > 0 ? ` (attempt ${reconnectAttempts})` : ''}`
                            : connectionStatus === 'error'
                            ? "Connection error - trying to reconnect"
                            : "Disconnected"
                        }
                      >
                        {connectionStatus === 'connected' ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        ) : connectionStatus === 'connecting' ? (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        ) : connectionStatus === 'error' ? (
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                        ) : (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Settings className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Admin User
                </p>
                <p className="text-xs text-gray-500 truncate">
                  admin@grocery.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}