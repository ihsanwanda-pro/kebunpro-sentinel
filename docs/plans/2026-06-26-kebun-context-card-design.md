# Kebun Context Card — Design Document
**Date:** 2026-06-26  
**Status:** Approved

## Problem

Users select a kebun (Kebun-1 to Kebun-6) from a settings panel, but after closing the panel there is no persistent visual reminder of which location they're viewing, nor a quick weather snapshot. The "Rencana Operasi" planner section feels anonymous.

## Solution

Add a **live Kebun Context Card** above the forecast cards in the Planner tab (`#view-planner`). It serves as a persistent HUD that shows:

- Which kebun is active (name + coordinates)
- Today's live weather snapshot (temp, rain, wind, humidity, soil moisture)
- The current date in the active language

## Card Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  📍 Kebun-1  ·  -0.4876°, 101.4034°                             │
│  ─────────────────────────────────────────────────────────────   │
│  🌡 33°C   🌧 2.4 mm   💨 12 km/jam   💧 68%   🌱 41% Vol     │
│  Hari Ini · Sabtu, 26 Juni 2026                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Sources

| Field | Source |
|---|---|
| Kebun name | `select-preset` value or "Lokasi Kustom" |
| Coordinates | `PRESETS[key].lat / .lon` or custom inputs |
| Temp, rain, wind, humidity | `forecastData[0].weather` (today's day) |
| Soil moisture | `forecastData[0].weather.soil_moisture × 100` |
| Date label | `forecastData[0].date` formatted per active language |

## Behavior

1. **Loading state** — card renders immediately with a CSS skeleton shimmer while fetch is in progress
2. **Data loaded** — weather fields snap in with a fade-in transition
3. **Kebun switch** — name + coordinates update instantly; weather fields reset to skeleton until new fetch completes
4. **Language toggle** — all labels re-render in the selected language

## Position

Inside `#view-planner`, after `#summary-alerts` and `#marketing-card`, before `#forecast-list`.

```html
#view-planner
  ├── #summary-alerts
  ├── #marketing-card
  ├── #kebun-context-card   ← NEW
  └── #forecast-list
```

## Implementation Scope

- **dashboard.html** — add `#kebun-context-card` div with skeleton placeholders
- **app.js** — add `updateKebunCard(kebunName, lat, lon, todayWeather, lang)` function; call it from `renderForecast()` and from the kebun-switch handler; show skeleton on load
- **style.css** — add `.kebun-context-card`, `.kcc-header`, `.kcc-stats`, `.kcc-stat-item`, skeleton shimmer animation

## Out of Scope

- No backend changes required
- No new API calls — reuses `forecastData[0]`
- No province/region name reverse geocoding (can be added later)
