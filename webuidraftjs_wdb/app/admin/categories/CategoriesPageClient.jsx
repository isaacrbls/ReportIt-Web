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
    description: "Taking or attempting to take anything of value by force, threat of force, or by putting the victim in fear",
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

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    keywords: [],
    color: "#ef4444",
    isActive: true,
  })

  const [editCategory, setEditCategory] = useState({
    id: null,
    name: "",
    description: "",
    keywords: [],
    color: "#ef4444",
    isActive: true,
  })

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

  const resetNewCategory = () => {
    setNewCategory({
      name: "",
      description: "",
      keywords: [],
      color: "#ef4444",
      isActive: true,
    })
    setNewKeyword("")
  }

  const resetEditCategory = () => {
    setEditCategory({
      id: null,
      name: "",
      description: "",
      keywords: [],
      color: "#ef4444",
      isActive: true,
    })
    setNewKeyword("")
  }

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return

    const newId = Math.max(...categories.map((cat) => cat.id)) + 1
    const categoryToAdd = {
      ...newCategory,
      id: newId,
      usageCount: 0,
      mlConfidence: 0,
    }

    setCategories([...categories, categoryToAdd])
    resetNewCategory()
    setIsAddDialogOpen(false)
  }

  const handleEditCategory = () => {
    if (!editCategory.name.trim()) return

    setCategories(categories.map((cat) => (cat.id === editCategory.id ? editCategory : cat)))
    resetEditCategory()
    setIsEditDialogOpen(false)
  }

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      setCategories(categories.filter((cat) => cat.id !== selectedCategory.id))
    }
    setIsDeleteDialogOpen(false)
    setSelectedCategory(null)
  }

  const openEditDialog = (category) => {
    setEditCategory(category)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const addKeywordToNew = () => {
    if (!newKeyword.trim() || newCategory.keywords.includes(newKeyword.trim())) {
      return
    }

    setNewCategory({
      ...newCategory,
      keywords: [...newCategory.keywords, newKeyword.trim()],
    })
    setNewKeyword("")
  }

  const removeKeywordFromNew = (keyword) => {
    setNewCategory({
      ...newCategory,
      keywords: newCategory.keywords.filter((k) => k !== keyword),
    })
  }

  const addKeywordToEdit = () => {
    if (!newKeyword.trim() || editCategory.keywords.includes(newKeyword.trim())) {
      return
    }

    setEditCategory({
      ...editCategory,
      keywords: [...editCategory.keywords, newKeyword.trim()],
    })
    setNewKeyword("")
  }

  const removeKeywordFromEdit = (keyword) => {
    setEditCategory({
      ...editCategory,
      keywords: editCategory.keywords.filter((k) => k !== keyword),
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Tag className="w-6 h-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {categories.filter((cat) => cat.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inactive Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {categories.filter((cat) => !cat.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {categories.reduce((total, cat) => total + cat.keywords.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <ShieldAlert className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Category keywords are used by our machine learning model to automatically classify incident reports. 
          Adding relevant keywords improves classification accuracy.
        </AlertDescription>
      </Alert>

      {}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Category
          </Button>
        </div>
        <div className="flex-1">
          <Input
            placeholder="Search categories or keywords..."
            className="w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-red-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            All Categories
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            Active Only
          </TabsTrigger>
          <TabsTrigger value="inactive" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            Inactive Only
          </TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold" style={{ color: category.color }}>
                      {category.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => openDeleteDialog(category)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords ({category.keywords.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.keywords.slice(0, 6).map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {category.keywords.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.keywords.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Usage: {category.usageCount} reports</span>
                      <span>ML Confidence: {category.mlConfidence}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new incident category with relevant keywords for automatic classification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Describe what this category covers"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="color">Category Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="color"
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300"
                />
                <span className="text-sm text-gray-600">{newCategory.color}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newCategory.isActive}
                onCheckedChange={(checked) => setNewCategory({ ...newCategory, isActive: checked })}
              />
              <Label htmlFor="isActive">Active Status</Label>
            </div>
            <div>
              <Label>Keywords</Label>
              <p className="text-sm text-gray-600 mb-2">
                Add keywords that help identify this category in incident reports.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {newCategory.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-4 w-4 hover:bg-transparent"
                      onClick={() => removeKeywordFromNew(keyword)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
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
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details and keywords for better classification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editCategory.name}
                onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editCategory.description}
                onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Category Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="edit-color"
                  type="color"
                  value={editCategory.color}
                  onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300"
                />
                <span className="text-sm text-gray-600">{editCategory.color}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={editCategory.isActive}
                onCheckedChange={(checked) => setEditCategory({ ...editCategory, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Active Status</Label>
            </div>
            <div>
              <Label>Keywords</Label>
              <p className="text-sm text-gray-600 mb-2">
                Update keywords that help identify this category in incident reports.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {editCategory.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-4 w-4 hover:bg-transparent"
                      onClick={() => removeKeywordFromEdit(keyword)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
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
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditCategory}
              disabled={!editCategory.name.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
              {selectedCategory?.usageCount > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  Warning: This category has been used in {selectedCategory.usageCount} reports.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}