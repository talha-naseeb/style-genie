import { cn } from "@/lib/utils";

const STEPS = ["Upload", "Frame", "Outfit", "Result"] as const;

export function StepIndicator({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <ol className="mx-auto flex w-full max-w-xl items-center justify-between gap-2 py-6">
      {STEPS.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                active && "border-primary bg-primary text-primary-foreground",
                done && "border-primary bg-primary/20 text-primary",
                !active && !done && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:inline",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="ml-2 hidden h-px flex-1 bg-border sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
