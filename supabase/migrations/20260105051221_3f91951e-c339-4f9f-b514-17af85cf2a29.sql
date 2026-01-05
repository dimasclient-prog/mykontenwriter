-- Add columns for storing API keys per provider (encrypted)
ALTER TABLE public.master_settings 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT,
ADD COLUMN IF NOT EXISTS qwen_api_key TEXT;

-- Drop and recreate the function with updated logic
DROP FUNCTION IF EXISTS public.get_user_api_key(UUID);

CREATE FUNCTION public.get_user_api_key(p_user_id UUID)
RETURNS TABLE(ai_provider TEXT, api_key TEXT, default_model TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider TEXT;
  v_encrypted_key TEXT;
  v_model TEXT;
BEGIN
  -- Get the current provider and model
  SELECT ms.ai_provider::TEXT, ms.default_model
  INTO v_provider, v_model
  FROM master_settings ms
  WHERE ms.user_id = p_user_id;

  IF v_provider IS NULL THEN
    RETURN;
  END IF;

  -- Get the encrypted key based on provider
  CASE v_provider
    WHEN 'openai' THEN
      SELECT ms.openai_api_key INTO v_encrypted_key
      FROM master_settings ms WHERE ms.user_id = p_user_id;
    WHEN 'gemini' THEN
      SELECT ms.gemini_api_key INTO v_encrypted_key
      FROM master_settings ms WHERE ms.user_id = p_user_id;
    WHEN 'deepseek' THEN
      SELECT ms.deepseek_api_key INTO v_encrypted_key
      FROM master_settings ms WHERE ms.user_id = p_user_id;
    WHEN 'qwen' THEN
      SELECT ms.qwen_api_key INTO v_encrypted_key
      FROM master_settings ms WHERE ms.user_id = p_user_id;
    ELSE
      -- Fallback to legacy api_key column
      SELECT ms.api_key INTO v_encrypted_key
      FROM master_settings ms WHERE ms.user_id = p_user_id;
  END CASE;

  -- Decrypt and return
  IF v_encrypted_key IS NOT NULL AND v_encrypted_key != '' THEN
    RETURN QUERY SELECT v_provider, public.decrypt_api_key(v_encrypted_key), v_model;
  ELSE
    RETURN QUERY SELECT v_provider, ''::TEXT, v_model;
  END IF;
END;
$$;