import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, icon, emoji, category_id, essential } = body

    if (!name || !icon || !emoji || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("subcategories")
      .update({
        name,
        icon,
        emoji,
        category_id,
        essential: Boolean(essential),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error("Error updating subcategory:", error)
      return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in subcategory PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if subcategory has products
    const { data: products } = await supabase.from("products").select("id").eq("subcategory_id", params.id)

    if (products && products.length > 0) {
      return NextResponse.json({ error: "Cannot delete subcategory with existing products" }, { status: 400 })
    }

    const { error } = await supabase.from("subcategories").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting subcategory:", error)
      return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in subcategory DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
