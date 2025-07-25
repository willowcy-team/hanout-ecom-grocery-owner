"use client";

import { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  Tags,
  Loader2,
  BarChart3,
  PieChart,
  Activity,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, SubCategory, Order } from "@/lib/supabase";

// Analytics Components
import RevenueTrendsChart from "@/components/analytics/revenue-trends-chart";
import OrderStatusChart from "@/components/analytics/order-status-chart";
import TopProductsChart from "@/components/analytics/top-products-chart";
import CategoryPerformanceChart from "@/components/analytics/category-performance-chart";
import CustomerBehaviorChart from "@/components/analytics/customer-behavior-chart";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBehaviorChart, setSelectedBehaviorChart] = useState<'hourly' | 'delivery-method' | 'order-size'>('hourly');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
        fetchProducts(),
        fetchOrders(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const response = await fetch("/api/categories");
    if (response.ok) {
      const data = await response.json();
      setCategories(data);
    }
  };

  const fetchSubcategories = async () => {
    const response = await fetch("/api/subcategories");
    if (response.ok) {
      const data = await response.json();
      setSubcategories(data);
    }
  };

  const fetchProducts = async () => {
    const response = await fetch("/api/products");
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    }
  };

  const fetchOrders = async () => {
    const response = await fetch("/api/orders");
    if (response.ok) {
      const data = await response.json();
      setOrders(data);
    }
  };

  const getOrderStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(
      (order) => new Date(order.created_at) >= today
    );
    const pendingOrders = orders.filter((order) => order.status === "pending");
    const totalRevenue = orders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + order.total, 0);

    return {
      todayOrders: todayOrders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue,
      totalProducts: products.length,
      totalCategories: categories.length,
    };
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in-progress":
        return <Truck className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Today's Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.todayOrders}</div>
            <p className="text-xs text-orange-600 mt-1">
              {stats.todayOrders > 0 ? '+' : ''}
              {((stats.todayOrders / Math.max(orders.length, 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Pending Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {stats.pendingOrders}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {stats.totalProducts}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Across {stats.totalCategories} categories
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Categories
            </CardTitle>
            <Tags className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {stats.totalCategories}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {subcategories.length} subcategories
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {stats.totalRevenue} DH
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Avg: {orders.length > 0 ? Math.round(stats.totalRevenue / orders.filter(o => o.status === 'completed').length || 1) : 0} DH/order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Revenue Trends */}
        <Card className="col-span-1 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
              Revenue & Order Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueTrendsChart orders={orders} days={14} />
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-blue-600" />
              Order Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusChart orders={orders} />
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Best Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart orders={orders} limit={8} />
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-600" />
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPerformanceChart 
              orders={orders} 
              categories={categories} 
              subcategories={subcategories}
              products={products}
            />
          </CardContent>
        </Card>

        {/* Customer Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                Customer Behavior
              </div>
              <div className="flex space-x-1">
                <Button
                  variant={selectedBehaviorChart === 'hourly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedBehaviorChart('hourly')}
                  className="text-xs"
                >
                  Hourly
                </Button>
                <Button
                  variant={selectedBehaviorChart === 'delivery-method' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedBehaviorChart('delivery-method')}
                  className="text-xs"
                >
                  Delivery
                </Button>
                <Button
                  variant={selectedBehaviorChart === 'order-size' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedBehaviorChart('order-size')}
                  className="text-xs"
                >
                  Size
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerBehaviorChart orders={orders} type={selectedBehaviorChart} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders - Compact Version */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Orders</span>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              {orders.slice(0, 5).length} most recent
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <div>
                    <p className="font-semibold text-sm">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {order.customer_phone} • {order.items.length} items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{order.total} DH</p>
                  <Badge className={getStatusColor(order.status)} variant="secondary">
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize text-xs">
                      {order.status}
                    </span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}