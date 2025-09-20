"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus } from "lucide-react";

// Default categories that cannot be deleted
const DEFAULT_CATEGORIES = [
  "Theft",
  "Reports/Agreement", 
  "Accident",
  "Debt / Unpaid Wages Report",
  "Defamation Complaint",
  "Assault/Harassment",
  "Property Damage/Incident",
  "Animal Incident",
  "Verbal Abuse and Threats",
  "Alarm and Scandal",
  "Lost Items",
  "Scam/Fraud",
  "Drugs Addiction",
  "Missing Person",
  "Others"
];

export function EditCategoryDialog({ open, onOpenChange, onSave, onDelete, categories = [] }) {
  const [categoryName, setCategoryName] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState("");

  // Get custom categories (non-default categories)
  const customCategories = categories.filter(cat => !DEFAULT_CATEGORIES.includes(cat.name || cat));

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleSave = () => {
    if (!categoryName.trim()) return;
    
    onSave({ name: categoryName, keywords });
    setCategoryName("");
    setKeywords([]);
    setNewKeyword("");
    setActiveTab("add");
  };

  const handleDelete = () => {
    if (!selectedCategoryToDelete) return;
    
    onDelete(selectedCategoryToDelete);
    setSelectedCategoryToDelete("");
    setActiveTab("add");
  };

  const resetForm = () => {
    setCategoryName("");
    setKeywords([]);
    setNewKeyword("");
    setSelectedCategoryToDelete("");
    setActiveTab("add");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-red-600">Edit Categories</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add new categories or delete custom categories
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </TabsTrigger>
            <TabsTrigger value="delete" className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Category
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="mt-6">
            <div>
              <label className="block text-xl font-bold mb-2">Category name</label>
              <Input
                className="mb-6 text-lg h-14 rounded-xl"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                placeholder="Category name"
              />
              <label className="block text-xl font-bold mb-2">Keywords</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {keywords.map((kw) => (
                  <span key={kw} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-base font-medium">
                    {kw}
                    <button
                      className="ml-2 text-gray-500 hover:text-red-500"
                      onClick={() => handleRemoveKeyword(kw)}
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mb-8">
                <Input
                  className="flex-1 h-12 rounded-xl"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  placeholder="Add keyword"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 h-12 rounded-xl"
                  onClick={handleAddKeyword}
                  type="button"
                >
                  Add
                </Button>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <Button
                  variant="outline"
                  className="border-black text-black px-8 py-3 rounded-xl text-lg"
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl text-lg"
                  onClick={handleSave}
                  type="button"
                  disabled={!categoryName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="delete" className="mt-6">
            <div>
              <label className="block text-xl font-bold mb-2">Select Category to Delete</label>
              {customCategories.length === 0 ? (
                <Alert className="mb-6">
                  <AlertDescription>
                    No custom categories available to delete. Default categories cannot be deleted.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="mb-6">
                  <select
                    className="w-full border rounded-xl px-4 py-3 text-lg focus:outline-none"
                    value={selectedCategoryToDelete}
                    onChange={e => setSelectedCategoryToDelete(e.target.value)}
                  >
                    <option value="">Select a category to delete</option>
                    {customCategories.map((category, index) => (
                      <option key={index} value={category.name || category}>
                        {category.name || category}
                      </option>
                    ))}
                  </select>
                  {selectedCategoryToDelete && (
                    <Alert className="mt-4 border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">
                        Warning: This action cannot be undone. The category "{selectedCategoryToDelete}" will be permanently deleted.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-4 mt-8">
                <Button
                  variant="outline"
                  className="border-black text-black px-8 py-3 rounded-xl text-lg"
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl text-lg"
                  onClick={handleDelete}
                  type="button"
                  disabled={!selectedCategoryToDelete || customCategories.length === 0}
                >
                  Delete Category
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
