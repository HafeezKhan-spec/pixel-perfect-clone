import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { SearchDashboard } from "@/components/search-dashboard";
import { Button } from "@/components/ui/button";
import type { SearchResponse } from "@/lib/job-types";

export const Route = createFileRoute("/search/$searchId")({
  head: () => ({
    meta: [
      { title: "Saved report — Job Market Pulse" },
      {
        name: "description",
        content: "Reopen a saved job search run with its charts, new postings and results table.",
      },
      { property: "og:title", content: "Saved report — Job Market Pulse" },
      {
        property: "og:description",
        content: "Reopen a saved job search run with its charts, new postings and results table.",
      },
    ],
  }),
  component: SavedSearchPage,
});

function SavedSearchPage() {
  const { searchId } = Route.useParams();

  const run = useQuery({
    queryKey: ["search", searchId],
    queryFn: async (): Promise<SearchResponse> => {
      const response = await fetch(`/api/search/${searchId}`);
      if (!response.ok) throw new Error("Could not load that search.");
      return (await response.json()) as SearchResponse;
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/history">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to history
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Saved report</h1>
      </div>

      {run.isPending ? (
        <div className="panel flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
        </div>
      ) : run.isError || !run.data ? (
        <div className="panel px-6 py-16 text-center text-sm text-destructive">
          This report could not be loaded.
        </div>
      ) : (
        <SearchDashboard data={run.data} />
      )}
    </main>
  );
}
