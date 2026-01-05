-- Update bucket to be public for easier file access
UPDATE storage.buckets SET public = true WHERE id = 'project-files';