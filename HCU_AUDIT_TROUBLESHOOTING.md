# HCU Audit Troubleshooting Guide

## Error: "Failed to send a request to the Edge Function"

### Penyebab
Edge Function `audit-content-ai` belum di-deploy ke Supabase.

### Solusi

#### Opsi 1: Deploy via Supabase CLI (Recommended)

1. **Install Supabase CLI**
   ```bash
   # Windows (via Scoop)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # macOS (via Homebrew)
   brew install supabase/tap/supabase
   
   # Linux
   curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
   ```

2. **Login ke Supabase**
   ```bash
   supabase login
   ```

3. **Link Project**
   ```bash
   cd mykontenwriter
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   Dapatkan `YOUR_PROJECT_REF` dari:
   - Supabase Dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
   - Atau dari Settings > General > Reference ID

4. **Deploy Function**
   ```bash
   supabase functions deploy audit-content-ai
   ```

5. **Verify Deployment**
   ```bash
   supabase functions list
   ```
   
   Pastikan `audit-content-ai` muncul dalam list.

#### Opsi 2: Deploy via Supabase Dashboard

1. **Buka Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/functions

2. **Create New Function**
   - Click "Create a new function"
   - Name: `audit-content-ai`
   - Runtime: Deno

3. **Copy Function Code**
   - Buka file: `supabase/functions/audit-content-ai/index.ts`
   - Copy seluruh isi file
   - Paste ke editor di dashboard

4. **Deploy**
   - Click "Deploy function"
   - Wait for deployment to complete

5. **Verify**
   - Function akan muncul di list dengan status "Active"
   - Check logs untuk memastikan tidak ada error

#### Opsi 3: Deploy via GitHub Actions (Advanced)

Buat file `.github/workflows/deploy-functions.yml`:

```yaml
name: Deploy Supabase Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy functions
        run: |
          supabase functions deploy audit-content-ai --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Error: "Failed to fetch page content"

### Penyebab
- URL tidak valid atau tidak dapat diakses
- Website memblokir scraping
- Website memerlukan JavaScript untuk render konten

### Solusi
1. Pastikan URL valid dan dapat diakses di browser
2. Coba URL lain yang lebih sederhana (tidak heavy JavaScript)
3. Gunakan URL dari website yang tidak memblokir bot

## Error: "Failed to parse AI response as JSON"

### Penyebab
- AI tidak mengembalikan format JSON yang valid
- Response terpotong karena token limit
- AI model tidak mengikuti instruksi format

### Solusi
1. Coba lagi (AI response bisa bervariasi)
2. Gunakan model AI yang lebih capable (GPT-4 vs GPT-3.5)
3. Check Supabase function logs untuk melihat raw AI response

## Error: "Persona not found"

### Penyebab
Persona yang dipilih tidak ada atau sudah dihapus.

### Solusi
1. Buat persona baru di tab "Market Insight"
2. Pilih persona yang valid dari dropdown

## Error: "Content too short or failed to extract text"

### Penyebab
- Konten di URL terlalu pendek (< 100 karakter)
- Gagal extract text dari HTML
- Website menggunakan heavy JavaScript rendering

### Solusi
1. Pastikan URL mengarah ke halaman dengan konten substansial
2. Coba URL artikel/blog post yang panjang
3. Hindari URL yang hanya landing page atau homepage

## Checking Function Logs

### Via Supabase Dashboard
1. Go to: Edge Functions > audit-content-ai
2. Click "Logs" tab
3. Filter by time range
4. Look for errors or warnings

### Via CLI
```bash
supabase functions logs audit-content-ai
```

## Testing Function Manually

### Via cURL
```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/audit-content-ai' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "url": "https://example.com/article",
    "personaData": {
      "name": "Test User",
      "role": "Customer",
      "painPoints": ["test"],
      "goals": ["test"],
      "challenges": ["test"]
    },
    "projectId": "test-project-id"
  }'
```

### Via Postman
1. Method: POST
2. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/audit-content-ai`
3. Headers:
   - `Authorization: Bearer YOUR_ANON_KEY`
   - `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "url": "https://example.com/article",
     "personaData": {
       "name": "Test User",
       "role": "Customer",
       "painPoints": ["test"],
       "goals": ["test"],
       "challenges": ["test"]
     },
     "projectId": "test-project-id"
   }
   ```

## Common Issues

### Issue: Function timeout
**Solution**: Increase function timeout in Supabase settings (default 60s)

### Issue: API rate limit
**Solution**: Wait a few minutes or upgrade AI provider plan

### Issue: Missing dependencies
**Solution**: Ensure `_shared/get-user-credentials.ts` exists and is accessible

### Issue: CORS errors
**Solution**: CORS headers already configured, check browser console for details

## Getting Help

1. **Check Logs**: Always check Supabase function logs first
2. **Browser Console**: Check browser console for client-side errors
3. **Network Tab**: Check network tab to see actual request/response
4. **GitHub Issues**: Report bugs with logs and error messages

## Useful Commands

```bash
# List all functions
supabase functions list

# View function logs
supabase functions logs audit-content-ai

# Delete and redeploy
supabase functions delete audit-content-ai
supabase functions deploy audit-content-ai

# Test locally (if supported)
supabase functions serve audit-content-ai
```

## Environment Variables

Function menggunakan credentials dari database (encrypted API keys).
Tidak perlu set environment variables tambahan.

## Performance Tips

1. **URL Selection**: Pilih URL dengan konten yang clean dan tidak terlalu panjang
2. **Model Selection**: Gunakan model yang balance antara speed dan quality
3. **Caching**: Consider caching hasil audit untuk URL yang sama
4. **Batch Processing**: Jangan audit terlalu banyak URL sekaligus

## Security Notes

- API keys disimpan encrypted di database
- Function hanya bisa diakses dengan valid Supabase auth
- URL scraping menggunakan user-agent yang proper
- Tidak ada data sensitive yang di-log
