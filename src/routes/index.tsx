import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { KeywordField } from "@/components/keyword-field";
import { SearchDashboard } from "@/components/search-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseKeywords, type SearchResponse } from "@/lib/job-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Search jobs — Job Market Pulse" },
      {
        name: "description",
        content:
          "Search several job titles or skills at once and see hiring demand by keyword, platform and day.",
      },
      { property: "og:title", content: "Search jobs — Job Market Pulse" },
      {
        property: "og:description",
        content:
          "Search several job titles or skills at once and see hiring demand by keyword, platform and day.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [raw, setRaw] = useState("");
  const [location, setLocation] = useState("");
  const keywords = useMemo(() => parseKeywords(raw), [raw]);

  const search = useMutation({
    mutationFn: async (): Promise<SearchResponse> => {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, location: location.trim() }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not run that search.");
      }
      return (await response.json()) as SearchResponse;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Job market pulse</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track several roles in one run and see where the hiring demand actually is.
        </p>
      </div>

      <form
        className="panel grid gap-4 p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (keywords.length === 0) return;
          search.mutate();
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <KeywordField value={raw} onChange={setRaw} keywords={keywords} />
          <div className="space-y-2">
            <Label
              htmlFor="location"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Location (optional)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Berlin, Remote, Bengaluru…"
              className="h-11 bg-background/60 text-base"
            />
            <p className="pt-1 text-xs text-muted-foreground">Applies to every keyword.</p>
          </div>
        </div>
        <div>
          <Button type="submit" size="lg" disabled={keywords.length === 0 || search.isPending}>
            {search.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning boards…
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate report
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        {search.data ? (
          <SearchDashboard data={search.data} />
        ) : (
          <div className="panel flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <TrendingUp className="h-6 w-6 text-primary" />
            <p className="text-sm font-medium">No report yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Add one or more keywords above, then generate a report to see charts, new postings and
              the full results table.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
