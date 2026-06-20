"use client";

import { Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectableDocument {
  id: string;
  name: string;
}

interface DocumentMultiSelectProps {
  documents: SelectableDocument[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function DocumentMultiSelect({
  documents,
  selected,
  onChange,
}: DocumentMultiSelectProps) {
  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    );
  }

  const allSelected = documents.length > 0 && selected.length === documents.length;

  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No processed documents yet. Upload and process documents first.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selected.length} of {documents.length} selected
        </span>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : documents.map((d) => d.id))}
          className="text-xs font-medium text-primary hover:underline"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="max-h-48 space-y-1.5 overflow-y-auto">
        {documents.map((doc) => {
          const isSelected = selected.includes(doc.id);
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => toggle(doc.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                isSelected ? "border-primary bg-primary/5" : "hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </span>
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{doc.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
