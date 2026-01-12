-- Add used_keywords column to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS used_keywords TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.articles.used_keywords IS 'Keywords that were selected and used during article/title generation';