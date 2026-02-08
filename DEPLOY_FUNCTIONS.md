# Deploy Supabase Edge Functions

## Prerequisites
1. Install Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
2. Login to Supabase: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`

## Deploy HCU Audit Function

```bash
cd mykontenwriter
supabase functions deploy audit-content-ai
```

## Deploy All Functions

```bash
supabase functions deploy
```

## Verify Deployment

Check in Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/functions
2. Verify `audit-content-ai` is listed and active
3. Check logs for any errors

## Alternative: Deploy via Supabase Dashboard

1. Go to Edge Functions in Supabase Dashboard
2. Click "Create a new function"
3. Name: `audit-content-ai`
4. Copy-paste code from `supabase/functions/audit-content-ai/index.ts`
5. Deploy

## Testing

After deployment, test the function:

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/audit-content-ai' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://example.com","personaData":{"name":"Test"},"projectId":"test"}'
```

## Troubleshooting

### Function not found
- Verify function is deployed: `supabase functions list`
- Check function name matches exactly: `audit-content-ai`

### Permission denied
- Verify you're logged in: `supabase login`
- Check project is linked: `supabase projects list`

### Import errors
- Ensure all imports use Deno-compatible URLs
- Check `_shared` folder is accessible

## Required Functions for HCU Audit

1. ✅ `calculate-hcu-score` - Calculate scores and recommendations
2. ⚠️ `audit-content-ai` - **NEEDS DEPLOYMENT** - AI-powered content analysis

## Quick Deploy Script

Create `deploy-hcu.sh`:

```bash
#!/bin/bash
echo "Deploying HCU Audit functions..."
supabase functions deploy audit-content-ai
supabase functions deploy calculate-hcu-score
echo "Deployment complete!"
```

Run: `chmod +x deploy-hcu.sh && ./deploy-hcu.sh`
