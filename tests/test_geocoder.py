import unittest
import os

class TestGeocoder(unittest.TestCase):
    def test_script_exists(self):
        self.assertTrue(os.path.exists("scripts/geocode_presets.py"))
