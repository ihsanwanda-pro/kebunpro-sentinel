# Operations Planner & Sentinel Enhancements Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enhance the Nusantara Palm-Estate Operations Planner dashboard with dynamic theme settings, valid accuracy audits, polished native Indonesian UX, data-accurate recommendation summary warnings, interactive calendar hover tooltips, and a marketing partner banner.

**Architecture:** We will inject dynamic CSS overrides into the Streamlit page matching standard dark/light design systems, query the GFS forecast model for past comparisons, overhaul translation dictionaries, implement granular daily alert logic, generate title tooltips within HTML table spans, and embed a marketing card.

**Tech Stack:** Python, Streamlit, Pandas, Plotly Express, requests, folium, HTML/CSS.

---

### Task 1: Theme Toggle & Custom CSS Injection

**Files:**
- Modify: `app.py`

**Step 1: Write Toggle widget & CSS injector**
Add dynamic CSS styling block based on a sidebar toggle:
```python
# Sidebar Toggle
dark_mode = st.sidebar.toggle("Mode Gelap / Dark Mode", value=False)

if dark_mode:
    st.markdown("""
    <style>
        .stApp { background-color: #0e1117; color: #ecf0f1; }
        .reportview-container { background: #0e1117; }
        .main .block-container { padding-top: 2rem; }
        .card {
            background-color: #1f2937;
            color: #ecf0f1;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            margin-bottom: 1rem;
            border-left: 5px solid #2e7d32;
        }
        [data-testid="stMetricValue"] { color: #ecf0f1 !important; }
        [data-testid="stMetricLabel"] { color: #9ca3af !important; }
        h1, h2, h3, h4, h5, h6 { color: #f3f4f6 !important; }
        p, span, label { color: #d1d5db; }
        table { width: 100%; border-collapse: collapse; color: #e5e7eb; }
        th { background-color: #374151 !important; color: #f3f4f6 !important; font-weight: bold; border: 1px solid #4b5563 !important; padding: 8px !important; }
        td { background-color: #1f2937 !important; color: #e5e7eb !important; border: 1px solid #4b5563 !important; padding: 8px !important; }
        tr:nth-child(even) td { background-color: #111827 !important; }
        .score-badge-green { background-color: #064e3b !important; color: #34d399 !important; padding: 4px 8px; border-radius: 8px; font-weight: bold; display: inline-block; }
        .score-badge-yellow { background-color: #78350f !important; color: #fbbf24 !important; padding: 4px 8px; border-radius: 8px; font-weight: bold; display: inline-block; }
        .score-badge-red { background-color: #7f1d1d !important; color: #f87171 !important; padding: 4px 8px; border-radius: 8px; font-weight: bold; display: inline-block; }
    </style>
    """, unsafe_allow_html=True)
else:
    st.markdown("""
    <style>
        .stApp { background-color: #f8fafc; color: #1e293b; }
        .reportview-container { background: #f0f4f1; }
        .main .block-container { padding-top: 2rem; }
        .card {
            background-color: #ffffff;
            color: #1e293b;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin-bottom: 1rem;
            border-left: 5px solid #2e7d32;
        }
        [data-testid="stMetricValue"] { color: #1e293b !important; }
        [data-testid="stMetricLabel"] { color: #475569 !important; }
        h1, h2, h3, h4, h5, h6 { color: #0f172a !important; }
        p, span, label { color: #334155; }
        table { width: 100%; border-collapse: collapse; color: #1e293b; }
        th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold; border: 1px solid #cbd5e1 !important; padding: 8px !important; }
        td { background-color: #ffffff !important; color: #334155 !important; border: 1px solid #cbd5e1 !important; padding: 8px !important; }
        tr:nth-child(even) td { background-color: #f8fafc !important; }
        .score-badge-green { background-color: #e8f5e9 !important; color: #2e7d32 !important; padding: 4px 8px; border-radius: 8px; font-weight: bold; display: inline-block; }
        .score-badge-yellow { background-color: #fffde7 !important; color: #f57f17 !important; padding: 4px 8px; border-radius: 8px; font-weight: bold; display: inline-block; }
        .score-badge-red { background-color: #ffebee !important; color: #c62828 !important; padding: 4px 8px; border-radius: 8px; font-weight: bold; display: inline-block; }
    </style>
    """, unsafe_allow_html=True)
```

