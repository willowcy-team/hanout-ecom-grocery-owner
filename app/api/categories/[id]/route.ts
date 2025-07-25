import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, icon, emoji } = body

    if (!name || !icon || !emoji) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        icon,
        emoji,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating category:", error)
      return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in category PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if category has subcategories
    const { data: subcategories } = await supabase.from("subcategories").select("id").eq("category_id", params.id)

    if (subcategories && subcategories.length > 0) {
      return NextResponse.json({ error: "Cannot delete category with existing subcategories" }, { status: 400 })
    }

    // Check if category has products
    const { data: products } = await supabase.from("products").select("id").eq("category_id", params.id)

    if (products && products.length > 0) {
      return NextResponse.json({ error: "Cannot delete category with existing products" }, { status: 400 })
    }

    const { error } = await supabase.from("categories").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting category:", error)
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in category DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
