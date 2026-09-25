import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildStats, generateJobs } from "./job-sample.server";
import { enrichJob } from "./job-enrich.server";
import type { CrmData, HistoryEntry, JobDetail, JobResult, SearchResponse } from "./job-types";

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

async function scoresFor(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const { data } = await supabaseAdmin.from("job_details").select("job_id, intent_score").in("job_id", ids);
  for (const r of data ?? []) map.set(r.job_id, r.intent_score);
  return map;
}

async function toResponse(
  search: { id: string; keywords: string[]; location: string; created_at: string },
  rows: JobRow[],
): Promise<SearchResponse> {
  const scores = await scoresFor(rows.map((r) => r.job_id));
  const results: JobResult[] = rows.map((r) => ({ ...r, intent_score: scores.get(r.job_id) ?? 0 }));
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

  const perCompany: Record<string, number> = {};
  for (const job of jobs) perCompany[job.company] = (perCompany[job.company] ?? 0) + 1;
  const { error: detailError } = await supabaseAdmin
    .from("job_details")
    .upsert(
      jobs.map((job) => enrichJob(job, perCompany[job.company] ?? 1)),
      { onConflict: "job_id", ignoreDuplicates: true },
    );
  if (detailError) throw new Error(detailError.message);

  return await toResponse(search, jobs);
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

  return await toResponse(search, (rows ?? []) as JobRow[]);
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

const CRM_COLS = "date_contacted, response, meeting, meeting_date, opportunity, opportunity_notes, revenue";
type DetailRow = Omit<JobDetail, "crm"> & CrmData;

function toDetail(r: DetailRow): JobDetail {
  const { date_contacted, response, meeting, meeting_date, opportunity, opportunity_notes, revenue, ...rest } = r;
  return {
    job_id: rest.job_id, company: rest.company, website: rest.website, industry: rest.industry,
    job_title: rest.job_title, job_description: rest.job_description, date_posted: rest.date_posted,
    source: rest.source, similar_jobs_count: rest.similar_jobs_count, is_reposted: rest.is_reposted,
    signal_category: rest.signal_category, ae_service: rest.ae_service, intent_score: rest.intent_score,
    reason_for_score: rest.reason_for_score, outreach_angle: rest.outreach_angle,
    decision_maker: rest.decision_maker, contact: rest.contact,
    crm: {
      date_contacted, response, meeting, meeting_date, opportunity, opportunity_notes,
      revenue: revenue === null ? null : Number(revenue),
    },
  };
}

export async function getJob(jobId: string): Promise<JobDetail | null> {
  const { data, error } = await supabaseAdmin.from("job_details").select("*").eq("job_id", jobId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toDetail(data as unknown as DetailRow) : null;
}

export async function getJobs(jobIds: string[]): Promise<Map<string, JobDetail>> {
  const map = new Map<string, JobDetail>();
  if (jobIds.length === 0) return map;
  const { data, error } = await supabaseAdmin.from("job_details").select("*").in("job_id", jobIds);
  if (error) throw new Error(error.message);
  for (const r of data ?? []) map.set(r.job_id, toDetail(r as unknown as DetailRow));
  return map;
}

export async function updateJob(jobId: string, patch: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from("job_details").update(patch as never).eq("job_id", jobId).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toDetail(data as unknown as DetailRow) : null;
}
export { CRM_COLS };
