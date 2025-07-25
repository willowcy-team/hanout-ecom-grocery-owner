"use client"

import type React from "react"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { usePathname } from "next/navigation"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: LayoutDashboard,
      current: pathname === '/'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ML</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin</h1>
              <p className="text-xs text-gray-500">Mol Lhanout</p>
            </div>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${item.current
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 transition-colors
                    ${item.current
                      ? 'text-orange-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                    }
                  `}
                />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6">
            <a
              href="http://localhost:3000"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              Back to Store
            </a>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {navigation.find(item => item.current)?.name || 'Admin Panel'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage your grocery store
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Admin User</span>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-medium text-sm">A</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  )
}