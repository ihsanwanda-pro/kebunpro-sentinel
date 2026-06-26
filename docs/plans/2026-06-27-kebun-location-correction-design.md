# Kebun Preset Locations Correction & Geocoding Automation Design

This document details the design for correcting the hardcoded Kebun coordinate presets and location labels in the Nusantara Palm-Estate Operations Planner. It also defines the batch geocoding script and custom agent skill to scale location processing in the future.

## User Review Required

> [!NOTE]
> All preset coordinates have been cross-checked. The physical coordinate numbers in the app were correct, but the Indonesian administrative names associated with them were mismatched.
> The updated labels use localized standard Indonesian formatting (e.g. `Kabupaten Kuantan Singingi`, `Kabupaten Aceh Tamiang`, `Kabupaten Dharmasraya`).

## Proposed Changes

We will modify three files in the application to update the preset entries and coordinates:

### Preset Data & App Updates

#### [MODIFY] [app.js](file:///c:/Users/oneda/Projects/nusantara-palm-sentinel-mvp/static/app.js)
* Update coordinates and locations in `PRESETS` mapping.
* Adjust default fallback latitude/longitude on lines 1000-1001.

#### [MODIFY] [app.py](file:///c:/Users/oneda/Projects/nusantara-palm-sentinel-mvp/app.py)
* Update `PRESETS` dictionary coordinates for the Streamlit dashboard app.

#### [MODIFY] [main.py](file:///c:/Users/oneda/Projects/nusantara-palm-sentinel-mvp/main.py)
* Update default `LATITUDE` and `LONGITUDE` variables.

#### [MODIFY] [style.css](file:///c:/Users/oneda/Projects/nusantara-palm-sentinel-mvp/static/style.css)
* Align max-width of `.header-container` to `600px` to match the main layout container `.container`.

### Automation Tooling & Custom Skill

#### [NEW] [geocode_presets.py](file:///c:/Users/oneda/Projects/nusantara-palm-sentinel-mvp/scripts/geocode_presets.py)
A Python utility that decodes Open Location Codes (Plus Codes) and reverse geocodes coordinates to administrative divisions in Indonesia.

#### [NEW] [SKILL.md](file:///c:/Users/oneda/Projects/nusantara-palm-sentinel-mvp/.agents/skills/indonesia-geocoding/SKILL.md)
A custom agent skill detailing the geocoding protocol and boundary resolution for Indonesian locations.

## Verification Plan

### Automated Tests
* Run unit tests via `pytest` to make sure existing functionality is not broken.

### Manual Verification
* Run Flask server (`python main.py`) and verify that select options and preset location details in the "Kebun Context Card" load with the correct Indonesian names.
