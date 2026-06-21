"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GUIDE_TYPES } from "@/components/study-guides/guide-types";
import { cn, formatDate } from "@/lib/utils";
import type { StudyGuideType } from "@/types";

export interface GuideCardData {
  id: string;
  courseId: string;
  title: string;
  type: StudyGuideType;
  createdAt: Date;
}

export function GuideCard({ guide }: { guide: GuideCardData }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const meta = GUIDE_TYPES[guide.type];
  const Icon = meta.icon;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/study-guides/${guide.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Study guide deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete study guide");
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

      <Link href={`/courses/${guide.courseId}/study-guide/${guide.id}`}>
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="pr-8 text-base">{guide.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge variant="secondary">{meta.label}</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(guide.createdAt)}</span>
        </CardContent>
      </Link>
    </Card>
  );
}
