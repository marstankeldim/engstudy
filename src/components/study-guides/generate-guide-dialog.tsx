"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DocumentMultiSelect,
  type SelectableDocument,
} from "@/components/shared/document-multi-select";
import { GUIDE_TYPES, GUIDE_TYPE_ORDER } from "@/components/study-guides/guide-types";
import { cn } from "@/lib/utils";
import type { StudyGuideType } from "@/types";

export function GenerateGuideDialog({
  courseId,
  documents,
  trigger,
}: {
  courseId: string;
  documents: SelectableDocument[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<StudyGuideType>("SUMMARY");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  async function handleGenerate() {
    if (selectedDocs.length === 0) return toast.error("Select at least one document");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/study-guides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, documentIds: selectedDocs }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }
      const guide = await res.json();
      toast.success("Study guide generated!");
      setOpen(false);
      router.push(`/courses/${courseId}/study-guide/${guide.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate a study guide</DialogTitle>
          <DialogDescription>
            Choose a format and source documents. AI does the rest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {GUIDE_TYPE_ORDER.map((t) => {
                const { label, description, icon: Icon } = GUIDE_TYPES[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-colors",
                      type === t ? "border-primary bg-primary/5" : "hover:bg-muted"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", type === t ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Source documents</Label>
            <DocumentMultiSelect
              documents={documents}
              selected={selectedDocs}
              onChange={setSelectedDocs}
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate study guide
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
