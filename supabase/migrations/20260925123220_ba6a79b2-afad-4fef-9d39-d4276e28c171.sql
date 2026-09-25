CREATE TABLE public.job_details (
  job_id text PRIMARY KEY,
  company text NOT NULL,
  website text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  job_title text NOT NULL,
  job_description text NOT NULL DEFAULT '',
  date_posted date NOT NULL,
  source text NOT NULL DEFAULT '',
  similar_jobs_count integer NOT NULL DEFAULT 0,
  is_reposted boolean NOT NULL DEFAULT false,
  signal_category text NOT NULL DEFAULT '',
  ae_service text NOT NULL DEFAULT '',
  intent_score integer NOT NULL DEFAULT 0,
  reason_for_score text NOT NULL DEFAULT '',
  outreach_angle text NOT NULL DEFAULT '',
  decision_maker text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  date_contacted date,
  response text,
  meeting boolean NOT NULL DEFAULT false,
  meeting_date date,
  opportunity boolean NOT NULL DEFAULT false,
  opportunity_notes text,
  revenue numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.job_details TO service_role;
ALTER TABLE public.job_details ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER job_details_updated_at BEFORE UPDATE ON public.job_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();