**Step 2: Update Plotly Chart templates**
Update `fig` and `fig_audit` instantiation to use the dynamic template parameter:
```python
theme_template = "plotly_dark" if dark_mode else "plotly_white"
fig.update_layout(yaxis_range=[0, 105], hovermode="x unified", template=theme_template)
# and update fig_audit:
fig_audit.update_layout(hovermode="x unified", template=theme_template)
```

**Step 3: Run the dashboard to verify light and dark mode toggles visually**
Run: `streamlit run app.py` and test toggling dark mode in the sidebar.

**Step 4: Commit**
```bash
git add app.py
git commit -m "feat: add light and dark mode toggle with dynamic style sheets"
```

---

### Task 2: Accurate Historical Weather Audit

**Files:**
- Modify: `app.py`

**Step 1: Update API call parameter**
Modify `fetch_audit_data` inside `app.py` to specify `models=gfs_seamless`:
```python
forecast_url = f"https://historical-forecast-api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&start_date={start_s}&end_date={end_s}&models=gfs_seamless&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia%2FSingapore"
```
Wait, the output parameters will be `temperature_2m_max`, etc., directly when a single model is provided. Let's make sure the return dict matches the expectation.

**Step 2: Run unit test or test endpoint manually to ensure the accuracy values are not 100%**
Verify the audit tab shows real-world accuracies (e.g. 70-90%).

**Step 3: Commit**
```bash
git add app.py
git commit -m "feat: use GFS model forecast for valid weather audit accuracy computation"
```

---

### Task 3: Indonesian Spelling & Terminology UX Review

**Files:**
- Modify: `app.py`

**Step 1: Spellcheck and terminology updates**
Correct spelling and phrases:
- Replace all occurrences of "Kelembaban" with "Kelembapan".
- Update `LOCALES["Bahasa Indonesia"]` keys:
  - `"title"`: `"🌿 Perencana & Sentinel Operasional Perkebunan Sawit"`
  - `"estate_controls"`: `"🌿 Pengaturan Lokasi & Parameter"`
  - `"harv_settings"`: `"Pengaturan Pemanenan"`
  - `"spray_settings"`: `"Pengaturan Penyemprotan"`
  - `"max_sat_moist"`: `"Batas Kejenuhan Tanah (Saturated) Maks."`
  - `"outlook_insights"`: `"📋 Rekomendasi Operasional Tiga Hari Ke Depan"`
  - `"kpi_topsoil"`: `"Kelembapan Lapisan Atas (0-7cm)"`
  - `"kpi_subsoil"`: `"Kelembapan Lapisan Dalam (7-28cm)"`

**Step 2: Verify in browser**
Run the dashboard in Bahasa Indonesia mode and verify the labels.

**Step 3: Commit**
```bash
git add app.py
git commit -m "ux: polish Indonesian terminology and fix spelling errors"
```

---

### Task 4: Complete Feasibility Score Summary Alert

**Files:**
- Modify: `app.py`

