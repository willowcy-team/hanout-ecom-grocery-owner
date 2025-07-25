import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const { data, error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", params.id).select().single()

    if (error) {
      console.error("Error updating order:", error)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in order PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("orders").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting order:", error)
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error in order DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
