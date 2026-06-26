# Design Document: Operations Planner & Sentinel Enhancements

This document outlines the design for the UI, UX, API, and algorithmic improvements to the Nusantara Palm-Estate Operations Planner & Sentinel.

---

## 1. Light & Dark Mode System
We will implement a toggle switch in the sidebar to switch between Light Mode and Dark Mode. Light Mode will remain the default.

### styling Implementation
We will inject custom CSS dynamically based on the state of the toggle.
- **Light Mode Style Tokens**:
  - Background: `#f8fafc`
  - Container / Card background: `#ffffff`
  - Text: `#1e293b`
  - Table Headers: `#f1f5f9` (text: `#0f172a`)
  - Table Rows: Alternating `#ffffff` and `#f8fafc` (text: `#334155`)
  - Semantic Badges:
    - Green (Optimal): `#e8f5e9` text `#2e7d32`
    - Yellow (Caution): `#fffde7` text `#f57f17`
    - Red (Unsuitable): `#ffebee` text `#c62828`
- **Dark Mode Style Tokens**:
  - Background: `#0e1117`
  - Container / Card background: `#1f2937`
  - Text: `#ecf0f1`
  - Table Headers: `#374151` (text: `#f3f4f6`)
  - Table Rows: Alternating `#1f2937` and `#111827` (text: `#e5e7eb`)
  - Semantic Badges:
    - Green (Optimal): `#064e3b` text `#34d399`
    - Yellow (Caution): `#78350f` text `#fbbf24`
    - Red (Unsuitable): `#7f1d1d` text `#f87171`

### Chart Integration
Plotly charts will dynamically select the template:
- `template="plotly_dark"` if Dark Mode is active.
- `template="plotly_white"` if Light Mode is active.

---

## 2. Valid Weather Forecast Accuracy Check
Instead of GFS analysis fields aligning perfectly with reanalysis observations, we will query GFS model forecasts specifically.

### API Changes
- Endpoint: `https://historical-forecast-api.open-meteo.com/v1/forecast`
- Added query parameter: `models=gfs_seamless`
- This ensures we fetch real past forecasts, leading to a valid and realistic accuracy comparison (e.g. 75-90% accuracy instead of constant 100%).

---

## 3. Indonesian Translation & UX Review
We will standardize the language and eliminate ambiguities:
- Correct "Kelembaban" -> **"Kelembapan"** (standard Indonesian spelling).
- Change "Kontrol Perkebunan" -> **"Kontrol Lokasi & Parameter"** or **"Pengaturan Area"**.
- Clarify "Kelembaban Saturated Maksimal" -> **"Batas Kejenuhan Tanah (Saturated) Maks."**.
- Update summary header to: **"Rekomendasi Operasional Tiga Hari Ke Depan"**.
- Correct "Sparying" to **"Penyemprotan"**.

---

## 4. Comprehensive Recommendation Logic
The summary recommendation box will no longer check hardcoded rain/wind thresholds directly in isolation. Instead, it will look at the calculated daily feasibility scores for Fertilizing, Harvesting, and Spraying over the next 3 days:
- If **any** score is `< 40.0` (Unsuitable): Display a red warning specifying the date, operation, and the exact penalty parameter triggering it.
- If **any** score is `< 75.0` (Caution): Display a warning outlining caution recommendations.
- If **all** scores are `> 75.0`: Display a green success banner indicating favorable conditions.

---

## 5. SawitPro Marketing CTA Card
A premium promotion card will be placed directly under the summary recommendations box:
- Title: `🛡️ SawitPro Mandiri Kemitraan`
- Copy: `"Pastikan Anda menggunakan pupuk 100% Asli! Dapatkan pupuk premium, racun hama berkualitas, dan semua alat kebutuhan kebun Anda langsung di Toko SawitPro."`
- Button: Redirecting to `https://toko.sawitpro.id/?`.

---

## 6. Hover Tooltips on Operations Table
We will dynamically build explanatory HTML tooltips inside the `title` attribute of the table cell span tags:
- E.g., `title="Hujan lebat (18.0 mm > 15.0 mm limit) berisiko membilas pupuk"`
- These tooltips will detail exactly why a penalty was applied based on the meteorological parameters of that specific day.
