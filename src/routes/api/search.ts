import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  keywords: z.array(z.string().min(1).max(120)).min(1).max(20),
  location: z.string().max(120).optional(),
});

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Provide at least one keyword." }, { status: 400 });
        }

        const { runSearch } = await import("@/lib/search-store.server");
        try {
          const result = await runSearch(parsed.keywords, parsed.location ?? "");
          return Response.json(result);
        } catch (error) {
          console.error("[api/search]", error);
          return Response.json({ error: "Could not run that search." }, { status: 500 });
        }
      },
    },
  },
});
