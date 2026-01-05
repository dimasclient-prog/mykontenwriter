-- Create enum for share roles
CREATE TYPE public.share_role AS ENUM ('viewer', 'editor');

-- Create project_shares table for sharing projects with other users
CREATE TABLE public.project_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role share_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, shared_with_email)
);

-- Enable Row Level Security
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_project_shares_email ON public.project_shares(shared_with_email);
CREATE INDEX idx_project_shares_user_id ON public.project_shares(shared_with_user_id);
CREATE INDEX idx_project_shares_project_id ON public.project_shares(project_id);

-- Policy: Project owners can manage shares
CREATE POLICY "Project owners can manage shares"
ON public.project_shares
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_shares.project_id 
    AND p.user_id = auth.uid()
  )
);

-- Policy: Shared users can view their own share records
CREATE POLICY "Users can view shares for their email"
ON public.project_shares
FOR SELECT
USING (
  shared_with_user_id = auth.uid() OR 
  shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Update projects RLS policies to allow shared users access
CREATE POLICY "Shared users can view projects"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_shares ps 
    WHERE ps.project_id = projects.id 
    AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

-- Shared editors can update projects
CREATE POLICY "Shared editors can update projects"
ON public.projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_shares ps 
    WHERE ps.project_id = projects.id 
    AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND ps.role = 'editor'
  )
);

-- Allow shared users to view articles of shared projects
CREATE POLICY "Shared users can view articles"
ON public.articles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_shares ps 
    WHERE ps.project_id = articles.project_id 
    AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

-- Allow shared editors to manage articles
CREATE POLICY "Shared editors can insert articles"
ON public.articles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_shares ps 
    WHERE ps.project_id = articles.project_id 
    AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND ps.role = 'editor'
  )
);

CREATE POLICY "Shared editors can update articles"
ON public.articles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_shares ps 
    WHERE ps.project_id = articles.project_id 
    AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND ps.role = 'editor'
  )
);

CREATE POLICY "Shared editors can delete articles"
ON public.articles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_shares ps 
    WHERE ps.project_id = articles.project_id 
    AND (ps.shared_with_user_id = auth.uid() OR ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND ps.role = 'editor'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_shares_updated_at
BEFORE UPDATE ON public.project_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();