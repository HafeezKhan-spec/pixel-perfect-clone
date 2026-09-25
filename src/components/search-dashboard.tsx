import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, Download, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import { IntentBadge } from "@/components/intent-badge";
import type { SearchResponse } from "@/lib/job-types";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

type SortKey = "newest" | "oldest" | "company" | "title";

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-4">
      <header className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="numeric mt-1 text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

export function SearchDashboard({ data }: { data: SearchResponse }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [keywordFilter, setKeywordFilter] = useState("all");

  const byPlatform = Object.entries(data.stats.by_platform).map(([name, count]) => ({
    name,
    count,
  }));
  const byType = Object.entries(data.stats.by_employment_type).map(([name, count]) => ({
    name,
    count,
  }));
  const byDay = Object.entries(data.stats.by_day).map(([date, count]) => ({
    date: date.slice(5),
    count,
  }));
  const byKeyword = Object.entries(data.stats.by_keyword).map(([name, count]) => ({ name, count }));

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = data.results.filter((job) => {
      const matchesKeyword =
        keywordFilter === "all" || job.matched_keywords.includes(keywordFilter);
      const matchesQuery =
        !needle ||
        `${job.job_title} ${job.company} ${job.location} ${job.platform}`
          .toLowerCase()
          .includes(needle);
      return matchesKeyword && matchesQuery;
    });
    list = [...list].sort((a, b) => {
      if (sort === "newest") return a.days_ago - b.days_ago;
      if (sort === "oldest") return b.days_ago - a.days_ago;
      if (sort === "company") return a.company.localeCompare(b.company);
      return a.job_title.localeCompare(b.job_title);
    });
    return list;
  }, [data.results, keywordFilter, query, sort]);

  const avgAge = data.results.length
    ? Math.round(data.results.reduce((sum, job) => sum + job.days_ago, 0) / data.results.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {data.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs"
            >
              {keyword}
            </span>
          ))}
          <span className="text-xs text-muted-foreground">
            {data.location ? `in ${data.location}` : "any location"}
          </span>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/export?search_id=${data.search_id}`}>
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </a>
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>
          <strong className="numeric">{data.new_results_count}</strong> new job
          {data.new_results_count === 1 ? "" : "s"} since your last search for these keywords
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total jobs" value={String(data.total_results)} hint="Across all keywords" />
        <StatCard label="New jobs" value={String(data.new_results_count)} hint="Not seen before" />
        <StatCard
          label="Platforms"
          value={String(byPlatform.length)}
          hint="Boards with listings"
        />
        <StatCard label="Avg. age" value={`${avgAge}d`} hint="Since posting" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Jobs by keyword" subtitle="How much demand each keyword surfaced">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byKeyword}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--color-chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Postings per day" subtitle="When these jobs went live">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={byDay}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="By platform" subtitle="Where the listings came from">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byPlatform} dataKey="count" nameKey="name" innerRadius={50} outerRadius={85}>
                {byPlatform.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
            {byPlatform.map((entry, index) => (
              <span key={entry.name} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                {entry.name} ({entry.count})
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Employment type" subtitle="Contract mix across results">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byType} layout="vertical">
              <CartesianGrid stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={92}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--color-chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Top hiring companies" subtitle="Most listings in this run">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.stats.top_companies.map((entry) => (
            <div
              key={entry.company}
              className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 text-sm"
            >
              <span className="truncate">{entry.company}</span>
              <span className="numeric text-primary">{entry.count}</span>
            </div>
          ))}
        </div>
      </Panel>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <h3 className="mr-auto text-sm font-semibold">Results ({rows.length})</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search results"
              className="h-9 w-48 bg-background/60 pl-8"
            />
          </div>
          <Select value={keywordFilter} onValueChange={setKeywordFilter}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Matched keyword" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All keywords</SelectItem>
              {data.keywords.map((keyword) => (
                <SelectItem key={keyword} value={keyword}>
                  {keyword}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="company">Company A–Z</SelectItem>
              <SelectItem value="title">Job title A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intent</TableHead>
                <TableHead>Job title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Matched keyword</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Apply</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    No jobs match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((job) => (
                  <TableRow
                    key={job.job_id}
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: "/job/$jobId", params: { jobId: job.job_id } })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter")
                        navigate({ to: "/job/$jobId", params: { jobId: job.job_id } });
                    }}
                  >
                    <TableCell>
                      <IntentBadge score={job.intent_score ?? 0} />
                    </TableCell>
                    <TableCell className="max-w-[16rem]">
                      <span className="font-medium">{job.job_title}</span>
                      {job.is_new ? (
                        <span className="ml-2 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                          New
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{job.company}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {job.matched_keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px]"
                          >
                            {keyword}
                          </span>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{job.location}</TableCell>
                    <TableCell className="text-muted-foreground">{job.platform}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {job.days_ago === 0 ? "Today" : `${job.days_ago}d ago`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{job.employment_type}</TableCell>
                    <TableCell className="text-right">
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Apply for ${job.job_title} (opens in new tab)`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
