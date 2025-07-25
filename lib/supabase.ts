import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database types
export interface Category {
  id: string
  name: string
  icon: string
  emoji: string
  created_at: string
  updated_at: string
}

export interface SubCategory {
  id: string
  name: string
  icon: string
  emoji: string
  category_id: string
  essential: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  category_id: string
  subcategory_id: string
  available: boolean
  stock: number
  featured: boolean
  trending: boolean
  discount: number
  created_at: string
  updated_at: string
  category?: Category
  subcategory?: SubCategory
}

export interface Order {
  id: string
  customer_phone: string
  customer_residence: string
  customer_apartment: string
  items: OrderItem[]
  total: number
  delivery_method: "delivery" | "pickup"
  status: "pending" | "in-progress" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
}

export interface Customer {
  id: string
  phone: string
  residence_number: string
  apartment_number: string
  created_at: string
  updated_at: string
}
