import type { JobResult, SearchStats } from "./job-types";

const COMPANIES = [
  "Northwind Labs",
  "Brightpath Systems",
  "Kestrel Digital",
  "Orbit Analytics",
  "Cobalt & Finch",
  "Lumenwave",
  "Redcliff Technologies",
  "Verdant Cloud",
  "Halcyon Software",
  "Tidewater AI",
  "Quantic Retail",
  "Ironbark Health",
  "Nimbus Freight",
  "Sable Fintech",
  "Ardent Robotics",
  "Meridian Media",
  "Foxglove Studios",
  "Polaris Grid",
  "Silverlane Bank",
  "Juniper Mobility",
];

const PLATFORMS = ["LinkedIn", "Indeed", "Glassdoor", "Wellfound", "Naukri", "Monster"];
const EMPLOYMENT_TYPES = ["Full-time", "Contract", "Part-time", "Internship", "Freelance"];
const SENIORITY = ["Junior", "", "Senior", "Lead", "Staff", "Mid-level", "Principal"];
const SUFFIX = ["", "(Remote)", "- Platform Team", "- Growth", "II", "III", "- Core Products"];
const CITIES = [
  "Remote",
  "Bengaluru, IN",
  "Berlin, DE",
  "London, UK",
  "Austin, TX",
  "Toronto, CA",
  "Amsterdam, NL",
  "New York, NY",
  "Pune, IN",
  "Lisbon, PT",
];

const STOPWORDS = new Set(["a", "an", "the", "and", "or", "of", "in", "for", "with", "jobs", "job"]);

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tokens(keyword: string): string[] {
  return keyword
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/**
 * Deterministic sample listings. The same keyword always produces the same job
 * ids, so repeat searches can distinguish genuinely new postings from seen ones.
 */
export function generateJobs(keywords: string[], location: string): JobResult[] {
  const byId = new Map<string, JobResult>();

  keywords.forEach((keyword, kIndex) => {
    const base = hash(keyword.toLowerCase());
    const count = 9 + (base % 9);
    for (let i = 0; i < count; i++) {
      const seed = hash(`${keyword.toLowerCase()}#${i}`);
      const seniority = pick(SENIORITY, seed);
      const suffix = pick(SUFFIX, seed >> 3);
      const title = [seniority, titleCase(keyword), suffix].filter(Boolean).join(" ");
      const company = pick(COMPANIES, seed >> 5);
      const daysAgo = (seed >> 7) % 30;
      const posted = new Date(Date.now() - daysAgo * 86400000);
      const jobId = `${slug(keyword)}-${slug(company)}-${i}`;
      if (byId.has(jobId)) continue;
      byId.set(jobId, {
        job_id: jobId,
        job_title: title,
        company,
        location: location.trim() || pick(CITIES, seed >> 11),
        platform: pick(PLATFORMS, seed >> 13),
        posted_date: posted.toISOString().slice(0, 10),
        days_ago: daysAgo,
        employment_type: pick(EMPLOYMENT_TYPES, seed >> 17 + kIndex),
        apply_url: `https://example-jobs.dev/apply/${jobId}`,
        matched_keywords: [keyword],
        is_new: true,
      });
    }
  });

  const keywordTokens = keywords.map((k) => ({ keyword: k, tokens: tokens(k) }));
  const jobs = [...byId.values()];
  for (const job of jobs) {
    const haystack = job.job_title.toLowerCase();
    const matched = keywordTokens
      .filter(({ tokens: t }) => t.length > 0 && t.every((token) => haystack.includes(token)))
      .map(({ keyword }) => keyword);
    if (matched.length > 0) job.matched_keywords = matched;
  }

  return jobs.sort((a, b) => a.days_ago - b.days_ago);
}

export function buildStats(jobs: JobResult[], keywords: string[]): SearchStats {
  const by_platform: Record<string, number> = {};
  const by_employment_type: Record<string, number> = {};
  const by_day: Record<string, number> = {};
  const companyCounts: Record<string, number> = {};
  const by_keyword: Record<string, number> = {};

  for (const k of keywords) by_keyword[k] = 0;

  for (const job of jobs) {
    by_platform[job.platform] = (by_platform[job.platform] ?? 0) + 1;
    by_employment_type[job.employment_type] = (by_employment_type[job.employment_type] ?? 0) + 1;
    by_day[job.posted_date] = (by_day[job.posted_date] ?? 0) + 1;
    companyCounts[job.company] = (companyCounts[job.company] ?? 0) + 1;
    for (const k of job.matched_keywords) by_keyword[k] = (by_keyword[k] ?? 0) + 1;
  }

  const top_companies = Object.entries(companyCounts)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const sortedDays = Object.fromEntries(Object.entries(by_day).sort(([a], [b]) => a.localeCompare(b)));

  return { by_platform, by_employment_type, by_day: sortedDays, top_companies, by_keyword };
}
