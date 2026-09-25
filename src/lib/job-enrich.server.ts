import type { JobResult } from "./job-types";

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length]!;

const INDUSTRIES = ["SaaS", "Fintech", "Healthcare", "Logistics", "Retail", "Media", "Energy", "Robotics"];
const SIGNALS = [
  "Team expansion",
  "New product launch",
  "Backfill / churn",
  "Tech stack migration",
  "Market entry",
  "Scaling engineering",
];
const SERVICES = [
  "Staff augmentation",
  "Dedicated delivery team",
  "Technical recruiting",
  "Platform modernization",
  "Cloud & DevOps consulting",
];
const FIRST = ["Priya", "Daniel", "Maria", "Tom", "Aisha", "Lukas", "Chen", "Sofia", "Rahul", "Emma"];
const LAST = ["Sharma", "Becker", "Silva", "Nguyen", "Okafor", "Kowalski", "Rossi", "Patel", "Larsen"];
const ROLES = ["VP Engineering", "CTO", "Head of Talent", "Engineering Director", "Head of Product"];

function domain(company: string) {
  return company.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "") + ".com";
}

export function enrichJob(job: JobResult, similarCount: number) {
  const s = hash(job.job_id);
  const industry = pick(INDUSTRIES, hash(job.company));
  const signal = pick(SIGNALS, s >> 2);
  const service = pick(SERVICES, s >> 4);
  const reposted = (s >> 6) % 4 === 0;
  let score = 35 + ((s >> 8) % 40) + Math.min(similarCount, 5) * 4 + (reposted ? 8 : 0);
  if (job.days_ago <= 3) score += 5;
  score = Math.min(99, score);
  const first = pick(FIRST, hash(job.company) >> 3);
  const last = pick(LAST, hash(job.company) >> 7);
  const role = pick(ROLES, hash(job.company) >> 11);
  const dom = domain(job.company);

  return {
    job_id: job.job_id,
    company: job.company,
    website: `https://www.${dom}`,
    industry,
    job_title: job.job_title,
    job_description: [
      `${job.company} is hiring a ${job.job_title} to join its ${industry.toLowerCase()} team (${job.location}, ${job.employment_type.toLowerCase()}).`,
      "",
      "What you'll do:",
      "• Design, build and ship features end-to-end with a cross-functional squad.",
      "• Own code quality, reviews and production reliability for your area.",
      "• Work closely with product and design to scope and prioritise work.",
      "",
      "What we're looking for:",
      "• 3+ years of hands-on experience in a similar role.",
      "• Strong communication skills and comfort working asynchronously.",
      "• Experience in fast-growing teams is a plus.",
      "",
      `Listed on ${job.platform}.`,
    ].join("\n"),
    date_posted: job.posted_date,
    source: job.platform,
    similar_jobs_count: similarCount,
    is_reposted: reposted,
    signal_category: signal,
    ae_service: service,
    intent_score: score,
    reason_for_score: `${job.company} has ${similarCount} open role${similarCount === 1 ? "" : "s"} in this run${reposted ? " and has reposted this listing, suggesting difficulty filling it" : ""}. The pattern points to ${signal.toLowerCase()}.`,
    outreach_angle: `Lead with how ${service.toLowerCase()} can help ${job.company} hit its hiring goals faster, referencing the ${job.job_title} opening.`,
    decision_maker: `${first} ${last}, ${role}`,
    contact: `${first.toLowerCase()}.${last.toLowerCase()}@${dom}`,
  };
}
