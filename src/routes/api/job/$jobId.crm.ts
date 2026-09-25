import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const schema = z
  .object({
    date_contacted: date,
    response: z.enum(["No Response", "Replied - Interested", "Replied - Not Interested", "Bounced"]).nullable(),
    meeting: z.boolean(),
    meeting_date: date,
    opportunity: z.boolean(),
    opportunity_notes: z.string().max(2000).nullable(),
    revenue: z.number().min(0).max(1e12).nullable(),
    // Contact overrides (Section 3) share this save path.
    decision_maker: z.string().max(200),
    contact: z.string().max(200),
  })
  .partial()
  .strict();

export const Route = createFileRoute("/api/job/$jobId/crm")({
  server: {
    handlers: {
      PATCH: async ({ params, request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid fields." }, { status: 400 });
        const patch = { ...parsed.data };
        if (patch.meeting === false) patch.meeting_date = null;
        if (patch.opportunity === false) patch.revenue = null;

        const { updateJob } = await import("@/lib/search-store.server");
        try {
          const job = await updateJob(params.jobId, patch);
          if (!job) return Response.json({ error: "Job not found." }, { status: 404 });
          return Response.json({ ...job.crm, decision_maker: job.decision_maker, contact: job.contact });
        } catch (error) {
          console.error("[api/job/:id/crm]", error);
          return Response.json({ error: "Could not save." }, { status: 500 });
        }
      },
    },
  },
});
