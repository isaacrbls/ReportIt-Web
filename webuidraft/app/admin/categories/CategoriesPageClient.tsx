"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Edit, Plus, Save, ShieldAlert, Tag, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Sample initial categories data
const initialCategories = [
  {
    id: 1,
    name: "Theft",
    description: "Unlawful taking of property from a person or place without consent",
    keywords: ["steal", "stolen", "took", "missing", "disappeared", "snatched", "pickpocket", "shoplifting"],
    color: "#ef4444",
    isActive: true,
    usageCount: 578,
    mlConfidence: 88,
  },
  {
    id: 2,
    name: "Robbery",
    description:
      "Taking or attempting to take anything of value by force, threat of force, or by putting the victim in fear",
    keywords: ["armed", "weapon", "gun", "knife", "force", "threat", "holdup", "mugging"],
    color: "#f87171",
    isActive: true,
    usageCount: 257,
    mlConfidence: 85,
  },
  {
    id: 3,
    name: "Vehicle Theft",
    description: "Theft or attempted theft of a motor vehicle",
    keywords: ["car", "motorcycle", "bike", "vehicle", "auto", "carjacking", "hotwire", "grand theft auto"],
    color: "#fca5a5",
    isActive: true,
    usageCount: 193,
    mlConfidence: 82,
  },
  {
    id: 4,
    name: "Assault",
    description: "Intentional act that causes another person to fear imminent harmful contact",
    keywords: ["attack", "hit", "beat", "punch", "fight", "harm", "injure", "physical", "violence"],
    color: "#fee2e2",
    isActive: true,
    usageCount: 128,
    mlConfidence: 79,
  },
  {
    id: 5,
    name: "Burglary",
    description: "Unlawful entry into a building with intent to commit a crime",
    keywords: ["break-in", "break in", "intrusion", "trespassing", "forced entry", "burglar", "intruder"],
    color: "#fecaca",
    isActive: true,
    usageCount: 128,
    mlConfidence: 81,
  },
]

