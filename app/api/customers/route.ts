import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface Customer {
  id: string
  phone: string
  residence_number: string
  apartment_number: string
  created_at: string
  updated_at: string
}

interface AuthUser {
  id: string
  phone: string
  email: string
  email_confirmed_at: string
  phone_confirmed_at: string
  confirmed_at: string
  last_sign_in_at: string
  created_at: string
  updated_at: string
  is_anonymous: boolean
  raw_user_meta_data: any
}

interface EnhancedCustomer extends Customer {
  auth_user?: AuthUser
  auth_status: 'authenticated' | 'signup_incomplete' | 'no_auth'
  order_count: number
  total_spent: number
  last_order_date: string | null
  signup_issues: string[]
}

interface CreateCustomerData {
  phone: string
  residence_number: string
  apartment_number: string
}

export async function POST(request: NextRequest) {
  try {
    const customerData: CreateCustomerData = await request.json()

    // Validate required fields
    if (!customerData.phone || !customerData.residence_number || !customerData.apartment_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate phone number format (Moroccan format)
    const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/
    if (!phoneRegex.test(customerData.phone.replace(/\s/g, ""))) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Check if customer already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', customerData.phone)
      .single()

    if (existingCustomer) {
      return NextResponse.json({ error: "Customer with this phone number already exists" }, { status: 409 })
    }

    // Create new customer
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single()

    if (createError) {
      console.error("Error creating customer:", createError)
      return NextResponse.json({ error: "Failed to create customer account" }, { status: 500 })
    }

    console.log("New customer created by admin:", newCustomer)

    return NextResponse.json({
      success: true,
      customer: newCustomer,
      message: "Customer account created successfully",
    })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer account" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Fetch customers from the customers table
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (customersError) {
      console.error("Error fetching customers:", customersError)
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    // Fetch orders to calculate customer statistics
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
    }

    // Create a service role client to access auth.users (requires service key)
    const serviceSupabase = supabase

    // Note: In production, you would use the service role key to access auth.users
    // For now, we'll work with what we have and indicate auth status based on available data

    const enhancedCustomers: EnhancedCustomer[] = await Promise.all(
      customers.map(async (customer) => {
        // Calculate order statistics
        const customerOrders = orders?.filter(order => order.customer_phone === customer.phone) || []
        const completedOrders = customerOrders.filter(order => order.status === 'completed')
        
        const orderCount = customerOrders.length
        const totalSpent = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)
        const lastOrderDate = customerOrders.length > 0 
          ? customerOrders[0].created_at 
          : null

        // Determine auth status and identify signup issues
        const signupIssues: string[] = []
        let authStatus: 'authenticated' | 'signup_incomplete' | 'no_auth' = 'no_auth'

        // Check for common signup issues
        if (!customer.residence_number || customer.residence_number.trim() === '') {
          signupIssues.push('Missing residence number')
        }
        if (!customer.apartment_number || customer.apartment_number.trim() === '') {
          signupIssues.push('Missing apartment number')
        }

        // More sophisticated auth status detection
        const hasCompleteProfile = customer.residence_number && 
                                  customer.apartment_number && 
                                  customer.residence_number.trim() !== '' && 
                                  customer.apartment_number.trim() !== ''

        // Check if customer was created recently (likely through auth flow)
        const createdDate = new Date(customer.created_at)
        const isRecentlyCreated = (Date.now() - createdDate.getTime()) < (7 * 24 * 60 * 60 * 1000) // 7 days

        if (orderCount > 0) {
          // Has orders = definitely authenticated
          authStatus = 'authenticated'
        } else if (hasCompleteProfile && isRecentlyCreated) {
          // Has complete profile and was created recently = likely authenticated but no orders yet
          authStatus = 'authenticated'
        } else if (hasCompleteProfile) {
          // Has complete profile but old account = authenticated but inactive
          authStatus = 'authenticated'
        } else if (signupIssues.length > 0) {
          // Has profile but missing info = signup incomplete
          authStatus = 'signup_incomplete'
        } else {
          // Minimal profile or old incomplete signup
          authStatus = 'no_auth'
        }

        // Try to determine if user exists in auth.users table
        // Note: This is a simplified check - in production, you'd use service role to query auth.users
        let authUser: AuthUser | undefined = undefined
        
        // Additional heuristics for auth status
        if (authStatus === 'no_auth' && hasCompleteProfile) {
          // Customer has complete profile, likely went through auth flow
          authStatus = 'authenticated'
        }
        
        // If customer was created through the new auth flow (after Supabase integration)
        // and has any profile data, they likely completed authentication
        if (isRecentlyCreated && customer.phone) {
          authStatus = 'authenticated'
        }

        return {
          ...customer,
          auth_user: authUser,
          auth_status: authStatus,
          order_count: orderCount,
          total_spent: totalSpent,
          last_order_date: lastOrderDate,
          signup_issues: signupIssues,
        }
      })
    )

    // Get customers who have tried to signup but may have issues
    // This includes customers with incomplete profiles or no orders
    const problematicCustomers = enhancedCustomers.filter(customer => 
      customer.auth_status === 'signup_incomplete' || 
      (customer.auth_status === 'no_auth' && customer.order_count === 0)
    )

    // Get additional insights
    const totalCustomers = enhancedCustomers.length
    const authenticatedCustomers = enhancedCustomers.filter(c => c.auth_status === 'authenticated').length
    const customersWithIssues = problematicCustomers.length
    const totalOrders = orders?.length || 0
    const totalRevenue = enhancedCustomers.reduce((sum, customer) => sum + customer.total_spent, 0)

    // Get recent signup attempts (customers created recently but no orders)
    const recentSignups = enhancedCustomers.filter(customer => {
      const createdDate = new Date(customer.created_at)
      const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceCreation <= 7 && customer.order_count === 0
    })

    return NextResponse.json({
      success: true,
      customers: enhancedCustomers,
      analytics: {
        total_customers: totalCustomers,
        authenticated_customers: authenticatedCustomers,
        customers_with_issues: customersWithIssues,
        recent_signups: recentSignups.length,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
      },
      problematic_customers: problematicCustomers,
      recent_signups: recentSignups,
    })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers data" }, { status: 500 })
  }
}
