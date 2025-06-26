"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddCategoryDialog({ open, onOpenChange, onSave }) {
  const [categoryName, setCategoryName] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");

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
    onSave({ name: categoryName, keywords });
    setCategoryName("");
    setKeywords([]);
    setNewKeyword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-red-600">Add Category</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add category details and keywords for machine learning categorization
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
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
      </DialogContent>
    </Dialog>
  );
}
