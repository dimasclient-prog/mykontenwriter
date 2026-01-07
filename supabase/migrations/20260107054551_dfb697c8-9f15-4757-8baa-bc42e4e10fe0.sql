-- Create personas table
CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  location TEXT,
  family_status TEXT,
  pain_points TEXT[] DEFAULT '{}',
  concerns TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on personas
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- Policies for personas - Users can manage personas of their own projects
CREATE POLICY "Users can view personas of their projects"
ON public.personas
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects WHERE projects.id = personas.project_id AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can insert personas to their projects"
ON public.personas
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM projects WHERE projects.id = personas.project_id AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update personas of their projects"
ON public.personas
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM projects WHERE projects.id = personas.project_id AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete personas of their projects"
ON public.personas
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM projects WHERE projects.id = personas.project_id AND projects.user_id = auth.uid()
));

-- Shared users policies for personas
CREATE POLICY "Shared users can view personas"
ON public.personas
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM project_shares ps
  WHERE ps.project_id = personas.project_id
  AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = lower((auth.jwt() ->> 'email'::text)))
));

CREATE POLICY "Shared editors can insert personas"
ON public.personas
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM project_shares ps
  WHERE ps.project_id = personas.project_id
  AND ps.role = 'editor'
  AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = lower((auth.jwt() ->> 'email'::text)))
));

CREATE POLICY "Shared editors can update personas"
ON public.personas
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM project_shares ps
  WHERE ps.project_id = personas.project_id
  AND ps.role = 'editor'
  AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = lower((auth.jwt() ->> 'email'::text)))
));

CREATE POLICY "Shared editors can delete personas"
ON public.personas
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM project_shares ps
  WHERE ps.project_id = personas.project_id
  AND ps.role = 'editor'
  AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = lower((auth.jwt() ->> 'email'::text)))
));

-- Add persona-related columns to articles table
ALTER TABLE public.articles 
ADD COLUMN persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
ADD COLUMN funnel_type TEXT,
ADD COLUMN article_type TEXT;

-- Create index for faster persona-based queries
CREATE INDEX idx_articles_persona_id ON public.articles(persona_id);
CREATE INDEX idx_personas_project_id ON public.personas(project_id);

-- Create trigger for updating personas updated_at
CREATE TRIGGER update_personas_updated_at
BEFORE UPDATE ON public.personas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();