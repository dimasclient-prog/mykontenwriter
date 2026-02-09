
-- Create topical_coverage table to store analysis snapshots
CREATE TABLE public.topical_coverage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  core_topic JSONB NOT NULL DEFAULT '{}'::jsonb,
  topical_expansion JSONB NOT NULL DEFAULT '[]'::jsonb,
  semantic_network JSONB NOT NULL DEFAULT '[]'::jsonb,
  url_structure JSONB NOT NULL DEFAULT '[]'::jsonb,
  coverage_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.topical_coverage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own topical coverage analyses"
ON public.topical_coverage
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.user_has_project_access(project_id, auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "Users can create topical coverage analyses"
ON public.topical_coverage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topical coverage analyses"
ON public.topical_coverage
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for efficient project lookups
CREATE INDEX idx_topical_coverage_project_id ON public.topical_coverage(project_id);
CREATE INDEX idx_topical_coverage_user_id ON public.topical_coverage(user_id);
