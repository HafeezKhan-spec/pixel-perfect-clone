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
