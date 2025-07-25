"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Tags,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [selectedCategoryForManagement, setSelectedCategoryForManagement] =
    useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] =
    useState<SubCategory | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingSubcategory, setIsEditingSubcategory] = useState(false);

  // Delete and bulk actions state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<any[]>([]);
  const [deleteType, setDeleteType] = useState<'category' | 'subcategory'>('category');
  const [isDeleting, setIsDeleting] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "",
    emoji: "",
  });

  const [newSubcategory, setNewSubcategory] = useState({
    name: "",
    icon: "",
    emoji: "",
    category_id: "",
    essential: false,
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

  const addCategory = async () => {
    if (!newCategory.name || !newCategory.icon || !newCategory.emoji) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      });

      if (response.ok) {
        const data = await response.json();
        setCategories((prev) => [...prev, data]);
        setNewCategory({ name: "", icon: "", emoji: "" });
        setIsAddingCategory(false);
        toast({
          title: "Category added",
          description: `${data.name} has been added successfully.`,
        });
      } else {
        throw new Error("Failed to create category");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const addSubcategory = async () => {
    if (
      !newSubcategory.name ||
      !newSubcategory.icon ||
      !newSubcategory.emoji ||
      !newSubcategory.category_id
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/subcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSubcategory),
      });

      if (response.ok) {
        const data = await response.json();
        setSubcategories((prev) => [...prev, data]);
        setNewSubcategory({
          name: "",
          icon: "",
          emoji: "",
          category_id: "",
          essential: false,
        });
        setIsAddingSubcategory(false);
        toast({
          title: "Subcategory added",
          description: `${data.name} has been added successfully.`,
        });
      } else {
        throw new Error("Failed to create subcategory");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subcategory",
        variant: "destructive",
      });
    }
  };

  const editCategory = async () => {
    if (
      !editingCategory ||
      !editingCategory.name ||
      !editingCategory.icon ||
      !editingCategory.emoji
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingCategory),
      });

      if (response.ok) {
        const data = await response.json();
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? data : c))
        );
        setEditingCategory(null);
        setIsEditingCategory(false);
        toast({
          title: "Category updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        throw new Error("Failed to update category");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const editSubcategory = async () => {
    if (
      !editingSubcategory ||
      !editingSubcategory.name ||
      !editingSubcategory.icon ||
      !editingSubcategory.emoji ||
      !editingSubcategory.category_id
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/subcategories/${editingSubcategory.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingSubcategory),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubcategories((prev) =>
          prev.map((s) => (s.id === editingSubcategory.id ? data : s))
        );
        setEditingSubcategory(null);
        setIsEditingSubcategory(false);
        toast({
          title: "Subcategory updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        throw new Error("Failed to update subcategory");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subcategory",
        variant: "destructive",
      });
    }
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600">Organize your products with categories and subcategories</p>
        </div>
        <div className="flex space-x-2">
          <Dialog
            open={isAddingCategory}
            onOpenChange={setIsAddingCategory}
          >
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Name *</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Produits Alimentaires"
                  />
                </div>
                <div>
                  <Label htmlFor="category-icon">Icon *</Label>
                  <Input
                    id="category-icon"
                    value={newCategory.icon}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        icon: e.target.value,
                      }))
                    }
                    placeholder="e.g., ShoppingCart"
                  />
                </div>
                <div>
                  <Label htmlFor="category-emoji">Emoji *</Label>
                  <Input
                    id="category-emoji"
                    value={newCategory.emoji}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        emoji: e.target.value,
                      }))
                    }
                    placeholder="e.g., 🛒"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={addCategory}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    Add Category
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingCategory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Selection Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Categories ({categories.length})</span>
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-600"
            >
              Select a category to manage subcategories
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => {
              const categorySubcategories = subcategories.filter(
                (sub) => sub.category_id === category.id
              );
              const isSelected =
                selectedCategoryForManagement === category.id;

              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    isSelected
                      ? "border-orange-500 bg-orange-50 shadow-md scale-105"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                  onClick={() =>
                    setSelectedCategoryForManagement(
                      isSelected ? null : category.id
                    )
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          isSelected ? "bg-orange-100" : "bg-gray-100"
                        }`}
                      >
                        {category.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-sm leading-tight ${
                            isSelected
                              ? "text-orange-800"
                              : "text-gray-900"
                          }`}
                        >
                          {category.name}
                        </h3>
                        <p
                          className={`text-xs mt-1 ${
                            isSelected
                              ? "text-orange-600"
                              : "text-gray-500"
                          }`}
                        >
                          {categorySubcategories.length} subcategories
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          isSelected
                            ? "border-orange-400 text-orange-700 bg-orange-100"
                            : "border-gray-300 text-gray-600"
                        }`}
                      >
                        {category.icon}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${
                            isSelected
                              ? "hover:bg-orange-200"
                              : "hover:bg-gray-200"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                            setIsEditingCategory(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 text-red-500 ${
                            isSelected
                              ? "hover:bg-red-100"
                              : "hover:bg-red-50"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete category
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subcategories Management */}
      {selectedCategoryForManagement && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
                  {
                    categories.find(
                      (c) => c.id === selectedCategoryForManagement
                    )?.emoji
                  }
                </div>
                <div>
                  <CardTitle className="text-orange-800">
                    {
                      categories.find(
                        (c) => c.id === selectedCategoryForManagement
                      )?.name
                    }{" "}
                    Subcategories
                  </CardTitle>
                  <p className="text-sm text-orange-600 mt-1">
                    Manage subcategories for this category
                  </p>
                </div>
              </div>
              <Dialog
                open={isAddingSubcategory}
                onOpenChange={setIsAddingSubcategory}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-orange-600 text-orange-600 hover:bg-orange-100 bg-white"
                    onClick={() =>
                      setNewSubcategory((prev) => ({
                        ...prev,
                        category_id: selectedCategoryForManagement || "",
                      }))
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subcategory</DialogTitle>
                    <p className="text-sm text-gray-600">
                      Adding to:{" "}
                      {
                        categories.find(
                          (c) => c.id === selectedCategoryForManagement
                        )?.name
                      }
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subcategory-name">Name *</Label>
                      <Input
                        id="subcategory-name"
                        value={newSubcategory.name}
                        onChange={(e) =>
                          setNewSubcategory((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="e.g., Produits Laitiers"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subcategory-icon">Icon *</Label>
                      <Input
                        id="subcategory-icon"
                        value={newSubcategory.icon}
                        onChange={(e) =>
                          setNewSubcategory((prev) => ({
                            ...prev,
                            icon: e.target.value,
                          }))
                        }
                        placeholder="e.g., Milk"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subcategory-emoji">Emoji *</Label>
                      <Input
                        id="subcategory-emoji"
                        value={newSubcategory.emoji}
                        onChange={(e) =>
                          setNewSubcategory((prev) => ({
                            ...prev,
                            emoji: e.target.value,
                          }))
                        }
                        placeholder="e.g., 🧀"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="subcategory-essential"
                        checked={newSubcategory.essential}
                        onCheckedChange={(checked) =>
                          setNewSubcategory((prev) => ({
                            ...prev,
                            essential: !!checked,
                          }))
                        }
                      />
                      <Label htmlFor="subcategory-essential">
                        Essential (appears in Indispensables)
                      </Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={addSubcategory}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        Add Subcategory
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingSubcategory(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories
                .filter(
                  (sub) =>
                    sub.category_id === selectedCategoryForManagement
                )
                .map((subcategory) => {
                  const productCount = products.filter(
                    (p) => p.subcategory_id === subcategory.id
                  ).length;

                  return (
                    <Card
                      key={subcategory.id}
                      className="border hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                              {subcategory.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm leading-tight text-gray-900">
                                {subcategory.name}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {subcategory.icon}
                                </Badge>
                                {subcategory.essential && (
                                  <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                    Essential
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-gray-200"
                              onClick={() => {
                                setEditingSubcategory(subcategory);
                                setIsEditingSubcategory(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{productCount} products</span>
                          <span>
                            Created{" "}
                            {new Date(
                              subcategory.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {subcategories.filter(
                (sub) => sub.category_id === selectedCategoryForManagement
              ).length === 0 && (
                <div className="col-span-full text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Tags className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">
                    No subcategories yet
                  </p>
                  <Button
                    variant="outline"
                    className="border-orange-600 text-orange-600 hover:bg-orange-50 bg-transparent"
                    onClick={() => {
                      setNewSubcategory((prev) => ({
                        ...prev,
                        category_id: selectedCategoryForManagement || "",
                      }));
                      setIsAddingSubcategory(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Subcategory
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      {!selectedCategoryForManagement && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Tags className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">
                  How to manage categories
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • Click on a category card above to view and manage
                    its subcategories
                  </li>
                  <li>
                    • Use "Add Category" to create new main categories
                  </li>
                  <li>
                    • Essential subcategories appear in the
                    "Indispensables" section on the main site
                  </li>
                  <li>
                    • Each category can have multiple subcategories to
                    organize products better
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditingCategory} onOpenChange={setIsEditingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category-name">Name *</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder="e.g., Produits Alimentaires"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-icon">Icon *</Label>
                <Input
                  id="edit-category-icon"
                  value={editingCategory.icon}
                  onChange={(e) =>
                    setEditingCategory((prev) =>
                      prev ? { ...prev, icon: e.target.value } : null
                    )
                  }
                  placeholder="e.g., ShoppingCart"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-emoji">Emoji *</Label>
                <Input
                  id="edit-category-emoji"
                  value={editingCategory.emoji}
                  onChange={(e) =>
                    setEditingCategory((prev) =>
                      prev ? { ...prev, emoji: e.target.value } : null
                    )
                  }
                  placeholder="e.g., 🛒"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={editCategory}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Update Category
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingCategory(false);
                    setEditingCategory(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog
        open={isEditingSubcategory}
        onOpenChange={setIsEditingSubcategory}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          {editingSubcategory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-subcategory-name">Name *</Label>
                <Input
                  id="edit-subcategory-name"
                  value={editingSubcategory.name}
                  onChange={(e) =>
                    setEditingSubcategory((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder="e.g., Produits Laitiers"
                />
              </div>
              <div>
                <Label htmlFor="edit-subcategory-icon">Icon *</Label>
                <Input
                  id="edit-subcategory-icon"
                  value={editingSubcategory.icon}
                  onChange={(e) =>
                    setEditingSubcategory((prev) =>
                      prev ? { ...prev, icon: e.target.value } : null
                    )
                  }
                  placeholder="e.g., Milk"
                />
              </div>
              <div>
                <Label htmlFor="edit-subcategory-emoji">Emoji *</Label>
                <Input
                  id="edit-subcategory-emoji"
                  value={editingSubcategory.emoji}
                  onChange={(e) =>
                    setEditingSubcategory((prev) =>
                      prev ? { ...prev, emoji: e.target.value } : null
                    )
                  }
                  placeholder="e.g., 🧀"
                />
              </div>
              <div>
                <Label htmlFor="edit-subcategory-category">Category *</Label>
                <Select
                  value={editingSubcategory.category_id}
                  onValueChange={(value) =>
                    setEditingSubcategory((prev) =>
                      prev ? { ...prev, category_id: value } : null
                    )
                  }
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-subcategory-essential"
                  checked={editingSubcategory.essential}
                  onCheckedChange={(checked) =>
                    setEditingSubcategory((prev) =>
                      prev ? { ...prev, essential: !!checked } : null
                    )
                  }
                />
                <Label htmlFor="edit-subcategory-essential">
                  Essential (appears in Indispensables)
                </Label>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={editSubcategory}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Update Subcategory
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingSubcategory(false);
                    setEditingSubcategory(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}