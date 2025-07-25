"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  MoreHorizontal, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Trash2
} from "lucide-react"
import type { Order } from "@/lib/supabase"

interface OrderActionsProps {
  order: Order
  onStatusUpdate: (orderId: string, newStatus: Order["status"]) => void
  onViewDetails: (order: Order) => void
  onDelete?: (orderId: string) => void
}

export function OrderActions({ order, onStatusUpdate, onViewDetails, onDelete }: OrderActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleStatusUpdate = async (newStatus: Order["status"]) => {
    if (newStatus === order.status) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        onStatusUpdate(order.id, newStatus)
        toast({
          title: "Order Updated",
          description: `Order status changed to ${newStatus}`,
        })
      } else {
        throw new Error("Failed to update order")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDelete(order.id)
        toast({
          title: "Order Deleted",
          description: "Order has been permanently deleted",
        })
      } else {
        throw new Error("Failed to delete order")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setShowDeleteDialog(false)
    }
  }

  const getStatusActions = () => {
    const actions = []
    
    switch (order.status) {
      case "pending":
        actions.push(
          { label: "Mark In Progress", status: "in-progress" as const, icon: Package },
          { label: "Mark Completed", status: "completed" as const, icon: CheckCircle },
          { label: "Cancel Order", status: "cancelled" as const, icon: XCircle }
        )
        break
      case "in-progress":
        actions.push(
          { label: "Mark Completed", status: "completed" as const, icon: CheckCircle },
          { label: "Move to Pending", status: "pending" as const, icon: Clock },
          { label: "Cancel Order", status: "cancelled" as const, icon: XCircle }
        )
        break
      case "completed":
        actions.push(
          { label: "Reopen Order", status: "pending" as const, icon: Clock }
        )
        break
      case "cancelled":
        actions.push(
          { label: "Reopen Order", status: "pending" as const, icon: Clock }
        )
        break
    }
    
    return actions
  }

  const statusActions = getStatusActions()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            disabled={isUpdating}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onViewDetails(order)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          {statusActions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              {statusActions.map((action) => {
                const Icon = action.icon
                return (
                  <DropdownMenuItem
                    key={action.status}
                    onClick={() => handleStatusUpdate(action.status)}
                    className={
                      action.status === "cancelled" 
                        ? "text-red-600 focus:text-red-600" 
                        : action.status === "completed"
                        ? "text-green-600 focus:text-green-600"
                        : ""
                    }
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                )
              })}
            </>
          )}
          
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Order
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order #{order.id.slice(0, 8)}? 
              This action cannot be undone and will permanently remove the order 
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isUpdating}
            >
              {isUpdating ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}