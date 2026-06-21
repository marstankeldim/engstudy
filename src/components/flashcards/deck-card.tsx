"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DeckCardData {
  id: string;
  courseId: string;
  title: string;
  cardCount: number;
  dueCount: number;
}

export function DeckCard({ deck }: { deck: DeckCardData }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deck deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete deck");
      setDeleting(false);
    }
  }

  return (
    <Card className="group relative h-full transition-shadow hover:shadow-md">
      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={deleting}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "opacity-0 transition-opacity group-hover:opacity-100"
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={`/courses/${deck.courseId}/flashcards/${deck.id}`}>
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="pr-8 text-base">{deck.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{deck.cardCount} cards</Badge>
            {deck.dueCount > 0 ? (
              <Badge className="bg-primary/10 text-primary">{deck.dueCount} due</Badge>
            ) : (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                All reviewed
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
