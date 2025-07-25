import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_phone, customer_residence, customer_apartment, items, total, delivery_method } = body

    console.log("Received order data:", body)

    if (!customer_phone || !items || items.length === 0 || !total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (delivery_method === "delivery" && (!customer_residence || !customer_apartment)) {
      return NextResponse.json({ error: "Delivery address is required for delivery orders" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_phone,
          customer_residence: customer_residence || "",
          customer_apartment: customer_apartment || "",
          items,
          total: Number.parseFloat(total),
          delivery_method: delivery_method || "delivery",
          status: "pending",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error creating order:", error)
      return NextResponse.json({ error: "Failed to create order: " + error.message }, { status: 500 })
    }

    console.log("Order created successfully:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in orders POST:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
