import { cn } from "@/lib/utils";
import { scoreBand } from "@/lib/job-types";

const STYLES = {
  high: "border-success/50 bg-success/15 text-success",
  mid: "border-accent/50 bg-accent/15 text-accent",
  low: "border-destructive/50 bg-destructive/15 text-destructive",
};

export function IntentBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  return (
    <span
      title={`Intent score ${score} / 100`}
      className={cn(
        "numeric inline-flex items-center justify-center rounded-full border font-semibold",
        STYLES[scoreBand(score)],
        size === "sm" ? "min-w-9 px-2 py-0.5 text-xs" : "h-20 w-20 text-3xl",
      )}
    >
      {score}
    </span>
  );
}
