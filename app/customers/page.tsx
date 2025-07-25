"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Phone,
  MapPin,
  Calendar,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  UserCheck,
  UserX,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface EnhancedCustomer {
  id: string;
  phone: string;
  residence_number: string;
  apartment_number: string;
  created_at: string;
  updated_at: string;
  auth_status: 'authenticated' | 'signup_incomplete' | 'no_auth';
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
  signup_issues: string[];
}

interface CustomerAnalytics {
  total_customers: number;
  authenticated_customers: number;
  customers_with_issues: number;
  recent_signups: number;
  total_orders: number;
  total_revenue: number;
}

interface CustomersData {
  success: boolean;
  customers: EnhancedCustomer[];
  analytics: CustomerAnalytics;
  problematic_customers: EnhancedCustomer[];
  recent_signups: EnhancedCustomer[];
}

export default function CustomersPage() {
  const [customersData, setCustomersData] = useState<CustomersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomersData();
  }, []);

  const fetchCustomersData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomersData(data);
      } else {
        throw new Error("Failed to fetch customers data");
      }
    } catch (error) {
      console.error("Error fetching customers data:", error);
      toast({
        title: "Error",
        description: "Failed to load customers data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAuthStatusBadge = (status: string) => {
    switch (status) {
      case 'authenticated':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Authenticated</Badge>;
      case 'signup_incomplete':
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Incomplete</Badge>;
      case 'no_auth':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />No Auth</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getFilteredCustomers = () => {
    if (!customersData) return [];
    
    let customers = customersData.customers;
    
    // Filter by tab
    switch (activeTab) {
      case 'authenticated':
        customers = customers.filter(c => c.auth_status === 'authenticated');
        break;
      case 'issues':
        customers = customersData.problematic_customers;
        break;
      case 'recent':
        customers = customersData.recent_signups;
        break;
      default:
        customers = customersData.customers;
    }
    
    // Filter by search term
    return customers.filter(customer =>
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.residence_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.apartment_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredCustomers = getFilteredCustomers();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!customersData) {
    return <div className="p-6">No data available</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">View and manage your customer base with detailed analytics</p>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersData.analytics.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              Registered in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authenticated</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{customersData.analytics.authenticated_customers}</div>
            <p className="text-xs text-muted-foreground">
              Successfully verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{customersData.analytics.customers_with_issues}</div>
            <p className="text-xs text-muted-foreground">
              Signup problems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{customersData.analytics.recent_signups}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by phone number, residence, or apartment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Tabbed Customer Views */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Customers ({customersData.customers.length})</TabsTrigger>
              <TabsTrigger value="authenticated">Authenticated ({customersData.analytics.authenticated_customers})</TabsTrigger>
              <TabsTrigger value="issues">With Issues ({customersData.analytics.customers_with_issues})</TabsTrigger>
              <TabsTrigger value="recent">Recent Signups ({customersData.analytics.recent_signups})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <CustomersTable customers={filteredCustomers} />
            </TabsContent>
            
            <TabsContent value="authenticated" className="mt-6">
              <CustomersTable customers={filteredCustomers} />
            </TabsContent>
            
            <TabsContent value="issues" className="mt-6">
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    These customers have tried to sign up but encountered issues during the process.
                  </p>
                </div>
              </div>
              <CustomersTable customers={filteredCustomers} />
            </TabsContent>
            
            <TabsContent value="recent" className="mt-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-800">
                    Customers who registered in the last 7 days but haven't placed any orders yet.
                  </p>
                </div>
              </div>
              <CustomersTable customers={filteredCustomers} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  function CustomersTable({ customers }: { customers: EnhancedCustomer[] }) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Auth Status</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead>Customer Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getAuthStatusBadge(customer.auth_status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm">{customer.residence_number || 'N/A'}</p>
                      <p className="text-xs text-gray-500">Apt: {customer.apartment_number || 'N/A'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-semibold">
                    {customer.order_count} orders
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  {customer.total_spent.toFixed(2)} DH
                </TableCell>
                <TableCell>
                  {customer.last_order_date ? (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm">
                          {new Date(customer.last_order_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(customer.last_order_date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.signup_issues.length > 0 ? (
                    <div className="space-y-1">
                      {customer.signup_issues.map((issue, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {customers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No customers found</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? "Try adjusting your search" : "Customers will appear here based on the selected filter"}
            </p>
          </div>
        )}
      </div>
    );
  }
}