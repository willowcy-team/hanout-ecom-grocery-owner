"use client";

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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePendingOrdersCount } from "@/contexts/orders-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationSettings } from "@/components/ui/notification-settings";

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

// Navigation item component for better organization
function NavigationItem({ item, isActive, isCollapsed, onClick }: {
  item: typeof navigation[0]
  isActive: boolean
  isCollapsed: boolean
  onClick: () => void
}) {
  const { pendingOrdersCount, connectionStatus, reconnectAttempts } = usePendingOrdersCount();

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive
          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      )}
    >
      <item.icon
        className={cn(
          "flex-shrink-0 h-5 w-5 transition-colors",
          isCollapsed ? "mr-0" : "mr-3",
          isActive
            ? "text-white"
            : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      
      {!isCollapsed && (
        <>
          <span className="truncate">{item.name}</span>
          {item.badge && (
            <div className="ml-auto flex items-center space-x-2">
              {pendingOrdersCount > 0 && (
                <Badge 
                  className={cn(
                    "text-xs font-semibold",
                    isActive
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-orange-600 text-white animate-pulse"
                  )}
                >
                  {pendingOrdersCount}
                </Badge>
              )}
              {/* Connection status indicator */}
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
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                ) : connectionStatus === 'connecting' ? (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                ) : connectionStatus === 'error' ? (
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                ) : (
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Link>
  );

  // Wrap in tooltip when collapsed
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.name}
          {item.badge && pendingOrdersCount > 0 && (
            <Badge className="bg-orange-600 text-white text-xs">
              {pendingOrdersCount}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapsed, toggleMobile, closeMobile } = useSidebar();
  const { pendingOrdersCount } = usePendingOrdersCount();

  return (
    <TooltipProvider delayDuration={300}>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobile}
          className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200/50 hover:bg-white"
        >
          {isMobileOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>


      {/* Mobile menu overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-white/95 backdrop-blur-md border-r border-gray-200/50 shadow-xl transform transition-all duration-300 ease-out lg:static lg:inset-0",
          // Mobile behavior
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop behavior
          isCollapsed ? "lg:w-20" : "lg:w-72",
          // Always full width on mobile
          "w-72"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between border-b border-gray-200/50 transition-all duration-300",
            isCollapsed ? "p-4" : "p-6"
          )}>
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    Grocery Admin
                  </h1>
                  <p className="text-xs text-gray-500 truncate">
                    Management Dashboard
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
            isCollapsed ? "px-3" : "px-4"
          )}>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <NavigationItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  onClick={closeMobile}
                />
              );
            })}
          </nav>

          {/* Footer */}
          <div className={cn(
            "border-t border-gray-200/50 transition-all duration-300",
            isCollapsed ? "p-3" : "p-4"
          )}>
            {/* Orders indicator for collapsed version */}
            {isCollapsed && pendingOrdersCount > 0 && (
              <div className="mb-3 flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/orders" className="relative cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-pulse hover:scale-110 transition-transform duration-1000">
                        <ShoppingCart className="h-4 w-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{pendingOrdersCount}</span>
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{pendingOrdersCount} pending order{pendingOrdersCount !== 1 ? 's' : ''} - Click to view</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Admin user section */}
            <div className={cn(
              "flex items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl transition-all duration-300 hover:from-gray-100 hover:to-gray-150",
              isCollapsed ? "justify-center" : "space-x-3"
            )}>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    admin@grocery.com
                  </p>
                </div>
              )}
            </div>

            {/* Notification settings and toggle buttons */}
            <div className="hidden lg:flex justify-center items-center gap-2 mt-3">
              {!isCollapsed && (
                <NotificationSettings />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleCollapsed}
                className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200/50 hover:bg-white transition-all duration-200"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}