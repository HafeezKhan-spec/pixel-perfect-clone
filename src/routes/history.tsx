import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock, Download, History as HistoryIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HistoryEntry } from "@/lib/job-types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Search history — Job Market Pulse" },
      {
        name: "description",
        content: "Revisit past job searches, reopen their dashboards and export them to Excel.",
      },
      { property: "og:title", content: "Search history — Job Market Pulse" },
      {
        property: "og:description",
        content: "Revisit past job searches, reopen their dashboards and export them to Excel.",
      },
    ],
  }),
  component: HistoryPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function HistoryPage() {
  const history = useQuery({
    queryKey: ["history"],
    queryFn: async (): Promise<HistoryEntry[]> => {
      const response = await fetch("/api/history");
      if (!response.ok) throw new Error("Could not load history.");
      const body = (await response.json()) as { searches: HistoryEntry[] };
      return body.searches;
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Search history</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every run is saved. Open one to see its dashboard again, or export it straight to Excel.
      </p>

      <div className="mt-6 space-y-3">
        {history.isPending ? (
          <div className="panel flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
          </div>
        ) : history.isError ? (
          <div className="panel px-6 py-16 text-center text-sm text-destructive">
            Could not load your history. Please try again.
          </div>
        ) : history.data && history.data.length > 0 ? (
          history.data.map((entry) => (
            <article key={entry.search_id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(entry.created_at)}
                    </span>
                    <span>{entry.location || "Any location"}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-right">
                    <p className="numeric text-2xl font-semibold text-primary">
                      {entry.new_results_count}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      New jobs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="numeric text-2xl font-semibold">{entry.total_results}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Total jobs
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/search/$searchId" params={{ searchId: entry.search_id }}>
                    Open dashboard
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`/api/export?search_id=${entry.search_id}`}>
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                  </a>
                </Button>
              </div>
            </article>
          ))
        ) : (
          <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
            <HistoryIcon className="h-6 w-6 text-primary" />
            <p className="text-sm">No searches yet — run one from the Search tab.</p>
            <Button asChild size="sm" className="mt-2">
              <Link to="/">Go to Search</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