export default function CategoriesPageClient() {
  const [categories, setCategories] = useState(initialCategories)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [newKeyword, setNewKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // New category form state
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    keywords: [],
    color: "#ef4444",
    isActive: true,
  })

  // Edit category form state
  const [editCategory, setEditCategory] = useState({
    id: 0,
    name: "",
    description: "",
    keywords: [],
    color: "",
    isActive: true,
    usageCount: 0,
    mlConfidence: 0,
  })

  // Handle adding a new category
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return

    const newId = Math.max(...categories.map((cat) => cat.id)) + 1
    setCategories([
      ...categories,
      {
        ...newCategory,
        id: newId,
        usageCount: 0,
        mlConfidence: 0,
      },
    ])
    setNewCategory({
      name: "",
      description: "",
      keywords: [],
      color: "#ef4444",
      isActive: true,
    })
    setIsAddDialogOpen(false)
  }

  // Handle editing a category
  const handleEditCategory = () => {
    setCategories(categories.map((cat) => (cat.id === editCategory.id ? { ...editCategory } : cat)))
    setIsEditDialogOpen(false)
  }

  // Handle deleting a category
  const handleDeleteCategory = () => {
    setCategories(categories.filter((cat) => cat.id !== selectedCategory.id))
    setIsDeleteDialogOpen(false)
    setSelectedCategory(null)
  }

  // Open edit dialog
  const openEditDialog = (category) => {
    setEditCategory({ ...category })
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // Add keyword to new category
  const addKeywordToNew = () => {
    if (!newKeyword.trim() || newCategory.keywords.includes(newKeyword.trim())) {
      setNewKeyword("")
      return
    }
    setNewCategory({
      ...newCategory,
      keywords: [...newCategory.keywords, newKeyword.trim()],
    })
    setNewKeyword("")
  }

  // Remove keyword from new category
  const removeKeywordFromNew = (keyword) => {
    setNewCategory({
      ...newCategory,
      keywords: newCategory.keywords.filter((k) => k !== keyword),
    })
  }

  // Add keyword to edit category
  const addKeywordToEdit = () => {
    if (!newKeyword.trim() || editCategory.keywords.includes(newKeyword.trim())) {
      setNewKeyword("")
      return
    }
    setEditCategory({
      ...editCategory,
      keywords: [...editCategory.keywords, newKeyword.trim()],
    })
    setNewKeyword("")
  }

  // Remove keyword from edit category
  const removeKeywordFromEdit = (keyword) => {
    setEditCategory({
      ...editCategory,
      keywords: editCategory.keywords.filter((k) => k !== keyword),
    })
  }

  // Filter categories based on search term and active tab
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase()))

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && category.isActive
    if (activeTab === "inactive") return matchesSearch && !category.isActive

    return matchesSearch
  })

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 border-b bg-red-600 text-white">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-white" />
            <h1 className="text-lg font-semibold">ReportIt Admin</h1>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link
              href="/admin"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/reports"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Reports
            </Link>
            <Link
              href="/admin/analytics"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Analytics
            </Link>
            <Link
              href="/admin/map"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Map
            </Link>
            <Link
              href="/admin/categories"
              className="text-sm font-medium text-white underline-offset-4 hover:underline"
            >
              Categories
            </Link>
            <Link
              href="/admin/settings"
              className="text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center text-sm text-red-600 hover:underline">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categories Management</h1>
            <p className="text-muted-foreground">
              Manage crime categories and keywords for machine learning categorization
            </p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Search categories or keywords..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="mt-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-red-100">
            <TabsTrigger value="all" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              All Categories
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Active
            </TabsTrigger>
            <TabsTrigger value="inactive" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              Inactive
            </TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "all"
                    ? "All Categories"
                    : activeTab === "active"
                      ? "Active Categories"
                      : "Inactive Categories"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "all"
                    ? "Manage all crime categories and their associated keywords"
                    : activeTab === "active"
                      ? "Currently active categories used for ML categorization"
                      : "Inactive categories not currently used for ML categorization"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <Card key={category.id} className="overflow-hidden">
                        <div className="h-1" style={{ backgroundColor: category.color }} />
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium">{category.name}</h3>
                              {!category.isActive && (
                                <Badge variant="outline" className="text-gray-500">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-600 text-red-600 hover:bg-red-50"
                                onClick={() => openEditDialog(category)}
                              >
                                <Edit className="mr-1 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-600 text-red-600 hover:bg-red-50"
                                onClick={() => openDeleteDialog(category)}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>

                          <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <div>
                              <h4 className="mb-2 text-sm font-medium">Keywords</h4>
                              <div className="flex flex-wrap gap-2">
                                {category.keywords.map((keyword) => (
                                  <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="mb-2 text-sm font-medium">Usage Statistics</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Reports categorized:</span>
                                  <span>{category.usageCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">ML confidence:</span>
                                  <span>{category.mlConfidence}%</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="mb-2 text-sm font-medium">ML Performance</h4>
                              <div className="h-2 w-full rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-red-600"
                                  style={{ width: `${category.mlConfidence}%` }}
                                />
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {category.mlConfidence >= 85
                                  ? "High confidence in categorization"
                                  : category.mlConfidence >= 75
                                    ? "Good confidence in categorization"
                                    : "Moderate confidence in categorization"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed">
                      <p className="text-muted-foreground">No categories found</p>
                      <p className="text-xs text-muted-foreground">
                        {searchTerm
                          ? "No categories match your search criteria"
                          : activeTab === "active"
                            ? "No active categories found"
                            : activeTab === "inactive"
                              ? "No inactive categories found"
                              : "No categories have been created yet"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Category Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new crime category with associated keywords for machine learning categorization
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Theft, Robbery, Assault"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Describe this crime category..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Category Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="h-10 w-20"
                  />
                  <div className="h-10 w-20 rounded-md border" style={{ backgroundColor: newCategory.color }} />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active Status</Label>
                  <Switch
                    id="isActive"
                    checked={newCategory.isActive}
                    onCheckedChange={(checked) => setNewCategory({ ...newCategory, isActive: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Active categories are used by the ML model for categorization
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {newCategory.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <button
                        onClick={() => removeKeywordFromNew(keyword)}
                        className="ml-1 rounded-full hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addKeywordToNew()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addKeywordToNew}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keywords help the ML model identify and categorize crime reports
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim() || newCategory.keywords.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update category details and keywords for machine learning categorization
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editCategory.description}
                  onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Category Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={editCategory.color}
                    onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
                    className="h-10 w-20"
                  />
                  <div className="h-10 w-20 rounded-md border" style={{ backgroundColor: editCategory.color }} />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-isActive">Active Status</Label>
                  <Switch
                    id="edit-isActive"
                    checked={editCategory.isActive}
                    onCheckedChange={(checked) => setEditCategory({ ...editCategory, isActive: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Active categories are used by the ML model for categorization
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {editCategory.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <button
                        onClick={() => removeKeywordFromEdit(keyword)}
                        className="ml-1 rounded-full hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addKeywordToEdit()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addKeywordToEdit}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {editCategory.usageCount > 0 && (
                <Alert>
                  <AlertDescription>
                    This category is currently used in {editCategory.usageCount} reports. Changes may affect ML
                    categorization.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={!editCategory.name.trim() || editCategory.keywords.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Category Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this category? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedCategory && selectedCategory.usageCount > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  Warning: This category is currently used in {selectedCategory.usageCount} reports. Deleting it may
                  affect ML categorization and reporting.
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCategory}>
                Delete Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
