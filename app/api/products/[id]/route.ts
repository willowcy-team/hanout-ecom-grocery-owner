import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching product:", error)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error in product GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      name,
      price,
      description,
      image,
      category_id,
      subcategory_id,
      stock,
      available,
      featured,
      trending,
      discount,
    } = body

    if (!name || !price || !category_id || !subcategory_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("products")
      .update({
        name,
        price: Number.parseFloat(price),
        description,
        image,
        category_id,
        subcategory_id,
        stock: stock ? Number.parseInt(stock) : 0,
        available: Boolean(available),
        featured: Boolean(featured),
        trending: Boolean(trending),
        discount: discount ? Number.parseInt(discount) : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in product PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("products").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting product:", error)
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in product DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
