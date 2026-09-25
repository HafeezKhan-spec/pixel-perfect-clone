import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

import { IntentBadge } from "@/components/intent-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RESPONSE_OPTIONS, type CrmData, type JobDetail } from "@/lib/job-types";

export const Route = createFileRoute("/job/$jobId")({
  head: () => ({
    meta: [
      { title: "Job prospect — Job Market Pulse" },
      {
        name: "description",
        content: "Company details, intent scoring, contact and outreach tracking for one job posting.",
      },
      { property: "og:title", content: "Job prospect — Job Market Pulse" },
      {
        property: "og:description",
        content: "Company details, intent scoring, contact and outreach tracking for one job posting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobPage,
});

type Form = CrmData & { decision_maker: string; contact: string };

function Section({ n, title, children, action }: { n: number; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="numeric flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs text-primary">
          {n}
        </span>
        <h2 className="mr-auto text-base font-semibold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function JobPage() {
  const { jobId } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const job = useQuery({
    queryKey: ["job", jobId],
    queryFn: async (): Promise<JobDetail> => {
      const r = await fetch(`/api/job/${encodeURIComponent(jobId)}`);
      if (!r.ok) throw new Error("Could not load that job.");
      return (await r.json()) as JobDetail;
    },
  });

  const [form, setForm] = useState<Form | null>(null);
  useEffect(() => {
    if (job.data && !form) setForm({ ...job.data.crm, decision_maker: job.data.decision_maker, contact: job.data.contact });
  }, [job.data, form]);

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const r = await fetch(`/api/job/${encodeURIComponent(jobId)}/crm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!r.ok) throw new Error(((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? "Could not save.");
      return (await r.json()) as Form;
    },
    onSuccess: (saved) => {
      setForm(saved);
      qc.setQueryData<JobDetail>(["job", jobId], (old) =>
        old ? { ...old, decision_maker: saved.decision_maker, contact: saved.contact, crm: saved } : old,
      );
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rescore = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/job/${encodeURIComponent(jobId)}/score`, { method: "POST" });
      if (!r.ok) throw new Error(((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? "Scoring failed.");
      return (await r.json()) as JobDetail;
    },
    onSuccess: (d) => {
      qc.setQueryData(["job", jobId], d);
      qc.invalidateQueries({ queryKey: ["search"] });
      toast.success("Scoring updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const goBack = () => {
    if (window.history.length > 1) router.history.back();
    else router.navigate({ to: "/history" });
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" onClick={goBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {job.isPending ? (
        <div className="panel flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading job…
        </div>
      ) : job.isError || !job.data ? (
        <div className="panel px-6 py-16 text-center text-sm text-destructive">This job could not be loaded.</div>
      ) : (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">{job.data.job_title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{job.data.company}</p>
          </div>

          <Section n={1} title="Job info">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Company">{job.data.company}</Field>
              <Field label="Website">
                <a href={job.data.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {job.data.website.replace(/^https?:\/\//, "")} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Field>
              <Field label="Industry">{job.data.industry}</Field>
              <Field label="Date posted">{job.data.date_posted}</Field>
              <Field label="Source">{job.data.source}</Field>
              <Field label="Similar jobs (this company)"><span className="numeric">{job.data.similar_jobs_count}</span></Field>
              <Field label="Reposted?">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${job.data.is_reposted ? "border-accent/50 bg-accent/15 text-accent" : "border-border text-muted-foreground"}`}>
                  {job.data.is_reposted ? "Yes" : "No"}
                </span>
              </Field>
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Job description</p>
              <div className="mt-1 max-h-72 overflow-y-auto whitespace-pre-line rounded-md border border-border bg-background/40 p-3 text-sm leading-relaxed">
                {job.data.job_description}
              </div>
            </div>
          </Section>

          <Section
            n={2}
            title="Signal & scoring"
            action={
              <Button size="sm" variant="outline" onClick={() => rescore.mutate()} disabled={rescore.isPending}>
                {rescore.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Re-run scoring
              </Button>
            }
          >
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex flex-col items-center gap-1">
                <IntentBadge score={job.data.intent_score} size="lg" />
                <span className="text-xs text-muted-foreground">Intent score</span>
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <Field label="Signal category">{job.data.signal_category}</Field>
                <Field label="Recommended AE service">{job.data.ae_service}</Field>
                <div className="sm:col-span-2"><Field label="Reason for score">{job.data.reason_for_score}</Field></div>
                <div className="sm:col-span-2"><Field label="Outreach angle">{job.data.outreach_angle}</Field></div>
              </div>
            </div>
          </Section>

          {form ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(form);
              }}
            >
              <Section n={3} title="Contact">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="dm">Recommended decision-maker</Label>
                    <Input id="dm" value={form.decision_maker} onChange={(e) => set("decision_maker", e.target.value)} placeholder="Name, title" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact">Contact (email / phone)</Label>
                    <Input id="contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
                  </div>
                </div>
              </Section>

              <Section n={4} title="Outreach tracking">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="dc">Date contacted</Label>
                    <Input id="dc" type="date" value={form.date_contacted ?? ""} onChange={(e) => set("date_contacted", e.target.value || null)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Response</Label>
                    <Select value={form.response ?? ""} onValueChange={(v) => set("response", v)}>
                      <SelectTrigger><SelectValue placeholder="Select a response" /></SelectTrigger>
                      <SelectContent>
                        {RESPONSE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch id="meeting" checked={form.meeting} onCheckedChange={(v) => set("meeting", v)} />
                      <Label htmlFor="meeting">Meeting booked</Label>
                    </div>
                    {form.meeting ? (
                      <Input type="date" aria-label="Meeting date" value={form.meeting_date ?? ""} onChange={(e) => set("meeting_date", e.target.value || null)} />
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch id="opp" checked={form.opportunity} onCheckedChange={(v) => set("opportunity", v)} />
                      <Label htmlFor="opp">Opportunity</Label>
                    </div>
                    {form.opportunity ? (
                      <Textarea rows={2} placeholder="Deal stage / notes" value={form.opportunity_notes ?? ""} onChange={(e) => set("opportunity_notes", e.target.value || null)} />
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rev">Revenue ($)</Label>
                    <Input
                      id="rev"
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      disabled={!form.opportunity}
                      value={form.revenue ?? ""}
                      onChange={(e) => set("revenue", e.target.value === "" ? null : Number(e.target.value))}
                      placeholder={form.opportunity ? "0.00" : "Set an opportunity first"}
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button type="submit" disabled={save.isPending}>
                    {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                </div>
              </Section>
            </form>
          ) : null}
        </div>
      )}
    </main>
  );
}
