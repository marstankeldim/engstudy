"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MCQOption, QuestionType } from "@/types";

export interface PlayerQuestion {
  id: string;
  type: QuestionType;
  content: string;
  options: MCQOption[] | null;
  points: number;
}

interface QuestionCardProps {
  question: PlayerQuestion;
  value: string;
  onChange: (value: string) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <div className="space-y-5">
      <p className="text-lg font-medium leading-relaxed">{question.content}</p>

      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className="space-y-2.5">
          {question.options.map((opt: MCQOption) => (
            <OptionButton
              key={opt.id}
              selected={value === opt.id}
              onClick={() => onChange(opt.id)}
              label={opt.id}
              text={opt.text}
            />
          ))}
        </div>
      )}

      {question.type === "TRUE_FALSE" && (
        <div className="grid grid-cols-2 gap-3">
          {["true", "false"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "rounded-lg border-2 py-4 text-center font-medium capitalize transition-colors",
                value === v ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {question.type === "SHORT_ANSWER" && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer…"
          rows={5}
          className="resize-none"
        />
      )}
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  label,
  text,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors",
        selected ? "border-primary bg-primary/10" : "hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-input"
        )}
      >
        {label}
      </span>
      <span>{text}</span>
    </button>
  );
}
