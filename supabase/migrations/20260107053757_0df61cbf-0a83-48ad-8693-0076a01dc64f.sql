-- Create a secure settings table for encryption keys (only accessible via SECURITY DEFINER functions)
CREATE TABLE IF NOT EXISTS public.secure_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS but don't allow any direct access - only through functions
ALTER TABLE public.secure_settings ENABLE ROW LEVEL SECURITY;

-- No policies = no direct access from clients

-- Insert master encryption key (only once)
INSERT INTO public.secure_settings (key, value)
VALUES ('master_encryption_key', encode(extensions.digest(gen_random_uuid()::text || now()::text || random()::text, 'sha256'), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- Create improved encrypt function that uses secure settings
CREATE OR REPLACE FUNCTION public.encrypt_api_key(plain_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  master_key text;
BEGIN
  IF plain_key IS NULL OR plain_key = '' THEN
    RETURN NULL;
  END IF;
  
  -- Get master key from secure settings (bypasses RLS due to SECURITY DEFINER)
  SELECT value INTO master_key 
  FROM public.secure_settings 
  WHERE key = 'master_encryption_key';
  
  IF master_key IS NULL THEN
    RAISE EXCEPTION 'Master encryption key not configured';
  END IF;
  
  -- Encrypt using the master key (key NOT stored alongside data)
  RETURN encode(extensions.pgp_sym_encrypt(plain_key, master_key), 'base64');
END;
$$;

-- Create improved decrypt function that uses secure settings
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  master_key text;
  cipher_text bytea;
  parts text[];
  key_text text;
BEGIN
  IF encrypted_key IS NULL OR encrypted_key = '' THEN
    RETURN NULL;
  END IF;
  
  -- Handle legacy format (contains : separator with embedded key)
  IF position(':' in encrypted_key) > 0 THEN
    parts := string_to_array(encrypted_key, ':');
    BEGIN
      cipher_text := decode(parts[1], 'base64');
      key_text := convert_from(decode(parts[2], 'base64'), 'UTF8');
      RETURN extensions.pgp_sym_decrypt(cipher_text, key_text);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN encrypted_key;
    END;
  END IF;
  
  -- New format: just base64 encoded ciphertext
  BEGIN
    SELECT value INTO master_key 
    FROM public.secure_settings 
    WHERE key = 'master_encryption_key';
    
    IF master_key IS NULL THEN
      RAISE EXCEPTION 'Master encryption key not configured';
    END IF;
    
    cipher_text := decode(encrypted_key, 'base64');
    RETURN extensions.pgp_sym_decrypt(cipher_text, master_key);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN encrypted_key;
  END;
END;
$$;

-- Make the project-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'project-files';