import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildStats, generateJobs } from "./job-sample.server";
import type { HistoryEntry, JobResult, SearchResponse } from "./job-types";

type JobRow = {
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  platform: string;
  posted_date: string;
  days_ago: number;
  employment_type: string;
  apply_url: string;
  matched_keywords: string[];
  is_new: boolean;
};

function toResponse(
  search: { id: string; keywords: string[]; location: string; created_at: string },
  rows: JobRow[],
): SearchResponse {
  const results: JobResult[] = rows.map((r) => ({ ...r }));
  return {
    search_id: search.id,
    keywords: search.keywords,
    location: search.location,
    created_at: search.created_at,
    total_results: results.length,
    new_results_count: results.filter((r) => r.is_new).length,
    results,
    stats: buildStats(results, search.keywords),
  };
}

export async function runSearch(keywords: string[], location: string): Promise<SearchResponse> {
  const jobs = generateJobs(keywords, location);

  // A job counts as "new" when it was not returned by an earlier run that
  // shared at least one of these keywords.
  const { data: previous } = await supabaseAdmin
    .from("searches")
    .select("id")
    .overlaps("keywords", keywords);

  const seen = new Set<string>();
  const previousIds = (previous ?? []).map((p) => p.id);
  if (previousIds.length > 0) {
    const { data: seenRows } = await supabaseAdmin
      .from("search_jobs")
      .select("job_id")
      .in("search_id", previousIds);
    for (const row of seenRows ?? []) seen.add(row.job_id);
  }

  for (const job of jobs) job.is_new = !seen.has(job.job_id);

  const { data: search, error } = await supabaseAdmin
    .from("searches")
    .insert({
      keywords,
      location: location.trim(),
      total_results: jobs.length,
      new_results_count: jobs.filter((j) => j.is_new).length,
    })
    .select("id, keywords, location, created_at")
    .single();
  if (error || !search) throw new Error(error?.message ?? "Could not save the search");

  const { error: jobsError } = await supabaseAdmin
    .from("search_jobs")
    .insert(jobs.map((job) => ({ ...job, search_id: search.id })));
  if (jobsError) throw new Error(jobsError.message);

  return toResponse(search, jobs);
}

export async function getSearch(searchId: string): Promise<SearchResponse | null> {
  const { data: search } = await supabaseAdmin
    .from("searches")
    .select("id, keywords, location, created_at")
    .eq("id", searchId)
    .maybeSingle();
  if (!search) return null;

  const { data: rows, error } = await supabaseAdmin
    .from("search_jobs")
    .select(
      "job_id, job_title, company, location, platform, posted_date, days_ago, employment_type, apply_url, matched_keywords, is_new",
    )
    .eq("search_id", searchId)
    .order("days_ago", { ascending: true });
  if (error) throw new Error(error.message);

  return toResponse(search, (rows ?? []) as JobRow[]);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("searches")
    .select("id, keywords, location, created_at, total_results, new_results_count")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  return (data ?? []).map((s) => ({
    search_id: s.id,
    keywords: s.keywords,
    location: s.location,
    created_at: s.created_at,
    total_results: s.total_results,
    new_results_count: s.new_results_count,
  }));
}
