import sys
from openlocationcode import openlocationcode as olc
import requests

def decode_and_geocode(short_code, ref_address):
    headers = {'User-Agent': 'NusantaraPalmSentinelGeocodeScript/1.0'}
    
    # 1. Geocode reference address to get lat/lon bounds
    print(f"Geocoding reference: '{ref_address}'...")
    r = requests.get(f"https://nominatim.openstreetmap.org/search?q={ref_address}&format=json&limit=1", headers=headers).json()
    if not r:
        print("  Error: Reference search failed.")
        return None
    ref_lat = float(r[0]['lat'])
    ref_lon = float(r[0]['lon'])
    print(f"  Reference coordinates: {ref_lat}, {ref_lon}")
    
    # 2. Recover full Plus Code
    try:
        full_code = olc.recoverNearest(short_code, ref_lat, ref_lon)
        print(f"  Recovered full Plus Code: {full_code}")
    except Exception as e:
        print(f"  Error recovering Plus Code: {e}")
        return None
        
    # 3. Decode full Plus Code to coordinates
    try:
        decoded = olc.decode(full_code)
        lat, lon = decoded.latitudeCenter, decoded.longitudeCenter
        print(f"  Decoded Coordinates: {lat:.6f}, {lon:.6f}")
    except Exception as e:
        print(f"  Error decoding Plus Code: {e}")
        return None
        
    # 4. Reverse geocode coordinates to get administrative divisions
    print("  Reverse geocoding exact coordinates...")
    rev = requests.get(f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=id", headers=headers).json()
    address = rev.get("address", {})
    
    village = address.get("village", address.get("suburb", address.get("town", address.get("village_cleansed", "Desa"))))
    county = address.get("county", address.get("city", "Kabupaten"))
    state = address.get("state", "Provinsi")
    
    formatted_name = f"{village}, {county}, {state}"
    print(f"  Formatted Location: {formatted_name}")
    
    return {
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "location": formatted_name
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python geocode_presets.py <short_code> <ref_address>")
        sys.exit(1)
        
    short_code = sys.argv[1]
    ref_address = " ".join(sys.argv[2:])
    
    result = decode_and_geocode(short_code, ref_address)
    if result:
        print("\n=== Result for preset configuration ===")
        print(f"lat: {result['lat']}, lon: {result['lon']}, location: \"{result['location']}\"")
