-- Create encrypt and decrypt functions for WordPress passwords (reusing same pattern as API keys)
-- These functions already exist for API keys, so we can reuse them for WordPress passwords

-- Create a helper function to get decrypted WordPress password for a project (server-side only)
CREATE OR REPLACE FUNCTION public.get_wordpress_password(p_project_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted_password text;
BEGIN
  SELECT wordpress_password INTO v_encrypted_password
  FROM public.projects
  WHERE id = p_project_id;
  
  IF v_encrypted_password IS NULL OR v_encrypted_password = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN public.decrypt_api_key(v_encrypted_password);
END;
$$;