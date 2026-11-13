# PRD - Planova: Intelligent Event Budget Optimizer

## 1. Project Overview
Planova adalah platform manajemen anggaran event cerdas untuk kepanitiaan besar/festival. Menggunakan AI untuk mengaudit Rencana Anggaran Biaya (RAB), mendeteksi pemborosan, dan mengoptimalkan cash flow.

## 2. Target Users
- **Bendahara**: Pengelola utama data keuangan.
- **Ketua Panitia**: Pengambil keputusan tertinggi.
- **Koordinator Divisi**: Penginput kebutuhan dana spesifik.

## 3. Core Features
### A. Interactive Budget Table (React)
- Input item, kuantitas, harga satuan, dan vendor.
- Kalkulasi otomatis total per baris dan per divisi.
- Status integrasi: Draft, Pending Audit, Approved.

### B. AI Financial Audit (Gemini API)
- **Input**: Ekstraksi data tabel ke format JSON.
- **Analysis**:
    - Deteksi harga vendor yang tidak wajar (markup).
    - Analisa proporsi anggaran per divisi (misal: Konsumsi > 30% = Warning).
    - Identifikasi item duplikat antar divisi.
- **Output**: Rekomendasi teks & nilai realokasi dana.

### C. Dashboard Analytics
- Visualisasi pengeluaran vs budget tersedia.
- Grafik pie proporsi divisi.

## 4. Technical Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons.
- **Backend**: Laravel 10+, REST API.
- **Database**: MySQL 8.0.
- **AI**: Google Gemini Pro (via Generative AI SDK).
- **Infrastruktur**: Docker (Compose) untuk development.

## 5. Database Schema (Draft)
- `users`: id, name, email, role, password.
- `events`: id, name, total_budget, date.
- `divisions`: id, event_id, name, budget_limit.
- `budget_items`: id, division_id, description, quantity, unit_price, vendor_name, status.
- `audit_reports`: id, event_id, raw_json, ai_suggestion, created_at.

## 6. Prompt Engineering Strategy
Prompt dikirim ke Gemini akan berisi:
1. Konteks event (tipe, skala).
2. Data JSON RAB.
3. Instruksi audit spesifik (cek harga pasar Indonesia, cek efisiensi).
4. Request output dalam format terstruktur.
