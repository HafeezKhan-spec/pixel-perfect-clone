import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/history")({
  server: {
    handlers: {
      GET: async () => {
        const { getHistory } = await import("@/lib/search-store.server");
        try {
          return Response.json({ searches: await getHistory() });
        } catch (error) {
          console.error("[api/history]", error);
          return Response.json({ error: "Could not load history." }, { status: 500 });
        }
      },
    },
  },
});
