"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, X, CheckSquare, Square } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  allSelected: boolean;
  someSelected: boolean;
  className?: string;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  allSelected,
  someSelected,
  className = "",
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={`sticky top-0 z-10 bg-white border border-orange-200 rounded-lg shadow-md p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="p-1 h-8 w-8"
            >
              {someSelected || allSelected ? (
                <CheckSquare className="h-4 w-4 text-orange-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <div className="text-sm">
              <span className="font-medium text-gray-900">
                {selectedCount} of {totalCount} selected
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
              Bulk Actions
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={allSelected}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            Select All
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedCount})
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            className="text-gray-500 hover:text-gray-700 p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}