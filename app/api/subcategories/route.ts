import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: subcategories, error } = await supabase
      .from("subcategories")
      .select(`
        *,
        category:categories(*)
      `)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching subcategories:", error)
      return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 })
    }

    return NextResponse.json(subcategories)
  } catch (error) {
    console.error("Error in subcategories API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, icon, emoji, category_id, essential } = body

    if (!name || !icon || !emoji || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("subcategories")
      .insert([{ name, icon, emoji, category_id, essential: essential || false }])
      .select()
      .single()

    if (error) {
      console.error("Error creating subcategory:", error)
      return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in subcategories POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get("ids")
    
    if (!ids) {
      return NextResponse.json({ error: "No subcategory IDs provided" }, { status: 400 })
    }

    const subcategoryIds = ids.split(",")
    const results = []
    const errors = []

    for (const id of subcategoryIds) {
      try {
        // Check if subcategory has products
        const { data: products } = await supabase.from("products").select("id").eq("subcategory_id", id)
        
        if (products && products.length > 0) {
          errors.push({ id, error: "Cannot delete subcategory with existing products" })
          continue
        }

        const { error } = await supabase.from("subcategories").delete().eq("id", id)
        
        if (error) {
          errors.push({ id, error: error.message })
        } else {
          results.push({ id, success: true })
        }
      } catch (error) {
        errors.push({ id, error: "Internal server error" })
      }
    }

    return NextResponse.json({ 
      results, 
      errors,
      summary: {
        total: subcategoryIds.length,
        deleted: results.length,
        failed: errors.length
      }
    })
  } catch (error) {
    console.error("Error in subcategories bulk DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
