-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to encrypt API key
CREATE OR REPLACE FUNCTION public.encrypt_api_key(plain_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF plain_key IS NULL OR plain_key = '' THEN
    RETURN NULL;
  END IF;
  -- Use a combination of project-specific salt for encryption
  encryption_key := 'lovable_api_key_encryption_v1_' || gen_random_uuid()::text;
  RETURN encode(pgp_sym_encrypt(plain_key, encryption_key), 'base64') || ':' || encode(encryption_key::bytea, 'base64');
END;
$$;

-- Create function to decrypt API key (only for service role via edge functions)
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parts text[];
  cipher_text bytea;
  key_text text;
BEGIN
  IF encrypted_key IS NULL OR encrypted_key = '' THEN
    RETURN NULL;
  END IF;
  
  -- Handle legacy unencrypted keys (they won't have the : separator)
  IF position(':' in encrypted_key) = 0 THEN
    RETURN encrypted_key;
  END IF;
  
  parts := string_to_array(encrypted_key, ':');
  cipher_text := decode(parts[1], 'base64');
  key_text := convert_from(decode(parts[2], 'base64'), 'UTF8');
  
  RETURN pgp_sym_decrypt(cipher_text, key_text);
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return the original (might be legacy unencrypted)
    RETURN encrypted_key;
END;
$$;

-- Create function to get decrypted API key for a user (for edge functions)
CREATE OR REPLACE FUNCTION public.get_user_api_key(p_user_id uuid)
RETURNS TABLE(api_key text, ai_provider text, default_model text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    public.decrypt_api_key(ms.api_key) as api_key,
    ms.ai_provider::text,
    ms.default_model
  FROM public.master_settings ms
  WHERE ms.user_id = p_user_id;
END;
$$;