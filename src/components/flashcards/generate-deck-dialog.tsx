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
  DocumentMultiSelect,
  type SelectableDocument,
} from "@/components/shared/document-multi-select";

export function GenerateDeckDialog({
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

  const [title, setTitle] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [cardCount, setCardCount] = useState(15);

  async function handleGenerate() {
    if (selectedDocs.length === 0) return toast.error("Select at least one document");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Deck",
          documentIds: selectedDocs,
          cardCount,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }
      const deck = await res.json();
      toast.success("Deck generated!");
      setOpen(false);
      router.push(`/courses/${courseId}/flashcards/${deck.id}`);
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
          <DialogTitle>Generate a flashcard deck</DialogTitle>
          <DialogDescription>
            AI extracts key concepts, definitions, and formulas as flashcards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="deck-title">Title</Label>
            <Input
              id="deck-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 5 Key Terms"
            />
          </div>

          <div className="space-y-2">
            <Label>Source documents</Label>
            <DocumentMultiSelect
              documents={documents}
              selected={selectedDocs}
              onChange={setSelectedDocs}
            />
          </div>

          <div className="space-y-2">
            <Label>Number of cards</Label>
            <Select value={String(cardCount)} onValueChange={(v) => setCardCount(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 20, 30, 40].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} cards
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              Generate deck
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
