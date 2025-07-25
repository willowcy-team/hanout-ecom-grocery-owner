"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface DeleteItem {
  id: string;
  name: string;
  type?: string;
  dependencies?: string[];
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DeleteItem[];
  title?: string;
  description?: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "single" | "bulk";
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  items,
  title,
  description,
  onConfirm,
  loading = false,
  variant = "single",
}: DeleteConfirmationDialogProps) {
  const isBulk = variant === "bulk" || items.length > 1;
  const hasBlockedItems = items.some((item) => item.dependencies && item.dependencies.length > 0);
  const canDelete = !hasBlockedItems;

  const getIcon = () => {
    if (hasBlockedItems) return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    if (isBulk) return <Trash2 className="h-6 w-6 text-red-600" />;
    return <AlertTriangle className="h-6 w-6 text-red-600" />;
  };

  const getTitle = () => {
    if (title) return title;
    if (hasBlockedItems) return "Cannot Delete Items";
    if (isBulk) return `Delete ${items.length} Items`;
    return "Delete Item";
  };

  const getDescription = () => {
    if (description) return description;
    if (hasBlockedItems) {
      return "Some items cannot be deleted because they have dependencies. Please resolve these dependencies first.";
    }
    if (isBulk) {
      return `Are you sure you want to delete ${items.length} items? This action cannot be undone.`;
    }
    return "Are you sure you want to delete this item? This action cannot be undone.";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-3">
            {getIcon()}
            <span>{getTitle()}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Items List */}
        <div className="my-4 max-h-60 overflow-y-auto">
          <div className="space-y-3">
            {items.map((item) => {
              const isBlocked = item.dependencies && item.dependencies.length > 0;
              
              return (
                <div
                  key={item.id}
                  className={`flex items-start justify-between p-3 rounded-lg border-2 transition-colors ${
                    isBlocked
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {isBlocked ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {item.name}
                        </p>
                        {item.type && (
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        )}
                      </div>
                      
                      {isBlocked && item.dependencies && (
                        <div className="mt-2">
                          <p className="text-xs text-yellow-700 mb-1">
                            Cannot delete - has dependencies:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.dependencies.map((dep, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300"
                              >
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {isBlocked ? (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        Blocked
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-red-300">
                        Will Delete
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {isBulk && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">
                    {items.filter(item => !item.dependencies?.length).length} can be deleted
                  </span>
                </div>
                {hasBlockedItems && (
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-700">
                      {items.filter(item => item.dependencies?.length).length} blocked
                    </span>
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                Total: {items.length} items
              </Badge>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>
                    {isBulk
                      ? `Delete ${items.filter(item => !item.dependencies?.length).length} Items`
                      : "Delete"
                    }
                  </span>
                </div>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}