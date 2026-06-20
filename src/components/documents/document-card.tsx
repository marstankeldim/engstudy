"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  MoreVertical,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import type { Document, DocumentStatus } from "@/types";

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  READY: {
    label: "Ready",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  FAILED: {
    label: "Failed",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive",
  },
};

export function DocumentCard({ document }: { document: Document }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const status = STATUS_CONFIG[document.status];
  const StatusIcon = status.icon;

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Document deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete document");
      setBusy(false);
    }
  }

  async function handleReprocess() {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${document.id}/process`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Document reprocessed");
      router.refresh();
    } catch {
      toast.error("Reprocessing failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{document.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{formatBytes(document.fileSize)}</span>
          {document.pageCount != null && <span>{document.pageCount} pages</span>}
          <span>{formatDate(document.createdAt)}</span>
        </div>
      </div>

      <Badge variant="secondary" className={cn("gap-1", status.className)}>
        <StatusIcon className={cn("h-3 w-3", document.status === "PROCESSING" && "animate-spin")} />
        {status.label}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={busy}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {document.status !== "PROCESSING" && (
            <DropdownMenuItem onClick={handleReprocess}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {document.status === "FAILED" ? "Retry" : "Reprocess"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