**Step 1: Rewrite recommendations logic**
Compute alerts dynamically by inspecting actual feasibility scores:
```python
        # Field Recommendations / Insights Box
        st.subheader(LOCALES[lang]["outlook_insights"])
        insights = []
        
        # Analyze next 3 days of calculated daily scores
        for idx, row in df.head(3).iterrows():
            day_name = row["date"].strftime("%A") if lang == "English" else row["date"].strftime("%A") # We will translate day names or format them
            
            # Day name translation
            day_map = {
                "Monday": "Senin", "Tuesday": "Selasa", "Wednesday": "Rabu",
                "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu", "Sunday": "Minggu"
            }
            day_label = day_map.get(row["date"].strftime("%A"), row["date"].strftime("%A")) if lang == "Bahasa Indonesia" else row["date"].strftime("%A")
            
            if row["Fertilizing"] < 40.0:
                insights.append(
                    f"⚠️ {day_label}: Pemupukan **Tidak Cocok** ({int(row['Fertilizing'])}%). Curah hujan tinggi atau kondisi tanah tidak memadai." if lang == "Bahasa Indonesia"
                    else f"⚠️ {day_label}: Fertilization is **Unsuitable** ({int(row['Fertilizing'])}%). High rain or poor soil conditions."
                )
            elif row["Fertilizing"] < 75.0:
                insights.append(
                    f"ℹ️ {day_label}: Pemupukan **Hati-hati** ({int(row['Fertilizing'])}%). Batasi pemupukan jika kelembapan kurang optimal." if lang == "Bahasa Indonesia"
                    else f"ℹ️ {day_label}: Fertilization requires **Caution** ({int(row['Fertilizing'])}%). Limit application if moisture is sub-optimal."
                )
                
            if row["Harvesting"] < 40.0:
                insights.append(
                    f"⚠️ {day_label}: Pemanenan **Tidak Cocok** ({int(row['Harvesting'])}%). Jalan berlumpur tebal mempersulit logistik truk." if lang == "Bahasa Indonesia"
                    else f"⚠️ {day_label}: Harvesting is **Unsuitable** ({int(row['Harvesting'])}%). Thick mud restricts truck logistics."
                )
                
            if row["Spraying"] < 40.0:
                insights.append(
                    f"⚠️ {day_label}: Penyemprotan **Tidak Cocok** ({int(row['Spraying'])}%). Batas angin kritis terlampaui atau kelembapan tidak sesuai." if lang == "Bahasa Indonesia"
                    else f"⚠️ {day_label}: Spraying is **Unsuitable** ({int(row['Spraying'])}%). Critical wind limit exceeded or humidity out of bounds."
                )
```

**Step 2: Verify logic against table**
Verify that "Tidak Cocok" in the table displays an alert in the summary block.

**Step 3: Commit**
```bash
git add app.py
git commit -m "feat: base recommendations summary on actual calculated feasibility scores"
```

---

### Task 5: SawitPro Marketing CTA Card

**Files:**
- Modify: `app.py`

**Step 1: Add HTML template call-to-action**
Directly under the insights display logic:
```python
        # Marketing Banner
        if lang == "Bahasa Indonesia":
            st.markdown("""
            <div style="background-color: #e8f5e9; border: 2px solid #2e7d32; padding: 1rem; border-radius: 10px; margin-top: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0; color: #2e7d32;">🛡️ Kemitraan SawitPro</h4>
                <p style="margin: 5px 0 10px 0; color: #1e293b;">
                    <b>Pastikan gunakan pupuk 100% Asli!</b> Beli pupuk premium, racun hama berkualitas, dan semua alat kebutuhan kebun sawit Anda secara aman di sini.
                </p>
                <a href="https://toko.sawitpro.id/?" target="_blank" style="background-color: #2e7d32; color: white; padding: 6px 12px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Kunjungi Toko SawitPro 🛒</a>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="background-color: #e8f5e9; border: 2px solid #2e7d32; padding: 1rem; border-radius: 10px; margin-top: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0; color: #2e7d32;">🛡️ SawitPro Partnership</h4>
                <p style="margin: 5px 0 10px 0; color: #1e293b;">
                    <b>Ensure 100% Genuine Fertilizers!</b> Buy premium fertilizers, effective crop chemicals, and all your harvesting tool needs safely.
                </p>
                <a href="https://toko.sawitpro.id/?" target="_blank" style="background-color: #2e7d32; color: white; padding: 6px 12px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Visit SawitPro Store 🛒</a>
            </div>
            """, unsafe_allow_html=True)
```
Wait! Make sure this marketing banner inherits dark mode values if dark mode is toggled!
Let's refine the styling so it uses CSS variables or conditional styling for dark mode background/text.

**Step 2: Verify link in browser**
Click button to verify redirection to `https://toko.sawitpro.id/?`.

**Step 3: Commit**
```bash
git add app.py
git commit -m "feat: add SawitPro partnership marketing card"
```

---

### Task 6: Hover Tooltips for Calendar cells

**Files:**
- Modify: `app.py`

