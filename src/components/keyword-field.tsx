import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  value: string;
  onChange: (value: string) => void;
  keywords: string[];
};

export function KeywordField({ value, onChange, keywords }: Props) {
  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter((k) => k !== keyword).join(", "));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="keywords" className="text-xs uppercase tracking-wider text-muted-foreground">
        Job titles or skills
      </Label>
      <Input
        id="keywords"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="React developer, Python developer, DevOps engineer"
        autoComplete="off"
        className="h-11 bg-background/60 text-base"
      />
      {keywords.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground">
            Searching {keywords.length} keyword{keywords.length > 1 ? "s" : ""}:
          </span>
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs text-foreground"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                aria-label={`Remove ${keyword}`}
                className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="pt-1 text-xs text-muted-foreground">
          Separate keywords with commas — each one is searched on its own.
        </p>
      )}
    </div>
  );
}
