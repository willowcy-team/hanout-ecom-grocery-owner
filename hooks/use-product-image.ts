"use client"

import { useState, useEffect } from 'react'

interface Product {
  id: string
  image: string
  name: string
}

// Cache for product images to avoid repeated API calls
const productImageCache = new Map<string, string>()
const productFetchCache = new Set<string>()

export function useProductImage(productId: string) {
  const [image, setImage] = useState<string | null>(productImageCache.get(productId) || null)
  const [loading, setLoading] = useState(!productImageCache.has(productId))
  const [error, setError] = useState(false)

  useEffect(() => {
    // Skip if no productId provided
    if (!productId) {
      setLoading(false)
      setError(true)
      return
    }

    // Return early if already cached
    if (productImageCache.has(productId)) {
      const cachedImage = productImageCache.get(productId)
      setImage(cachedImage || null)
      setLoading(false)
      setError(false)
      return
    }

    // Return early if already fetching this product
    if (productFetchCache.has(productId)) {
      return
    }

    const fetchProductImage = async () => {
      setLoading(true)
      setError(false)
      productFetchCache.add(productId)

      try {
        // Add timeout for production reliability
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(`/api/products/${productId}`, {
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const product: Product = await response.json()
          const productImage = product.image || '/placeholder.svg?height=150&width=200'
          
          // Cache the result
          productImageCache.set(productId, productImage)
          setImage(productImage)
          setError(false)
        } else if (response.status === 404) {
          // Product not found - cache placeholder to avoid refetching
          const placeholderImage = '/placeholder.svg?height=150&width=200'
          productImageCache.set(productId, placeholderImage)
          setImage(placeholderImage)
          setError(false) // Not really an error, just no product found
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (err) {
        console.error(`Error fetching product image for ID ${productId}:`, err)
        setError(true)
        
        // Cache fallback image to avoid refetching failed requests
        const fallbackImage = '/placeholder.svg?height=150&width=200'
        productImageCache.set(productId, fallbackImage)
        setImage(fallbackImage)
      } finally {
        setLoading(false)
        productFetchCache.delete(productId)
      }
    }

    // Add a small delay to avoid overwhelming the API with concurrent requests
    const timeoutId = setTimeout(fetchProductImage, Math.random() * 100)
    
    return () => {
      clearTimeout(timeoutId)
      productFetchCache.delete(productId)
    }
  }, [productId])

  return { image, loading, error }
}

// Batch fetch multiple product images - optimized for production
export function useBatchProductImages(productIds: string[]) {
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (productIds.length === 0) {
      setLoading(false)
      return
    }

    // Filter out already cached products and invalid IDs
    const validIds = productIds.filter(id => id && typeof id === 'string')
    const uncachedIds = validIds.filter(id => !productImageCache.has(id))
    
    if (uncachedIds.length === 0) {
      // All images are cached
      const cachedImages: Record<string, string> = {}
      validIds.forEach(id => {
        cachedImages[id] = productImageCache.get(id) || '/placeholder.svg?height=150&width=200'
      })
      setImages(cachedImages)
      setLoading(false)
      return
    }

    const fetchBatchImages = async () => {
      setLoading(true)
      const newErrors = new Set<string>()

      try {
        // Use Promise.allSettled for better error handling
        const fetchPromises = uncachedIds.map(async (id) => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout per image

            const response = await fetch(`/api/products/${id}`, {
              signal: controller.signal,
            })
            
            clearTimeout(timeoutId)

            if (response.ok) {
              const product: Product = await response.json()
              const productImage = product.image || '/placeholder.svg?height=150&width=200'
              productImageCache.set(id, productImage)
              return { id, image: productImage, success: true }
            } else {
              throw new Error(`HTTP ${response.status}`)
            }
          } catch (err) {
            console.error(`Error fetching product ${id}:`, err)
            newErrors.add(id)
            const fallbackImage = '/placeholder.svg?height=150&width=200'
            productImageCache.set(id, fallbackImage)
            return { id, image: fallbackImage, success: false }
          }
        })

        const results = await Promise.allSettled(fetchPromises)
        
        // Create image mapping from results
        const imageMap: Record<string, string> = {}
        
        // Include cached images
        validIds.forEach(id => {
          if (productImageCache.has(id)) {
            imageMap[id] = productImageCache.get(id)!
          }
        })

        // Add fetched images
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            imageMap[result.value.id] = result.value.image
          }
        })

        setImages(imageMap)
        setErrors(newErrors)
      } catch (err) {
        console.error('Error in batch fetch:', err)
        // Set fallback images for all
        const fallbackImages: Record<string, string> = {}
        validIds.forEach(id => {
          const fallbackImage = '/placeholder.svg?height=150&width=200'
          fallbackImages[id] = fallbackImage
          productImageCache.set(id, fallbackImage)
          newErrors.add(id)
        })
        setImages(fallbackImages)
        setErrors(newErrors)
      } finally {
        setLoading(false)
      }
    }

    fetchBatchImages()
  }, [productIds.join(',')])

  return { images, loading, errors }
}