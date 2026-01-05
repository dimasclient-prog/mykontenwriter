-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Shared users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Shared editors can update projects" ON public.projects;

-- Recreate the policies using a more efficient approach without subqueries that cause recursion
-- For viewing shared projects - use a security definer function instead

CREATE OR REPLACE FUNCTION public.user_has_project_access(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_shares ps
    WHERE ps.project_id = p_project_id
    AND (
      ps.shared_with_user_id = p_user_id 
      OR ps.shared_with_email = (SELECT email FROM auth.users WHERE id = p_user_id)
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_editor_access(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_shares ps
    WHERE ps.project_id = p_project_id
    AND ps.role = 'editor'
    AND (
      ps.shared_with_user_id = p_user_id 
      OR ps.shared_with_email = (SELECT email FROM auth.users WHERE id = p_user_id)
    )
  )
$$;

-- Recreate policies using the helper functions
CREATE POLICY "Shared users can view projects"
ON public.projects
FOR SELECT
USING (public.user_has_project_access(id, auth.uid()));

CREATE POLICY "Shared editors can update projects"
ON public.projects
FOR UPDATE
USING (public.user_has_editor_access(id, auth.uid()));