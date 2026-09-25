export type JobResult = {
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
  intent_score?: number;
};

export type SearchStats = {
  by_platform: Record<string, number>;
  by_employment_type: Record<string, number>;
  by_day: Record<string, number>;
  top_companies: { company: string; count: number }[];
  by_keyword: Record<string, number>;
};

export type SearchResponse = {
  search_id: string;
  keywords: string[];
  location: string;
  created_at: string;
  total_results: number;
  new_results_count: number;
  results: JobResult[];
  stats: SearchStats;
};

export type HistoryEntry = {
  search_id: string;
  keywords: string[];
  location: string;
  created_at: string;
  total_results: number;
  new_results_count: number;
};

export function parseKeywords(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const k = part.trim().replace(/\s+/g, " ");
    if (!k) continue;
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
  }
  return out;
}

export type CrmData = {
  date_contacted: string | null;
  response: string | null;
  meeting: boolean;
  meeting_date: string | null;
  opportunity: boolean;
  opportunity_notes: string | null;
  revenue: number | null;
};

export type JobDetail = {
  job_id: string;
  company: string;
  website: string;
  industry: string;
  job_title: string;
  job_description: string;
  date_posted: string;
  source: string;
  similar_jobs_count: number;
  is_reposted: boolean;
  signal_category: string;
  ae_service: string;
  intent_score: number;
  reason_for_score: string;
  outreach_angle: string;
  decision_maker: string;
  contact: string;
  crm: CrmData;
};

export const RESPONSE_OPTIONS = [
  "No Response",
  "Replied - Interested",
  "Replied - Not Interested",
  "Bounced",
] as const;

export function scoreBand(score: number): "high" | "mid" | "low" {
  return score >= 70 ? "high" : score >= 45 ? "mid" : "low";
}
