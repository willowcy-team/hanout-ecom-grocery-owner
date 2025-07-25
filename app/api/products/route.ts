import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category_id = searchParams.get("category_id")
    const subcategory_id = searchParams.get("subcategory_id")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")
    const trending = searchParams.get("trending")

    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .eq("available", true)

    if (category_id) {
      query = query.eq("category_id", category_id)
    }

    if (subcategory_id) {
      query = query.eq("subcategory_id", subcategory_id)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (featured === "true") {
      query = query.eq("featured", true)
    }

    if (trending === "true") {
      query = query.eq("trending", true)
    }

    query = query.order("created_at", { ascending: false })

    const { data: products, error } = await query

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error in products API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      price,
      description,
      image,
      category_id,
      subcategory_id,
      available,
      stock,
      featured,
      trending,
      discount,
    } = body

    if (!name || !price || !category_id || !subcategory_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          price: Number.parseFloat(price),
          description: description || "",
          image: image || "/placeholder.svg?height=200&width=200",
          category_id,
          subcategory_id,
          available: available !== false,
          stock: Number.parseInt(stock) || 0,
          featured: featured || false,
          trending: trending || false,
          discount: Number.parseInt(discount) || 0,
        },
      ])
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .single()

    if (error) {
      console.error("Error creating product:", error)
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in products POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get("ids")
    
    if (!ids) {
      return NextResponse.json({ error: "No product IDs provided" }, { status: 400 })
    }

    const productIds = ids.split(",")
    const results = []
    const errors = []

    for (const id of productIds) {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id)
        
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
        total: productIds.length,
        deleted: results.length,
        failed: errors.length
      }
    })
  } catch (error) {
    console.error("Error in products bulk DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
