# Kebun Preset Locations Correction & Geocoding Automation Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Correct the mismatched Kebun locations and coordinate presets across Flask backend, frontend JS, and Streamlit, align the app header width with the main dashboard container, and deliver a batch geocoding script and custom skill to scale to thousands of locations.

**Architecture:** We will implement unit tests for presets, update coordinates and standardized Indonesian location labels in backend/frontend databases, adjust the header width styles in CSS, create a batch geocoding helper utility, and package the geocoding workflow as a reusable custom skill.

**Tech Stack:** Python, Flask, Streamlit, HTML/Javascript, pytest, openlocationcode, requests.

---

### Task 1: Update Preset coordinates and Indonesian standard formatting name strings

**Files:**
- Create: `tests/test_presets.py`
- Modify: `main.py`
- Modify: `app.py`
- Modify: `static/app.js`
- Modify: `templates/dashboard.html`

**Step 1: Write the failing test**
Create a test file `tests/test_presets.py` that verifies the corrected coordinates and default fallbacks.
```python
import unittest
import main
import app

class TestPresets(unittest.TestCase):
    def test_main_default_coordinates(self):
        # New Kebun 1 coordinates (Logas, Kuantan Singingi)
        self.assertAlmostEqual(main.LATITUDE, -0.487637, places=5)
        self.assertAlmostEqual(main.LONGITUDE, 101.403391, places=5)

    def test_streamlit_presets(self):
        # Verify app.py has the corrected coordinates for Kebun 1-6
        presets = app.PRESETS
        self.assertAlmostEqual(presets["Kebun-1"]["lat"], -0.487637, places=5)
        self.assertAlmostEqual(presets["Kebun-2"]["lat"], 4.346562, places=5)
        self.assertAlmostEqual(presets["Kebun-3"]["lat"], 1.384213, places=5)
        self.assertAlmostEqual(presets["Kebun-4"]["lat"], 1.512563, places=5)
        self.assertAlmostEqual(presets["Kebun-5"]["lat"], -1.296763, places=5)
        self.assertAlmostEqual(presets["Kebun-6"]["lat"], -1.294963, places=5)
```

**Step 2: Run test to verify it fails**
Run: `python -m unittest tests/test_presets.py`
Expected: FAIL due to mismatched coordinates.

**Step 3: Modify code files to update coordinates and names**
- Update `LATITUDE` and `LONGITUDE` in `main.py`.
- Update `PRESETS` in `app.py`.
- Update `PRESETS` values and default fallback latitude/longitude on lines 1000-1001 in `static/app.js`.
- Update default input-lat/input-lon values in `templates/dashboard.html` to `-0.4876` and `101.4034`.

**Step 4: Run test to verify it passes**
Run: `python -m unittest tests/test_presets.py`
Expected: PASS.

**Step 5: Commit changes**
Run:
```powershell
git add tests/test_presets.py main.py app.py static/app.js templates/dashboard.html; git commit -m "feat: correct coordinates and Indonesian labels for all Kebuns"
```

---

### Task 2: Create Geocoding Helper Script

**Files:**
- Create: `scripts/geocode_presets.py`
- Create: `tests/test_geocoder.py`

**Step 1: Write the failing test**
Create a test file `tests/test_geocoder.py` to verify the decoding utility:
```python
import unittest
import os
import subprocess

class TestGeocoder(unittest.TestCase):
    def test_script_exists(self):
        self.assertTrue(os.path.exists("scripts/geocode_presets.py"))
```

**Step 2: Run test to verify it fails**
Run: `python -m unittest tests/test_geocoder.py`
Expected: FAIL since the script doesn't exist yet.

**Step 3: Implement `scripts/geocode_presets.py`**
Create a Python script that decodes Plus Codes and reverse-geocodes to Indonesian administrative labels:
```python
import sys
from openlocationcode import openlocationcode as olc
import requests

def decode_and_geocode(short_code, ref_address):
    # Search reference
    headers = {'User-Agent': 'NusantaraPalmSentinelGeocodeScript/1.0'}
    r = requests.get(f"https://nominatim.openstreetmap.org/search?q={ref_address}&format=json&limit=1", headers=headers).json()
    if not r:
        return None
    ref_lat = float(r[0]['lat'])
    ref_lon = float(r[0]['lon'])
    
    full_code = olc.recoverNearest(short_code, ref_lat, ref_lon)
    decoded = olc.decode(full_code)
    lat, lon = decoded.latitudeCenter, decoded.longitudeCenter
    
    rev = requests.get(f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=id", headers=headers).json()
    address = rev.get("address", {})
    
    village = address.get("village", address.get("suburb", address.get("town", "Unknown")))
    county = address.get("county", address.get("city", "Unknown"))
    state = address.get("state", "Unknown")
    
    formatted_name = f"{village}, {county}, {state}"
    return {"lat": round(lat, 6), "lon": round(lon, 6), "location": formatted_name}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python geocode_presets.py <short_code> <ref_address>")
        sys.exit(1)
    res = decode_and_geocode(sys.argv[1], sys.argv[2])
    print(res)
```

**Step 4: Run test to verify it passes**
Run: `python -m unittest tests/test_geocoder.py`
Expected: PASS.

**Step 5: Commit changes**
Run:
```powershell
git add scripts/geocode_presets.py tests/test_geocoder.py; git commit -m "feat: add geocoding batch utility script"
```

---

### Task 3: Create Custom Indonesia Geocoding Skill

**Files:**
- Create: `.agents/skills/indonesia-geocoding/SKILL.md`

**Step 1: Write the skill content**
Create the skill file detailing how to geocode locations in Indonesia and resolve administrative levels.

**Step 2: Commit changes**
Run:
```powershell
git add .agents/skills/indonesia-geocoding/SKILL.md; git commit -m "docs: add indonesia-geocoding custom agent skill"
```

---

### Task 4: Align App Header Container Width

**Files:**
- Modify: `static/style.css`

**Step 1: Modify header-container class**
Update the max-width of `.header-container` to `600px` to match the main layout container `.container`.

**Step 2: Verify alignment in browser**
Run the Flask server and verify visually that the settings gear button aligns perfectly with the right edge of the dashboard cards and tabs.

**Step 3: Commit changes**
Run:
```powershell
git add static/style.css; git commit -m "style: align header container width with main layout for visual symmetry"
```
