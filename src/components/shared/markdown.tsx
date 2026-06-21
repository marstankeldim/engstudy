import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders GitHub-flavored Markdown with on-brand typography that adapts to
 * dark mode. Tables, lists, code, and headings all styled via the
 * @tailwindcss/typography prose classes.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h2:mt-8 prose-h2:border-b prose-h2:pb-2 prose-h2:text-xl",
        "prose-h3:mt-6 prose-h3:text-base",
        "prose-table:text-sm prose-th:bg-muted/50 prose-td:align-top",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none",
        "prose-a:text-primary prose-strong:text-foreground",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