**Step 1: Update `get_badge` logic to generate tooltips**
Modify the `get_badge` function:
```python
        def get_badge(score, op_type, row):
            if score > 75:
                status = LOCALES[lang]["optimal"]
                class_name = "score-badge-green"
            elif score > 40:
                status = LOCALES[lang]["caution"]
                class_name = "score-badge-yellow"
            else:
                status = LOCALES[lang]["unsuitable"]
                class_name = "score-badge-red"
                
            # Build tooltips
            reasons = []
            if op_type == "fertilizer":
                if row["rain"] > config["fert_runoff_rain"]:
                    reasons.append(f"Hujan lebat ({row['rain']:.1f} mm) berisiko runoff" if lang == "Bahasa Indonesia" else f"Heavy rain ({row['rain']:.1f} mm) causes runoff")
                if row["rain"] == config["fert_volatilization_rain"] and row["soil_moisture"] < config["fert_volatilization_moisture"]:
                    reasons.append(f"Tanah kering ({row['soil_moisture']*100:.1f}%) berisiko penguapan Urea" if lang == "Bahasa Indonesia" else f"Dry soil ({row['soil_moisture']*100:.1f}%) risks volatilization")
                elif row["soil_moisture"] > config["fert_saturated_moisture"]:
                    reasons.append(f"Tanah jenuh air ({row['soil_moisture']*100:.1f}%) membatasi penyerapan" if lang == "Bahasa Indonesia" else f"Saturated soil ({row['soil_moisture']*100:.1f}%) limits absorption")
                if row["temp_max"] > config["fert_heat_temp"]:
                    reasons.append(f"Suhu panas ({row['temp_max']:.1f}°C) memicu penguapan Nitrogen" if lang == "Bahasa Indonesia" else f"High temperature ({row['temp_max']:.1f}°C) causes volatilization")
            elif op_type == "harvesting":
                if row["rain"] > config["harv_mud_rain"]:
                    reasons.append(f"Hujan lebat ({row['rain']:.1f} mm) menyebabkan jalan berlumpur" if lang == "Bahasa Indonesia" else f"Heavy rain ({row['rain']:.1f} mm) makes paths muddy")
                if row["wind_speed"] > config["harv_wind_speed"]:
                    reasons.append(f"Angin kencang ({row['wind_speed']:.1f} km/jam) berisiko keselamatan" if lang == "Bahasa Indonesia" else f"High wind ({row['wind_speed']:.1f} km/h) safety hazard")
            elif op_type == "spraying":
                if row["wind_speed"] > config["spray_drift_wind_high"]:
                    reasons.append(f"Angin kencang ({row['wind_speed']:.1f} km/jam) memicu drift kritis" if lang == "Bahasa Indonesia" else f"High wind ({row['wind_speed']:.1f} km/h) causes critical drift")
                elif row["wind_speed"] > config["spray_drift_wind_med"]:
                    reasons.append(f"Angin sedang ({row['wind_speed']:.1f} km/jam) memicu drift sedang" if lang == "Bahasa Indonesia" else f"Moderate wind ({row['wind_speed']:.1f} km/h) causes drift")
                if row["rain"] > config["spray_wash_rain"]:
                    reasons.append(f"Hujan ({row['rain']:.1f} mm) membilas semprotan (wash-off)" if lang == "Bahasa Indonesia" else f"Rain ({row['rain']:.1f} mm) washes off chemical")
                if not (config["spray_humidity_min"] <= row["humidity"] <= config["spray_humidity_max"]):
                    reasons.append(f"Kelembapan ({row['humidity']:.1f}%) tidak optimal" if lang == "Bahasa Indonesia" else f"Humidity ({row['humidity']:.1f}%) out of range")
                    
            if not reasons:
                reasons.append("Kondisi optimal untuk pengerjaan" if lang == "Bahasa Indonesia" else "All parameters optimal")
            tooltip = " | ".join(reasons)
            
            return f'<span class="{class_name}" title="{tooltip}">{status} ({int(score)}%)</span>'
```

**Step 2: Hover verify**
Hover mouse over table cells and verify browser tooltip popup showing correct parameters.

**Step 3: Commit**
```bash
git add app.py
git commit -m "feat: add hover tooltips to calendar cells detailing score reasoning"
```
