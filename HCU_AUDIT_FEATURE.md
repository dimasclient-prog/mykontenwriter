# HCU Audit Feature

## Overview
Fitur HCU (Helpful Content Update) Audit membantu Anda menganalisis konten berdasarkan pedoman Google's Helpful Content Update untuk memastikan artikel dioptimalkan untuk ranking pencarian.

## Fitur Utama

### 1. Form Audit Komprehensif
Form audit mencakup 5 kategori penilaian:

#### A. Informasi Dasar Konten
- Judul konten
- URL konten
- Jenis konten (artikel, landing page, case study, dll)
- Topik utama
- Target audiens
- Search intent
- Bahasa konten

#### B. Sumber & Kredibilitas (E-E-A-T)
- Ketersediaan nama penulis
- Ketersediaan profil penulis
- Ketersediaan halaman About Us
- Jenis penulis (praktisi, brand, media, anonim)
- Ketersediaan referensi/sumber data
- Jenis sumber (pengalaman langsung, data internal, eksternal)

#### C. Penilaian Content & Quality (Skor 1-5)
- Originalitas & nilai tambah
- Kelengkapan & kedalaman topik
- Relevansi & manfaat bagi pembaca
- Judul & struktur konten
- Kualitas penulisan & produksi

#### D. Penilaian E-E-A-T (Skor 1-5)
- **Experience**: Pengalaman langsung dengan topik
- **Expertise**: Keahlian dalam topik
- **Authoritativeness**: Otoritas brand/penulis
- **Trustworthiness**: Kepercayaan & transparansi

#### E. Penalti & Red Flags
- Konten terlalu promosi
- Tidak ada penulis
- Klaim tanpa bukti
- Konten mass-produced
- Thin content
- AI-generated tanpa editing manusia

### 2. Sistem Scoring
Skor HCU dihitung dengan formula weighted average:

```
Final Score = (Content Quality × 40%) + (E-E-A-T × 40%) + (Penalty × 20%)
```

**Content Quality Score**: Rata-rata dari 5 aspek kualitas konten
**E-E-A-T Score**: Rata-rata dari 4 aspek E-E-A-T
**Penalty Score**: 5 - (jumlah red flags × 0.8), minimum 1

### 3. Status Konten
Berdasarkan skor final:
- **Aman** (4.0 - 5.0): Konten sudah sangat baik
- **Perlu Perbaikan** (3.0 - 3.9): Ada area yang perlu ditingkatkan
- **Risiko Tinggi** (1.0 - 2.9): Konten berisiko terkena dampak HCU

### 4. Rekomendasi Perbaikan
Sistem memberikan rekomendasi prioritas berdasarkan:
- **High Priority**: Masalah kritis yang harus segera diperbaiki
- **Medium Priority**: Perbaikan penting untuk meningkatkan kualitas
- **Low Priority**: Optimasi tambahan

Rekomendasi mencakup:
- Kategori masalah
- Deskripsi masalah
- Saran perbaikan konkret

### 5. Riwayat Audit
- Menyimpan semua hasil audit
- Dapat melihat kembali audit sebelumnya
- Tracking perubahan skor dari waktu ke waktu

## Cara Menggunakan

1. **Buka Project Detail** → Pilih tab "HCU Audit"
2. **Klik "Mulai Audit Baru"**
3. **Isi Form Audit**:
   - Masukkan informasi dasar konten
   - Centang kredibilitas yang tersedia
   - Berikan skor 1-5 untuk setiap aspek
   - Centang red flags yang ada
4. **Klik "Audit Konten"**
5. **Review Hasil**:
   - Lihat skor final dan status
   - Baca breakdown per kategori
   - Terapkan rekomendasi perbaikan

## Technical Implementation

### Frontend Components
- `HCUAuditForm.tsx`: Form input audit
- `HCUAuditResult.tsx`: Display hasil audit
- `hcu-audit.ts`: Type definitions

### Backend Function
- `calculate-hcu-score`: Supabase Edge Function untuk menghitung skor

### Data Flow
1. User mengisi form → `HCUAuditForm`
2. Submit ke → `calculate-hcu-score` function
3. Function menghitung skor dan rekomendasi
4. Return hasil → `HCUAuditResult` untuk display

## Best Practices

### Untuk Konten Berkualitas Tinggi:
1. **Tunjukkan Pengalaman Langsung**: Tambahkan cerita personal, case study, hasil testing
2. **Demonstrasikan Keahlian**: Sertakan kredensial, data, referensi kredibel
3. **Bangun Otoritas**: Konsisten publish konten berkualitas, dapatkan backlink
4. **Tingkatkan Kepercayaan**: Transparansi informasi, kontak jelas, referensi terpercaya

### Hindari Red Flags:
- Jangan terlalu promosi
- Selalu cantumkan penulis
- Backup klaim dengan data
- Edit konten AI dengan perspektif manusia
- Buat konten mendalam, bukan thin content

## Future Enhancements
- [ ] Auto-audit dari URL (scraping & analysis)
- [ ] Integrasi dengan Google Search Console
- [ ] Competitor comparison
- [ ] Historical trend tracking
- [ ] Bulk audit untuk multiple URLs
- [ ] Export report ke PDF
