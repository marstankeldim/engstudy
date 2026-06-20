"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;

export function UploadZone({ courseId }: { courseId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: (res) => {
      const count = res?.length ?? 0;
      toast.success(
        count === 1 ? "Document uploaded and processed" : `${count} documents uploaded`
      );
      router.refresh();
    },
    onUploadError: (e) => {
      toast.error(e.message || "Upload failed");
    },
  });

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);

      const pdfs = files.filter((f) => f.type === "application/pdf");
      if (pdfs.length === 0) {
        toast.error("Only PDF files are supported");
        return;
      }
      if (pdfs.length > MAX_FILES) {
        toast.error(`You can upload at most ${MAX_FILES} files at once`);
        return;
      }

      void startUpload(pdfs, { courseId });
    },
    [startUpload, courseId]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!isUploading) handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !isUploading && inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
        isUploading && "pointer-events-none opacity-70"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {isUploading ? (
        <>
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="font-medium">Uploading and processing…</p>
          <p className="text-sm text-muted-foreground">
            We&apos;re extracting and indexing your content. This can take a moment.
          </p>
        </>
      ) : (
        <>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium">Drop PDFs here or click to browse</p>
          <p className="text-sm text-muted-foreground">
            Lecture slides, textbook chapters, notes — up to {MAX_FILES} files, 32MB each.
          </p>
        </>
      )}
    </div>
  );
}
