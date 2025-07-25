"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { BulkActionsToolbar } from "@/components/ui/bulk-actions-toolbar";
import type { Product, Category, SubCategory } from "@/lib/supabase";
import Image from "next/image";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | null
  >(null);
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState<
    string | null
  >(null);

  // Delete and bulk actions state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category_id: "",
    subcategory_id: "",
    stock: "",
    available: true,
    featured: false,
    trending: false,
    discount: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
        fetchProducts(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const response = await fetch("/api/categories");
    if (response.ok) {
      const data = await response.json();
      setCategories(data);
    }
  };

  const fetchSubcategories = async () => {
    const response = await fetch("/api/subcategories");
    if (response.ok) {
      const data = await response.json();
      setSubcategories(data);
    }
  };

  const fetchProducts = async () => {
    const response = await fetch("/api/products");
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    }
  };

  const getFilteredProducts = () => {
    return products.filter((product) => {
      if (selectedSubcategoryFilter) {
        return product.subcategory_id === selectedSubcategoryFilter;
      }
      if (selectedCategoryFilter) {
        return product.category_id === selectedCategoryFilter;
      }
      return true;
    });
  };

  const addProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.category_id ||
      !newProduct.subcategory_id
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts((prev) => [...prev, data]);
        setNewProduct({
          name: "",
          price: "",
          description: "",
          image: "",
          category_id: "",
          subcategory_id: "",
          stock: "",
          available: true,
          featured: false,
          trending: false,
          discount: "",
        });
        setIsAddingProduct(false);
        toast({
          title: "Product added",
          description: `${data.name} has been added to your inventory.`,
        });
      } else {
        throw new Error("Failed to create product");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    }
  };

  const editProduct = async () => {
    if (
      !editingProduct ||
      !editingProduct.name ||
      !editingProduct.price ||
      !editingProduct.category_id ||
      !editingProduct.subcategory_id
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingProduct),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? data : p))
        );
        setEditingProduct(null);
        setIsEditingProduct(false);
        toast({
          title: "Product updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        throw new Error("Failed to update product");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  // Delete functions
  const handleDeleteProduct = (product: Product) => {
    setItemsToDelete([
      {
        id: product.id,
        name: product.name,
        type: "Product",
        // Products don't have dependencies, so they can always be deleted
      },
    ]);
    setShowDeleteDialog(true);
  };

  const handleBulkDeleteProducts = () => {
    const productsToDelete = products
      .filter((product) => selectedProducts.has(product.id))
      .map((product) => ({
        id: product.id,
        name: product.name,
        type: "Product",
      }));

    setItemsToDelete(productsToDelete);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const ids = itemsToDelete.map((item) => item.id).join(",");
      
      const response = await fetch(`/api/products?ids=${ids}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setProducts((prev) => prev.filter((product) => !itemsToDelete.some(item => item.id === product.id)));
        setSelectedProducts(new Set());

        toast({
          title: "Products deleted successfully",
          description: `${result.summary.deleted} product${result.summary.deleted > 1 ? 's' : ''} deleted successfully.`,
        });

        if (result.errors && result.errors.length > 0) {
          toast({
            title: "Some products could not be deleted",
            description: `${result.errors.length} products failed to delete.`,
            variant: "destructive",
          });
        }
      } else {
        throw new Error("Failed to delete products");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setItemsToDelete([]);
    }
  };

  // Selection functions
  const handleProductSelect = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    const filteredProducts = getFilteredProducts();
    setSelectedProducts(new Set(filteredProducts.map(product => product.id)));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  // Helper functions for bulk selection state
  const productBulkState = {
    allSelected: getFilteredProducts().length > 0 && 
                 getFilteredProducts().every(product => selectedProducts.has(product.id)),
    someSelected: getFilteredProducts().some(product => selectedProducts.has(product.id)) &&
                  !getFilteredProducts().every(product => selectedProducts.has(product.id)),
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-name">Product Name *</Label>
                  <Input
                    id="product-name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Fresh Apples"
                  />
                </div>
                <div>
                  <Label htmlFor="product-price">Price (DH) *</Label>
                  <Input
                    id="product-price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-category">Category *</Label>
                  <Select
                    value={newProduct.category_id}
                    onValueChange={(value) => {
                      setNewProduct((prev) => ({
                        ...prev,
                        category_id: value,
                        subcategory_id: "",
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.emoji} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product-subcategory">
                    Subcategory *
                  </Label>
                  <Select
                    value={newProduct.subcategory_id}
                    onValueChange={(value) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        subcategory_id: value,
                      }))
                    }
                    disabled={!newProduct.category_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories
                        .filter(
                          (sub) =>
                            sub.category_id === newProduct.category_id
                        )
                        .map((subcategory) => (
                          <SelectItem
                            key={subcategory.id}
                            value={subcategory.id}
                          >
                            {subcategory.emoji} {subcategory.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-stock">Stock Quantity</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        stock: e.target.value,
                      }))
                    }
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="product-discount">Discount (%)</Label>
                  <Input
                    id="product-discount"
                    type="number"
                    value={newProduct.discount}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        discount: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-image">Image URL</Label>
                <Input
                  id="product-image"
                  value={newProduct.image}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      image: e.target.value,
                    }))
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Product description..."
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="product-available"
                    checked={newProduct.available}
                    onCheckedChange={(checked) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        available: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="product-available">Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="product-featured"
                    checked={newProduct.featured}
                    onCheckedChange={(checked) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        featured: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="product-featured">Featured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="product-trending"
                    checked={newProduct.trending}
                    onCheckedChange={(checked) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        trending: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="product-trending">Trending</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={addProduct}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Add Product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingProduct(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product Filters */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Filter Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Category Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Filter by Category
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    selectedCategoryFilter === null
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setSelectedCategoryFilter(null);
                    setSelectedSubcategoryFilter(null);
                  }}
                  className={
                    selectedCategoryFilter === null
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-transparent border-orange-600 text-orange-600 hover:bg-orange-50"
                  }
                >
                  All Categories ({products.length})
                </Button>
                {categories.map((category) => {
                  const categoryProductCount = products.filter(
                    (p) => p.category_id === category.id
                  ).length;
                  const isSelected =
                    selectedCategoryFilter === category.id;

                  return (
                    <Button
                      key={category.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryFilter(category.id);
                        setSelectedSubcategoryFilter(null);
                      }}
                      className={
                        isSelected
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "bg-transparent border-orange-600 text-orange-600 hover:bg-orange-50"
                      }
                    >
                      {category.emoji} {category.name} (
                      {categoryProductCount})
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Subcategory Filter */}
            {selectedCategoryFilter && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Filter by Subcategory
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={
                      selectedSubcategoryFilter === null
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedSubcategoryFilter(null)}
                    className={
                      selectedSubcategoryFilter === null
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }
                  >
                    All Subcategories
                  </Button>
                  {subcategories
                    .filter(
                      (sub) => sub.category_id === selectedCategoryFilter
                    )
                    .map((subcategory) => {
                      const subcategoryProductCount = products.filter(
                        (p) => p.subcategory_id === subcategory.id
                      ).length;
                      const isSelected =
                        selectedSubcategoryFilter === subcategory.id;

                      return (
                        <Button
                          key={subcategory.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setSelectedSubcategoryFilter(subcategory.id)
                          }
                          className={
                            isSelected
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                          }
                        >
                          {subcategory.emoji} {subcategory.name} (
                          {subcategoryProductCount})
                        </Button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Filter Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-orange-200">
              <div className="text-sm text-orange-700">
                Showing {filteredProducts.length} of{" "}
                {products.length} products
              </div>
              {(selectedCategoryFilter || selectedSubcategoryFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategoryFilter(null);
                    setSelectedSubcategoryFilter(null);
                  }}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions for Products */}
      <BulkActionsToolbar
        selectedCount={selectedProducts.size}
        totalCount={filteredProducts.length}
        onSelectAll={selectAllProducts}
        onDeselectAll={deselectAllProducts}
        onDelete={handleBulkDeleteProducts}
        allSelected={productBulkState.allSelected}
        someSelected={productBulkState.someSelected}
      />

      {/* Products Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
              >
                {product.discount > 0 && (
                  <Badge className="absolute top-2 left-2 z-10 bg-red-500">
                    -{product.discount}%
                  </Badge>
                )}
                {product.featured && (
                  <Badge className="absolute top-2 right-2 z-10 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {product.trending && (
                  <Badge className="absolute top-2 right-2 z-10 bg-orange-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}

                <div className="relative overflow-hidden">
                  <Image
                    src={
                      product.image ||
                      "/placeholder.svg?height=150&width=200"
                    }
                    alt={product.name}
                    width={200}
                    height={150}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                </div>

                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 h-8 flex-1">
                        {product.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                        onClick={() =>
                          handleProductSelect(
                            product.id,
                            !selectedProducts.has(product.id)
                          )
                        }
                      >
                        {selectedProducts.has(product.id) ? (
                          <CheckSquare className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs">
                        {product.subcategory?.emoji}{" "}
                        {product.subcategory?.name}
                      </Badge>
                    </div>

                    <p className="text-gray-600 text-xs line-clamp-2 h-8">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.discount > 0 ? (
                          <>
                            <span className="text-sm font-bold text-orange-600">
                              {Math.round(
                                product.price *
                                  (1 - product.discount / 100)
                              )}{" "}
                              DH
                            </span>
                            <span className="text-xs text-gray-500 line-through">
                              {product.price} DH
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-orange-600">
                            {product.price} DH
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={
                          product.stock > 10 ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {product.stock}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Badge
                        variant={
                          product.available ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {product.available ? "Available" : "Unavailable"}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0 bg-transparent"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsEditingProduct(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 bg-transparent"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No products found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your filters or add new products
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditingProduct} onOpenChange={setIsEditingProduct}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-product-name">
                    Product Name *
                  </Label>
                  <Input
                    id="edit-product-name"
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    placeholder="e.g., Fresh Apples"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-product-price">Price (DH) *</Label>
                  <Input
                    id="edit-product-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              price: Number.parseFloat(e.target.value),
                            }
                          : null
                      )
                    }
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-product-category">
                    Category *
                  </Label>
                  <Select
                    value={editingProduct.category_id}
                    onValueChange={(value) => {
                      setEditingProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              category_id: value,
                              subcategory_id: "",
                            }
                          : null
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.emoji} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-product-subcategory">
                    Subcategory *
                  </Label>
                  <Select
                    value={editingProduct.subcategory_id}
                    onValueChange={(value) =>
                      setEditingProduct((prev) =>
                        prev ? { ...prev, subcategory_id: value } : null
                      )
                    }
                    disabled={!editingProduct.category_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories
                        .filter(
                          (sub) =>
                            sub.category_id === editingProduct.category_id
                        )
                        .map((subcategory) => (
                          <SelectItem
                            key={subcategory.id}
                            value={subcategory.id}
                          >
                            {subcategory.emoji} {subcategory.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-product-stock">
                    Stock Quantity
                  </Label>
                  <Input
                    id="edit-product-stock"
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              stock: Number.parseInt(e.target.value),
                            }
                          : null
                      )
                    }
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-product-discount">
                    Discount (%)
                  </Label>
                  <Input
                    id="edit-product-discount"
                    type="number"
                    value={editingProduct.discount}
                    onChange={(e) =>
                      setEditingProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              discount: Number.parseInt(e.target.value),
                            }
                          : null
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-product-image">Image URL</Label>
                <Input
                  id="edit-product-image"
                  value={editingProduct.image}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, image: e.target.value } : null
                    )
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="edit-product-description">
                  Description
                </Label>
                <Textarea
                  id="edit-product-description"
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev
                        ? { ...prev, description: e.target.value }
                        : null
                    )
                  }
                  placeholder="Product description..."
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-product-available"
                    checked={editingProduct.available}
                    onCheckedChange={(checked) =>
                      setEditingProduct((prev) =>
                        prev ? { ...prev, available: !!checked } : null
                      )
                    }
                  />
                  <Label htmlFor="edit-product-available">
                    Available
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-product-featured"
                    checked={editingProduct.featured}
                    onCheckedChange={(checked) =>
                      setEditingProduct((prev) =>
                        prev ? { ...prev, featured: !!checked } : null
                      )
                    }
                  />
                  <Label htmlFor="edit-product-featured">Featured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-product-trending"
                    checked={editingProduct.trending}
                    onCheckedChange={(checked) =>
                      setEditingProduct((prev) =>
                        prev ? { ...prev, trending: !!checked } : null
                      )
                    }
                  />
                  <Label htmlFor="edit-product-trending">Trending</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={editProduct}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Update Product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingProduct(false);
                    setEditingProduct(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        items={itemsToDelete}
        onConfirm={confirmDelete}
        loading={isDeleting}
        variant={itemsToDelete.length > 1 ? "bulk" : "single"}
      />
    </div>
  );
}