# Website Analysis Feature

## Overview
Fitur analisa URL otomatis untuk Basic Mode yang menggunakan AI untuk menganalisa website dan mengisi data project secara otomatis.

## Fitur yang Diimplementasikan

### 1. Analisa Website Otomatis
Ketika user memilih **Basic Mode** dan memasukkan URL website, sistem akan:

#### a. Mengekstrak Informasi Website
- Meta title
- Meta description  
- Meta keywords
- Open Graph tags
- Konten halaman (3000 karakter pertama)

#### b. Analisa AI dengan OpenAI
AI akan menganalisa website dan menghasilkan:

1. **Basic Information** (otomatis mengisi Project Settings):
   - Business Name
   - Product/Service description
   - Target Market

2. **Keywords** (10 ide keyword relevan):
   - Berdasarkan meta title, description, dan konten
   - Disimpan di project keywords

3. **Personas** (3 customer personas):
   - Name
   - Description/Role
   - Pain Points (array)
   - Goals (array)

4. **Brand Voice**:
   - Analisa tone dan style komunikasi brand
   - Disimpan di project settings

## File yang Dimodifikasi

### 1. `/supabase/functions/analyze-website/index.ts` (NEW)
Supabase Edge Function untuk:
- Fetch website content
- Extract meta information
- Call OpenAI API untuk analisa
- Return structured data

### 2. `/src/pages/NewProject.tsx` (MODIFIED)
- Menambahkan call ke `analyze-website` function di basic mode
- Mengisi project data dengan hasil analisa
- Membuat 3 personas dari hasil analisa

## Flow Proses

```
User Input URL → Basic Mode Selected
    ↓
[Step 1: Scraping]
- Fetch website HTML
- Extract meta tags & content
    ↓
[Step 2: Analyzing]  
- Send to OpenAI API
- AI analyzes business, keywords, personas, brand voice
    ↓
[Step 3: Generating]
- Generate additional persona if needed
    ↓
[Step 4: Saving]
- Create project
- Update with analysis data
- Add 3 personas
- Add 10 keywords
    ↓
Navigate to Project Detail
```

## Data Structure

### Website Analysis Response
```typescript
{
  businessName: string;
  product: string;
  targetMarket: string;
  keywords: string[]; // 10 keywords
  personas: Array<{
    name: string;
    description: string;
    painPoints: string[];
    goals: string[];
  }>; // 3 personas
  brandVoice: string;
  websiteTitle: string;
  websiteDescription: string;
}
```

## Deployment

### Deploy Supabase Function
```bash
cd mykontenwriter
supabase functions deploy analyze-website
```

### Environment Variables Required
- `OPENAI_API_KEY` - Must be set in Supabase project settings

## Testing

1. Create new project
2. Enter website URL (e.g., https://example.com)
3. Select "Basic Mode"
4. Click Create
5. Verify:
   - Project settings filled with business info
   - 10 keywords added
   - 3 personas created
   - Brand voice filled

## Error Handling

- If website fetch fails → fallback to manual input
- If OpenAI API fails → create project with default persona
- If JSON parse fails → log error and use fallback

## Future Improvements

1. Add support for more languages
2. Cache website analysis results
3. Add retry mechanism for failed requests
4. Support for analyzing multiple pages
5. Extract images and logos
