import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from("categories")
      .select(`
        *,
        subcategories (*)
      `)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error in categories API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, icon, emoji } = body

    if (!name || !icon || !emoji) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase.from("categories").insert([{ name, icon, emoji }]).select().single()

    if (error) {
      console.error("Error creating category:", error)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in categories POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get("ids")
    
    if (!ids) {
      return NextResponse.json({ error: "No category IDs provided" }, { status: 400 })
    }

    const categoryIds = ids.split(",")
    const results = []
    const errors = []

    for (const id of categoryIds) {
      try {
        // Check if category has subcategories
        const { data: subcategories } = await supabase.from("subcategories").select("id").eq("category_id", id)
        
        if (subcategories && subcategories.length > 0) {
          errors.push({ id, error: "Cannot delete category with existing subcategories" })
          continue
        }

        // Check if category has products
        const { data: products } = await supabase.from("products").select("id").eq("category_id", id)
        
        if (products && products.length > 0) {
          errors.push({ id, error: "Cannot delete category with existing products" })
          continue
        }

        const { error } = await supabase.from("categories").delete().eq("id", id)
        
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
        total: categoryIds.length,
        deleted: results.length,
        failed: errors.length
      }
    })
  } catch (error) {
    console.error("Error in categories bulk DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
