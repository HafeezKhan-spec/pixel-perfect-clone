import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchId = new URL(request.url).searchParams.get("search_id");
        if (!searchId) return Response.json({ error: "search_id is required." }, { status: 400 });

        const { getSearch, getJobs } = await import("@/lib/search-store.server");
        const XLSX = await import("xlsx");

        try {
          const search = await getSearch(searchId);
          if (!search) return Response.json({ error: "Search not found." }, { status: 404 });

          const details = await getJobs(search.results.map((j) => j.job_id));
          const rows = search.results.map((job) => {
            const d = details.get(job.job_id);
            const c = d?.crm;
            return {
              Company: job.company,
              Website: d?.website ?? "",
              Industry: d?.industry ?? "",
              "Job Title": job.job_title,
              "Job Description": d?.job_description ?? "",
              "Date Posted": job.posted_date,
              Source: job.platform,
              "Number of Similar Jobs": d?.similar_jobs_count ?? 0,
              "Reposted?": d?.is_reposted ? "Yes" : "No",
              "Signal Category": d?.signal_category ?? "",
              "AE Service": d?.ae_service ?? "",
              "Intent Score": d?.intent_score ?? 0,
              "Reason for Score": d?.reason_for_score ?? "",
              "Recommended Decision-Maker": d?.decision_maker ?? "",
              Contact: d?.contact ?? "",
              "Outreach Angle": d?.outreach_angle ?? "",
              "Date Contacted": c?.date_contacted ?? "",
              Response: c?.response ?? "",
              Meeting: c?.meeting ? `Yes${c.meeting_date ? ` (${c.meeting_date})` : ""}` : "No",
              Opportunity: c?.opportunity ? `Yes${c.opportunity_notes ? ` — ${c.opportunity_notes}` : ""}` : "No",
              Revenue: c?.revenue ?? "",
              "Matched Keyword": job.matched_keywords.join(", "),
              "Apply URL": job.apply_url,
            };
          });

          const workbook = XLSX.utils.book_new();
          const sheet = XLSX.utils.json_to_sheet(rows);
          sheet["!cols"] = [24, 28, 14, 36, 60, 12, 12, 10, 10, 22, 26, 10, 50, 30, 32, 50, 14, 22, 18, 30, 12, 26, 46].map((wch) => ({ wch }));
          XLSX.utils.book_append_sheet(workbook, sheet, "Jobs");

          const summary = XLSX.utils.json_to_sheet([
            { Field: "Keywords", Value: search.keywords.join(", ") },
            { Field: "Location", Value: search.location || "Any" },
            { Field: "Run at", Value: search.created_at },
            { Field: "Total jobs", Value: search.total_results },
            { Field: "New jobs", Value: search.new_results_count },
          ]);
          summary["!cols"] = [{ wch: 16 }, { wch: 60 }];
          XLSX.utils.book_append_sheet(workbook, summary, "Summary");

          const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
          const stamp = search.created_at.slice(0, 10);

          return new Response(buffer, {
            headers: {
              "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "Content-Disposition": `attachment; filename="job-market-pulse-${stamp}.xlsx"`,
              "Cache-Control": "no-store",
            },
          });
        } catch (error) {
          console.error("[api/export]", error);
          return Response.json({ error: "Could not build the Excel file." }, { status: 500 });
        }
      },
    },
  },
});
