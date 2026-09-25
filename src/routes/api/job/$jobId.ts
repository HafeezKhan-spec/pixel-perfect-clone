import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/job/$jobId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getJob } = await import("@/lib/search-store.server");
        try {
          const job = await getJob(params.jobId);
          if (!job) return Response.json({ error: "Job not found." }, { status: 404 });
          return Response.json(job);
        } catch (error) {
          console.error("[api/job/:id]", error);
          return Response.json({ error: "Could not load that job." }, { status: 500 });
        }
      },
    },
  },
});
