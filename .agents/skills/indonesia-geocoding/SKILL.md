---
name: indonesia-geocoding
description: Use when converting geographic coordinates or Plus Codes to Indonesian administrative locations (province, regency, district, village) or resolving location formatting errors in preset database configurations.
---

# Indonesia Geocoding & Coordinate Conversion

## Overview
This skill provides a standard protocol to decode Open Location Codes (Plus Codes) and reverse geocode coordinates specifically within the context of Indonesian administrative divisions (Desa/Kelurahan, Kecamatan, Kabupaten/Kota, Provinsi).

## When to Use
* Converting short Plus Codes (e.g. `GC63+W9R`) to exact decimal coordinates using a reference district/regency.
* Reverse geocoding latitude and longitude coordinates to retrieve structured Indonesian address fields.
* Auditing coordinate preset databases in operations planner applications.

## Core Pattern
To resolve a short Plus Code to standard Indonesian address format:

1. **Resolve reference locality**: Query OpenStreetMap Nominatim with the general district/regency/province to get a bounding reference coordinate (e.g. `Logas, Riau` -> `-0.4669, 101.4012`).
2. **Recover full Plus Code**: Use `openlocationcode.recoverNearest(short_code, ref_lat, ref_lon)` to recover the full 10-character code.
3. **Decode coordinates**: Use `openlocationcode.decode(full_code)` to find the exact center coordinates.
4. **Reverse geocode administrative divisions**: Query Nominatim using the coordinates and parse fields:
   * **Village / Ward** (`village`, `suburb`, `town`, `neighbourhood`)
   * **Regency / City** (`county`, `city`)
   * **Province** (`state`)

## Quick Reference

| Source Format | Resolution Method | Expected Indonesian Labels |
|---|---|---|
| Short Plus Code | Locality reference + `openlocationcode` | `Desa, Kabupaten, Provinsi` |
| Coordinates | Reverse geocoding (Nominatim API) | `Desa, Kabupaten, Provinsi` |

## Common Mistakes

### 1. Swapping Lat/Lon signs for Southern Hemisphere
* **Problem**: Many Indonesian locations lie south of the equator (e.g. Sumatra, Java). Latitudes must be negative (e.g. `-1.296763` instead of `1.296763`).
* **Fix**: Always verify that the latitude sign matches the hemisphere designation (`S` = negative, `N` = positive).

### 2. Missing Village boundary data in rural areas
* **Problem**: In remote agricultural regions (like palm estates), reverse geocoding may return only `county` and `state` details with no `village` or `town`.
* **Fix**: Fallback to checking the `display_name` raw string or append the village name from the reference input (e.g. use `Koto Besar, Kabupaten Dharmasraya, Sumatera Barat` even if OSM only returns `Dharmasraya, Sumatera Barat`).
