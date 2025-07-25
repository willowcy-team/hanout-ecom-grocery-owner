"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react"

interface OrderStatusBadgeProps {
  status: "pending" | "in-progress" | "completed" | "cancelled"
  className?: string
}

export function OrderStatusBadge({ status, className = "" }: OrderStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          icon: Clock,
          className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
        }
      case "in-progress":
        return {
          label: "In Progress",
          icon: Package,
          className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
        }
      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
        }
      case "cancelled":
        return {
          label: "Cancelled",
          icon: XCircle,
          className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
        }
      default:
        return {
          label: "Unknown",
          icon: Clock,
          className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Badge 
      variant="outline" 
      className={`inline-flex items-center gap-1.5 font-medium transition-colors ${config.className} ${className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}