CREATE TABLE public.searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keywords TEXT[] NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  total_results INTEGER NOT NULL DEFAULT 0,
  new_results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.search_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES public.searches(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL,
  posted_date DATE NOT NULL,
  days_ago INTEGER NOT NULL DEFAULT 0,
  employment_type TEXT NOT NULL,
  apply_url TEXT NOT NULL,
  matched_keywords TEXT[] NOT NULL DEFAULT '{}',
  is_new BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_jobs_search_id ON public.search_jobs(search_id);
CREATE INDEX idx_search_jobs_job_id ON public.search_jobs(job_id);
CREATE INDEX idx_searches_created_at ON public.searches(created_at DESC);

GRANT ALL ON public.searches TO service_role;
GRANT ALL ON public.search_jobs TO service_role;

ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_jobs ENABLE ROW LEVEL SECURITY;