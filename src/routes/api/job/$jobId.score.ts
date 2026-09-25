import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/job/$jobId/score")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { getJob, updateJob } = await import("@/lib/search-store.server");
        const job = await getJob(params.jobId);
        if (!job) return Response.json({ error: "Job not found." }, { status: 404 });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return Response.json({ error: "Scoring is not configured." }, { status: 500 });

        const prompt = `You score B2B sales intent for an agency that sells engineering services, based on a company's job posting.
Company: ${job.company} (${job.industry}), website ${job.website}
Job title: ${job.job_title}
Posted: ${job.date_posted} on ${job.source}. Reposted: ${job.is_reposted ? "yes" : "no"}. Similar open roles at this company: ${job.similar_jobs_count}.
Description:
${job.job_description}`;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: prompt }],
            tools: [
              {
                type: "function",
                function: {
                  name: "score",
                  parameters: {
                    type: "object",
                    properties: {
                      signal_category: { type: "string", description: "Short label, e.g. Team expansion" },
                      ae_service: { type: "string", description: "Service the account executive should pitch" },
                      intent_score: { type: "integer", minimum: 0, maximum: 100 },
                      reason_for_score: { type: "string", description: "1-2 sentences" },
                      outreach_angle: { type: "string", description: "1-2 sentences" },
                    },
                    required: ["signal_category", "ae_service", "intent_score", "reason_for_score", "outreach_angle"],
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "score" } },
          }),
        });
        if (res.status === 429) return Response.json({ error: "Too many requests, try again shortly." }, { status: 429 });
        if (res.status === 402) return Response.json({ error: "AI credits are used up." }, { status: 402 });
        if (!res.ok) return Response.json({ error: "Scoring failed." }, { status: 502 });

        try {
          const body = await res.json();
          const args = JSON.parse(body.choices[0].message.tool_calls[0].function.arguments);
          const updated = await updateJob(params.jobId, {
            signal_category: String(args.signal_category).slice(0, 120),
            ae_service: String(args.ae_service).slice(0, 120),
            intent_score: Math.max(0, Math.min(100, Math.round(Number(args.intent_score) || 0))),
            reason_for_score: String(args.reason_for_score).slice(0, 1000),
            outreach_angle: String(args.outreach_angle).slice(0, 1000),
          });
          return Response.json(updated);
        } catch (error) {
          console.error("[api/job/:id/score]", error);
          return Response.json({ error: "Scoring returned an unexpected result." }, { status: 502 });
        }
      },
    },
  },
});
