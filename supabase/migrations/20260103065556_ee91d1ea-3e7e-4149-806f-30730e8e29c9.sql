-- Create enum types
CREATE TYPE public.project_mode AS ENUM ('auto', 'advanced');
CREATE TYPE public.project_language AS ENUM ('indonesian', 'english', 'other');
CREATE TYPE public.article_status AS ENUM ('todo', 'in-progress', 'completed');
CREATE TYPE public.ai_provider AS ENUM ('openai', 'gemini', 'deepseek', 'qwen');

-- Create master_settings table (per user)
CREATE TABLE public.master_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_provider ai_provider NOT NULL DEFAULT 'openai',
  api_key TEXT DEFAULT '',
  default_model TEXT NOT NULL DEFAULT 'gpt-4.1',
  default_article_length INTEGER NOT NULL DEFAULT 500,
  default_brand_voice TEXT DEFAULT 'Professional, informative, and helpful',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode project_mode NOT NULL DEFAULT 'auto',
  language project_language NOT NULL DEFAULT 'indonesian',
  custom_language TEXT,
  brand_voice TEXT,
  website_url TEXT,
  business_context TEXT,
  product TEXT,
  target_market TEXT,
  persona TEXT,
  pain_points TEXT[],
  value_proposition TEXT,
  strategy_pack JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  status article_status NOT NULL DEFAULT 'todo',
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- RLS policies for master_settings
CREATE POLICY "Users can view their own settings"
ON public.master_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.master_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.master_settings FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for projects
CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for articles (through project ownership)
CREATE POLICY "Users can view articles of their projects"
ON public.articles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = articles.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert articles to their projects"
ON public.articles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = articles.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update articles of their projects"
ON public.articles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = articles.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete articles of their projects"
ON public.articles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = articles.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_master_settings_updated_at
BEFORE UPDATE ON public.master_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_articles_project_id ON public.articles(project_id);
CREATE INDEX idx_articles_status ON public.articles(status);