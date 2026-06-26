# Design Document: Operations Planner & Sentinel Flask App Enhancements

This document outlines the design for the UI, UX, API, and algorithmic improvements to the Nusantara Palm-Estate Operations Planner & Sentinel Flask web app.

---

## 1. Locked Light Mode System & Indonesian Translation Default
- **Theme Settings:**
  - Remove all theme toggling UI elements.
  - The application strictly uses the Light Mode styling as default.
  - **Light Mode Style Tokens**:
    - Background: `#f8fafc`
    - Container / Card background: `#ffffff`
    - Text: `#1e293b`
    - Input Background: `#ffffff`
    - Table Headers: `#f1f5f9` (text: `#0f172a`)
    - Semantic Badges:
      - Green (Optimal): `#e8f5e9` text `#2e7d32`
      - Yellow (Caution): `#fffde7` text `#f57f17`
      - Red (Unsuitable): `#ffebee` text `#c62828`
- **Language Default:**
  - Remove the language selector dropdown.
  - Lock all UI texts and labels to **Bahasa Indonesia** with correct spelling (e.g., "Kelembapan").

---

## 2. GFS Weather Forecast Accuracy Audit
Query the GFS model forecasts specifically to evaluate model reliability.

### API Endpoint
- Endpoint: `/api/audit?days=<7-30>`
- Queries Open-Meteo Archive API and Historical Forecast API using `models=gfs_seamless` for GFS model past predictions.
- Computes parameter accuracies (Temperature, Rain, Wind) compared to actual observation data.
- Frontend plots comparisons utilizing Chart.js line charts.

---

## 3. Grouped Summary Alert Card (Option A)
Consolidate alerts for the upcoming 3 days of operations to reduce UI vertical clutter:
- **Card Severity styling:**
  - Red (Error) box: If any score is `< 40.0` (Tidak Cocok) for any operation.
  - Yellow (Warning) box: If no operation is `< 40.0` but at least one is `< 75.0` (Hati-hati).
  - Green (Success) box: If all operations are `>= 75.0` (Optimal).
- **Grouped Bulleted List:**
  - Compile errors and warning statements grouped by day (e.g. `Jumat: Penyemprotan Tidak Cocok (0%) - Batas angin kritis terlampaui`).
  - Output as a single card at the top of the Operations Planner tab.

---

## 4. SawitPro Marketing CTA Card
A premium promotion card is placed directly under the summary recommendations box:
- Title: `🛡️ Kemitraan Toko SawitPro`
- Copy: `"Pastikan gunakan pupuk 100% Asli! Beli pupuk premium, racun hama berkualitas, dan semua alat kebutuhan kebun sawit Anda secara aman di sini."`
- Button: Redirects to `https://toko.sawitpro.id/?`.

---

## 5. Hover Tooltips on Operations
- Explanatory tooltips dynamically compiled inside a `.custom-tooltip` bubble displayed on hover:
  - Details exactly why a penalty was applied (e.g., `Hujan lebat (18.0 mm) berisiko runoff`).
