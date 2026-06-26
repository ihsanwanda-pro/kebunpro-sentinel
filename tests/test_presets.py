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
