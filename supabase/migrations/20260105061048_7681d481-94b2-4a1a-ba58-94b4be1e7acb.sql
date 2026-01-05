-- Add WordPress integration fields to projects table
ALTER TABLE public.projects 
ADD COLUMN wordpress_url TEXT,
ADD COLUMN wordpress_username TEXT,
ADD COLUMN wordpress_password TEXT;