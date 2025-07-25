"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  Package,
  Bell,
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Eye,
  AlertCircle,
  Users,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/contexts/orders-context";
import { OrderItemsDisplay } from "@/components/ui/order-items-display";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { OrderDateDisplay } from "@/components/ui/order-date-display";
import { OrderActions } from "@/components/ui/order-actions";
import type { Order } from "@/lib/supabase";

type SortField = "created_at" | "total" | "status" | "customer_phone";
type SortDirection = "asc" | "desc";

export default function OrdersPage() {
  const { 
    orders, 
    loading, 
    isConnected, 
    connectionStatus,
    reconnectAttempts,
    lastChangeTimestamp,
    lastHeartbeat,
    refreshOrders,
    manualReconnect,
    setOrders,
    newOrderIds,
    markOrderAsSeen
  } = useOrders();
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  
  // State for order details modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isViewingOrder, setIsViewingOrder] = useState(false);
  
  const { toast } = useToast();

  // Auto-mark new orders as seen after viewing them for a few seconds
  useEffect(() => {
    if (newOrderIds.size > 0) {
      const timer = setTimeout(() => {
        newOrderIds.forEach(orderId => {
          markOrderAsSeen(orderId);
        });
      }, 5000); // Auto-mark as seen after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [newOrderIds, markOrderAsSeen]);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_residence.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_apartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date range filter
    if (selectedDateRange !== "all") {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (selectedDateRange) {
        case "today":
          filtered = filtered.filter(order => 
            new Date(order.created_at) >= startOfDay
          );
          break;
        case "week":
          const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => 
            new Date(order.created_at) >= weekAgo
          );
          break;
        case "month":
          const monthAgo = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => 
            new Date(order.created_at) >= monthAgo
          );
          break;
      }
    }

    // Sort
    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [orders, searchTerm, statusFilter, sortField, sortDirection, selectedDateRange]);

  // Calculate statistics
  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      inProgress: orders.filter(o => o.status === "in-progress").length,
      completed: orders.filter(o => o.status === "completed").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      totalRevenue: orders
        .filter(o => o.status === "completed")
        .reduce((sum, order) => sum + order.total, 0),
      todayOrders: orders.filter(order => {
        const today = new Date();
        const orderDate = new Date(order.created_at);
        return orderDate.toDateString() === today.toDateString();
      }).length,
    };

    return stats;
  };

  const stats = getOrderStats();

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    // Optimistic update
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      )
    );
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Optimistic update
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const handleViewDetails = (order: Order) => {
    setViewingOrder(order);
    setIsViewingOrder(true);
    // Mark as seen when viewing details
    if (newOrderIds.has(order.id)) {
      markOrderAsSeen(order.id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-gray-600">Manage and track all customer orders</p>
            <Badge
              variant="outline"
              className={`${
                connectionStatus === 'connected'
                  ? "border-green-600 text-green-600" 
                  : connectionStatus === 'connecting'
                  ? "border-yellow-600 text-yellow-600"
                  : connectionStatus === 'error'
                  ? "border-orange-600 text-orange-600"
                  : "border-red-600 text-red-600"
              }`}
            >
              {connectionStatus === 'connected' ? (
                <Wifi className="h-3 w-3 mr-1" />
              ) : connectionStatus === 'connecting' ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : connectionStatus === 'error' ? (
                <WifiOff className="h-3 w-3 mr-1" />
              ) : (
                <WifiOff className="h-3 w-3 mr-1" />
              )}
              {connectionStatus === 'connected' 
                ? "Live Updates" 
                : connectionStatus === 'connecting'
                ? `Connecting${reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}`
                : connectionStatus === 'error'
                ? "Reconnecting..."
                : "Disconnected"}
            </Badge>
            {(lastChangeTimestamp || lastHeartbeat) && (
              <span className="text-xs text-gray-500">
                {lastChangeTimestamp 
                  ? `Last update: ${lastChangeTimestamp.toLocaleTimeString()}`
                  : lastHeartbeat 
                  ? `Heartbeat: ${lastHeartbeat.toLocaleTimeString()}`
                  : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshOrders}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {connectionStatus !== 'connected' && (
            <Button
              variant="outline"
              size="sm"
              onClick={manualReconnect}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.total}</div>
            <p className="text-xs text-orange-700">
              {stats.todayOrders} orders today
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
            <p className="text-xs text-yellow-700">
              {newOrderIds.size} new orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">In Progress</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.inProgress}</div>
            <p className="text-xs text-blue-700">Being prepared</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalRevenue)} DH</div>
            <p className="text-xs text-green-700">
              {stats.completed} completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-orange-600" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by phone, address, or items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quick Actions</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSelectedDateRange("all");
                  }}
                >
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                >
                  Show Pending
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-orange-600" />
              Orders ({filteredAndSortedOrders.length})
            </CardTitle>
            {newOrderIds.size > 0 && (
              <Badge className="bg-orange-600 text-white animate-pulse">
                {newOrderIds.size} New Order{newOrderIds.size !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No orders found</p>
              <p className="text-sm text-gray-400">
                {searchTerm || statusFilter !== "all" || selectedDateRange !== "all"
                  ? "Try adjusting your filters"
                  : "Orders will appear here when customers place them"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center">
                        Order & Date
                        {sortField === "created_at" && (
                          sortDirection === "asc" ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("customer_phone")}
                    >
                      <div className="flex items-center">
                        Customer
                        {sortField === "customer_phone" && (
                          sortDirection === "asc" ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-40">Items</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("total")}
                    >
                      <div className="flex items-center">
                        Total
                        {sortField === "total" && (
                          sortDirection === "asc" ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === "status" && (
                          sortDirection === "asc" ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => {
                    const isNewOrder = newOrderIds.has(order.id);
                    
                    return (
                      <TableRow 
                        key={order.id}
                        className={`${
                          isNewOrder 
                            ? "bg-orange-50 border-l-4 border-l-orange-500 hover:bg-orange-100" 
                            : "hover:bg-gray-50"
                        } transition-colors`}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                #{order.id.slice(0, 8)}
                              </code>
                              {isNewOrder && (
                                <Badge className="bg-orange-600 text-white text-xs animate-pulse">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <OrderDateDisplay 
                              createdAt={order.created_at}
                              updatedAt={order.updated_at}
                              showUpdated={order.created_at !== order.updated_at}
                            />
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1 text-gray-400" />
                              <span className="font-medium">{order.customer_phone}</span>
                            </div>
                            {(order.customer_residence || order.customer_apartment) && (
                              <p className="text-sm text-gray-500">
                                {order.customer_residence} {order.customer_apartment}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="w-60">
                          <OrderItemsDisplay 
                            items={order.items}
                            orderId={order.id}
                            variant="minimal"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              {formatCurrency(order.total)} DH
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              order.delivery_method === "delivery" 
                                ? "border-blue-200 text-blue-700" 
                                : "border-gray-200 text-gray-700"
                            }
                          >
                            {order.delivery_method === "delivery" ? (
                              <>
                                <Truck className="h-3 w-3 mr-1" />
                                Delivery
                              </>
                            ) : (
                              <>
                                <Package className="h-3 w-3 mr-1" />
                                Pickup
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        
                        <TableCell>
                          <OrderActions
                            order={order}
                            onStatusUpdate={handleStatusUpdate}
                            onViewDetails={handleViewDetails}
                            onDelete={handleDeleteOrder}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={isViewingOrder} onOpenChange={setIsViewingOrder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2 text-orange-600" />
              Order Details - #{viewingOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          
          {viewingOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Order ID</Label>
                      <p className="font-mono text-sm">{viewingOrder.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <div className="mt-1">
                        <OrderStatusBadge status={viewingOrder.status} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Delivery Method</Label>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {viewingOrder.delivery_method === "delivery" ? (
                            <>
                              <Truck className="h-3 w-3 mr-1" />
                              Delivery
                            </>
                          ) : (
                            <>
                              <Package className="h-3 w-3 mr-1" />
                              Pickup
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Order Date</Label>
                      <div className="mt-1">
                        <OrderDateDisplay 
                          createdAt={viewingOrder.created_at}
                          updatedAt={viewingOrder.updated_at}
                          showUpdated={true}
                          showRelative={false}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                      <p className="font-medium">{viewingOrder.customer_phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Residence</Label>
                      <p>{viewingOrder.customer_residence || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Apartment</Label>
                      <p>{viewingOrder.customer_apartment || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Full Address</Label>
                      <p className="text-sm text-gray-600">
                        {[viewingOrder.customer_residence, viewingOrder.customer_apartment]
                          .filter(Boolean)
                          .join(", ") || "No address provided"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderItemsDisplay 
                    items={viewingOrder.items}
                    orderId={viewingOrder.id}
                    variant="default"
                    maxDisplayItems={100} // Show all items in detail view
                  />
                  
                  {/* Order Total */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(viewingOrder.total)} DH
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}