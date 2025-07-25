"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, Eye, ImageIcon } from "lucide-react"
import Image from "next/image"
import { useProductImage } from "@/hooks/use-product-image"
import type { OrderItem } from "@/lib/supabase"

interface OrderItemsDisplayProps {
  items: OrderItem[]
  orderId: string
  maxDisplayItems?: number
  variant?: "default" | "minimal"
}

export function OrderItemsDisplay({ items, orderId, maxDisplayItems = 3, variant = "default" }: OrderItemsDisplayProps) {
  const [showAllItems, setShowAllItems] = useState(false)
  
  const displayItems = items.slice(0, maxDisplayItems)
  const remainingItemsCount = items.length - maxDisplayItems
  const hasMoreItems = remainingItemsCount > 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const getTotalQuantity = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalValue = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Shimmer effect component for loading states
  const ImageShimmer = () => (
    <div className="w-full h-full relative overflow-hidden bg-gray-100 rounded-lg">
      {/* Base shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
      
      {/* Animated shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )

  // Enhanced product item component with production-ready image loading
  const ProductItemWithImage = ({ item, index }: { item: OrderItem; index: number }) => {
    const { image: productImage, loading: imageLoading, error: imageError } = useProductImage(item.id)
    const [imageDisplayLoading, setImageDisplayLoading] = useState(true)
    const [imageDisplayError, setImageDisplayError] = useState(false)

    // Reset display states when product image changes
    useEffect(() => {
      if (productImage) {
        setImageDisplayLoading(true)
        setImageDisplayError(false)
      }
    }, [productImage])

    const handleImageLoad = () => {
      setImageDisplayLoading(false)
      setImageDisplayError(false)
    }

    const handleImageError = () => {
      setImageDisplayLoading(false)
      setImageDisplayError(true)
    }

    return (
      <div className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
        {/* Product Image */}
        <div className="flex-shrink-0 w-16 h-16 relative bg-gray-100 rounded-lg overflow-hidden border">
          {imageLoading ? (
            // Show shimmer while fetching product data
            <ImageShimmer />
          ) : productImage && !imageDisplayError ? (
            // Show actual image with loading state
            <>
              <Image
                src={productImage}
                alt={item.name}
                fill
                className={`object-cover transition-all duration-500 ${
                  imageDisplayLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                sizes="64px"
                priority={index < 3} // Prioritize first 3 images
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7kw2A3oy7c/L4/F/tM/9k="
              />
              {imageDisplayLoading && (
                <div className="absolute inset-0">
                  <ImageShimmer />
                </div>
              )}
            </>
          ) : (
            // Show fallback when no image or error
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ImageIcon className="h-4 w-4 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400 font-medium leading-none">
                {imageError ? "Error" : "No Image"}
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 leading-tight mb-1">{item.name}</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>
                  Quantity: <span className="font-medium text-gray-900">{item.quantity}</span>
                </span>
                <span>
                  Unit Price: <span className="font-medium text-gray-900">{formatPrice(item.price)} DH</span>
                </span>
              </div>
            </div>
            
            {/* Price and Total */}
            <div className="text-right ml-4">
              <Badge className="bg-orange-600 text-white mb-1">
                {formatPrice(item.price * item.quantity)} DH
              </Badge>
              <p className="text-xs text-gray-500">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Minimal variant for table display
  if (variant === "minimal") {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
          <Badge variant="outline" className="text-xs">
            {getTotalQuantity()} qty
          </Badge>
        </div>
        
        {/* First item name only, truncated */}
        <div className="text-xs text-gray-600 truncate max-w-32">
          {items[0]?.name}
          {items.length > 1 && ` +${items.length - 1} more`}
        </div>

        {/* View all button */}
        <Dialog open={showAllItems} onOpenChange={setShowAllItems}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 px-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 w-full justify-start"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Items
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-orange-600" />
                Order Items - #{orderId.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900">
                    {items.length} item{items.length !== 1 ? 's' : ''} • {getTotalQuantity()} total quantity
                  </p>
                  <p className="text-xs text-orange-700">
                    Total value: {formatPrice(getTotalValue())} DH
                  </p>
                </div>
              </div>

              {/* All items list with images */}
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <ProductItemWithImage key={index} item={item} index={index} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Default variant for detailed views
  return (
    <div className="space-y-2">
      {/* Display first few items */}
      <div className="space-y-1">
        {displayItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-gray-500 text-xs">
                {item.quantity}x @ {formatPrice(item.price)} DH
              </p>
            </div>
            <Badge variant="outline" className="ml-2 text-xs">
              {formatPrice(item.price * item.quantity)} DH
            </Badge>
          </div>
        ))}
      </div>

      {/* Show more button if there are more items */}
      {hasMoreItems && (
        <Dialog open={showAllItems} onOpenChange={setShowAllItems}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <Eye className="h-3 w-3 mr-1" />
              +{remainingItemsCount} more item{remainingItemsCount !== 1 ? 's' : ''}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-orange-600" />
                Order Items - #{orderId.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900">
                    {items.length} item{items.length !== 1 ? 's' : ''} • {getTotalQuantity()} total quantity
                  </p>
                  <p className="text-xs text-orange-700">
                    Total value: {formatPrice(getTotalValue())} DH
                  </p>
                </div>
              </div>

              {/* All items list with images */}
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <ProductItemWithImage key={index} item={item} index={index} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}