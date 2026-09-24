import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchId = new URL(request.url).searchParams.get("search_id");
        if (!searchId) return Response.json({ error: "search_id is required." }, { status: 400 });

        const { getSearch } = await import("@/lib/search-store.server");
        const XLSX = await import("xlsx");

        try {
          const search = await getSearch(searchId);
          if (!search) return Response.json({ error: "Search not found." }, { status: 404 });

          const rows = search.results.map((job) => ({
            "Job Title": job.job_title,
            Company: job.company,
            Location: job.location,
            Platform: job.platform,
            "Posted Date": job.posted_date,
            "Days Ago": job.days_ago,
            "Employment Type": job.employment_type,
            "Matched Keyword": job.matched_keywords.join(", "),
            New: job.is_new ? "Yes" : "No",
            "Apply URL": job.apply_url,
          }));

          const workbook = XLSX.utils.book_new();
          const sheet = XLSX.utils.json_to_sheet(rows);
          sheet["!cols"] = [
            { wch: 40 },
            { wch: 24 },
            { wch: 18 },
            { wch: 14 },
            { wch: 13 },
            { wch: 10 },
            { wch: 17 },
            { wch: 30 },
            { wch: 7 },
            { wch: 46 },
          ];
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
