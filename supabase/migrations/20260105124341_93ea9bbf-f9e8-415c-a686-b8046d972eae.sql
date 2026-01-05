-- Fix permission errors by removing references to auth.users in RLS and helper functions
-- Root cause: policies/functions were selecting from auth.users which is not allowed, causing project/article queries to fail.

-- 1) Drop policies that depend on the old helper functions (required before dropping functions)
DROP POLICY IF EXISTS "Shared users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Shared editors can update projects" ON public.projects;

-- 2) Drop old helper functions (2-arg versions)
DROP FUNCTION IF EXISTS public.user_has_project_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.user_has_editor_access(uuid, uuid);

-- 3) Recreate helper functions using email passed in (no auth.users access)
CREATE OR REPLACE FUNCTION public.user_has_project_access(p_project_id uuid, p_user_id uuid, p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_shares ps
    WHERE ps.project_id = p_project_id
      AND (
        ps.shared_with_user_id = p_user_id
        OR (p_email IS NOT NULL AND p_email <> '' AND ps.shared_with_email = lower(p_email))
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_editor_access(p_project_id uuid, p_user_id uuid, p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_shares ps
    WHERE ps.project_id = p_project_id
      AND ps.role = 'editor'
      AND (
        ps.shared_with_user_id = p_user_id
        OR (p_email IS NOT NULL AND p_email <> '' AND ps.shared_with_email = lower(p_email))
      )
  )
$$;

-- 4) Recreate projects policies using JWT email claim (no auth.users)
CREATE POLICY "Shared users can view projects"
ON public.projects
FOR SELECT
USING (
  public.user_has_project_access(id, auth.uid(), auth.jwt() ->> 'email')
);

CREATE POLICY "Shared editors can update projects"
ON public.projects
FOR UPDATE
USING (
  public.user_has_editor_access(id, auth.uid(), auth.jwt() ->> 'email')
);

-- 5) Replace project_shares policies (remove auth.users + avoid recursion via projects)
DROP POLICY IF EXISTS "Users can view shares for their email" ON public.project_shares;
DROP POLICY IF EXISTS "Project owners can manage shares" ON public.project_shares;
DROP POLICY IF EXISTS "Inviter can manage shares" ON public.project_shares;

CREATE POLICY "Users can view shares for their email"
ON public.project_shares
FOR SELECT
USING (
  shared_with_user_id = auth.uid()
  OR shared_with_email = lower(auth.jwt() ->> 'email')
);

-- Manage shares: allow only the inviter to insert/update/delete
CREATE POLICY "Inviter can manage shares"
ON public.project_shares
FOR ALL
USING (invited_by = auth.uid())
WITH CHECK (invited_by = auth.uid());

-- 6) Replace articles shared policies (remove auth.users)
DROP POLICY IF EXISTS "Shared users can view articles" ON public.articles;
DROP POLICY IF EXISTS "Shared editors can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Shared editors can update articles" ON public.articles;
DROP POLICY IF EXISTS "Shared editors can delete articles" ON public.articles;

CREATE POLICY "Shared users can view articles"
ON public.articles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.project_shares ps
    WHERE ps.project_id = articles.project_id
      AND (
        ps.shared_with_user_id = auth.uid()
        OR ps.shared_with_email = lower(auth.jwt() ->> 'email')
      )
  )
);

CREATE POLICY "Shared editors can insert articles"
ON public.articles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.project_shares ps
    WHERE ps.project_id = articles.project_id
      AND ps.role = 'editor'
      AND (
        ps.shared_with_user_id = auth.uid()
        OR ps.shared_with_email = lower(auth.jwt() ->> 'email')
      )
  )
);

CREATE POLICY "Shared editors can update articles"
ON public.articles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.project_shares ps
    WHERE ps.project_id = articles.project_id
      AND ps.role = 'editor'
      AND (
        ps.shared_with_user_id = auth.uid()
        OR ps.shared_with_email = lower(auth.jwt() ->> 'email')
      )
  )
);

CREATE POLICY "Shared editors can delete articles"
ON public.articles
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.project_shares ps
    WHERE ps.project_id = articles.project_id
      AND ps.role = 'editor'
      AND (
        ps.shared_with_user_id = auth.uid()
        OR ps.shared_with_email = lower(auth.jwt() ->> 'email')
      )
  )
);

-- 7) Normalize existing share emails to lowercase (best-effort)
UPDATE public.project_shares
SET shared_with_email = lower(shared_with_email)
WHERE shared_with_email IS NOT NULL;