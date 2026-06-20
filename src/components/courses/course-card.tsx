"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CourseForm } from "@/components/courses/course-form";
import type { CourseWithCounts } from "@/types";

export function CourseCard({ course }: { course: CourseWithCounts }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Course deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="group relative h-full transition-shadow hover:shadow-md">
        <div className="absolute right-3 top-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "opacity-0 transition-opacity group-hover:opacity-100 data-[popup-open]:opacity-100"
              )}
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href={`/courses/${course.id}`}>
          <CardHeader>
            <div className="flex items-center gap-3 pr-8">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl"
                style={{ backgroundColor: `${course.color}20` }}
              >
                {course.emoji}
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{course.name}</CardTitle>
                {course.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {course.description}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{course._count.documents} docs</span>
              <span>{course._count.quizzes} quizzes</span>
              <span>{course._count.flashcardDecks} decks</span>
              <span>{course._count.studyGuides} guides</span>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>Update your course details.</DialogDescription>
          </DialogHeader>
          <CourseForm course={course} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete course?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{course.name}</strong> and all its
              documents, quizzes, flashcards, and study guides. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
