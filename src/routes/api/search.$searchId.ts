import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/search/$searchId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getSearch } = await import("@/lib/search-store.server");
        try {
          const result = await getSearch(params.searchId);
          if (!result) return Response.json({ error: "Search not found." }, { status: 404 });
          return Response.json(result);
        } catch (error) {
          console.error("[api/search/:id]", error);
          return Response.json({ error: "Could not load that search." }, { status: 500 });
        }
      },
    },
  },
});
