from flask import Flask, jsonify, render_template, request
import requests
import datetime
import os
from agronomy import calculate_feasibility, DEFAULT_CONFIG

app = Flask(__name__)

# Preset coordinates (e.g., Kebun-1)
LATITUDE = -0.487637
LONGITUDE = 101.403391

def fetch_weather_forecast(latitude=LATITUDE, longitude=LONGITUDE):
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max,et0_fao_evapotranspiration&timezone=Asia%2FSingapore"
    soil_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&hourly=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_temperature_0_to_7cm&timezone=Asia%2FSingapore"
    
    r_weather = requests.get(weather_url, timeout=5).json()
    r_soil = requests.get(soil_url, timeout=5).json()
    
    daily = r_weather.get("daily", {})
    hourly = r_soil.get("hourly", {})
    
    if not daily or not hourly:
        return []

    # Process hourly soil data to daily averages
    soil_daily = {}
    times = hourly.get("time", [])
    moistures = hourly.get("soil_moisture_0_to_7cm", [])
    
    for i, time_str in enumerate(times):
        date_str = time_str.split("T")[0]
        if date_str not in soil_daily:
            soil_daily[date_str] = {"sum": 0, "count": 0}
        
        m = moistures[i]
        if m is not None:
            soil_daily[date_str]["sum"] += m
            soil_daily[date_str]["count"] += 1

    for date_str in soil_daily:
        if soil_daily[date_str]["count"] > 0:
            soil_daily[date_str]["avg"] = soil_daily[date_str]["sum"] / soil_daily[date_str]["count"]
        else:
            soil_daily[date_str]["avg"] = 0.30 # fallback

    forecast_data = []
    dates = daily.get("time", [])
    for i, date_str in enumerate(dates):
        temp_max = daily["temperature_2m_max"][i]
        rain = daily["precipitation_sum"][i]
        wind_speed = daily["wind_speed_10m_max"][i]
        humidity = daily["relative_humidity_2m_max"][i]
        
        soil_moisture = soil_daily.get(date_str, {}).get("avg", 0.30)

        weather_data = {
            "temp_max": temp_max if temp_max is not None else 28.0,
            "rain": rain if rain is not None else 0.0,
            "wind_speed": wind_speed if wind_speed is not None else 10.0,
            "humidity": humidity if humidity is not None else 75.0,
            "soil_moisture": soil_moisture
        }
        
        scores = calculate_feasibility(weather_data, DEFAULT_CONFIG)
        
        forecast_data.append({
            "date": date_str,
            "weather": weather_data,
            "scores": scores
        })
        
    return forecast_data

def generate_mock_forecast():
    import random
    mock_data = []
    today = datetime.date.today()
    for i in range(7):
        date_str = (today + datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        temp_max = round(random.uniform(28.0, 33.0), 1)
        rain = round(random.choices([0.0, random.uniform(0.1, 5.0), random.uniform(5.0, 20.0)], weights=[60, 30, 10])[0], 1)
        wind_speed = round(random.uniform(5.0, 18.0), 1)
        humidity = round(random.uniform(70.0, 95.0), 1)
        soil_moisture = round(random.uniform(0.25, 0.45), 3)
        
        weather_data = {
            "temp_max": temp_max,
            "rain": rain,
            "wind_speed": wind_speed,
            "humidity": humidity,
            "soil_moisture": soil_moisture
        }
        
        scores = calculate_feasibility(weather_data, DEFAULT_CONFIG)
        
        mock_data.append({
            "date": date_str,
            "weather": weather_data,
            "scores": scores
        })
    return mock_data

def generate_mock_audit(days=7):
    import random
    mock_records = []
    end_dt = datetime.date.today() - datetime.timedelta(days=3)
    
    for i in range(days):
        date_str = (end_dt - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        
        temp_actual = round(random.uniform(28.0, 33.0), 1)
        temp_fore = round(temp_actual + random.uniform(-2.0, 2.0), 1)
        
        rain_actual = round(random.choices([0.0, random.uniform(0.1, 10.0)], weights=[70, 30])[0], 1)
        rain_fore = round(max(0.0, rain_actual + random.uniform(-3.0, 3.0)), 1)
        
        wind_actual = round(random.uniform(5.0, 15.0), 1)
        wind_fore = round(max(0.0, wind_actual + random.uniform(-4.0, 4.0)), 1)
        
        humidity_actual = round(random.uniform(70.0, 95.0), 1)
        humidity_fore = round(max(0.0, min(100.0, humidity_actual + random.uniform(-10.0, 10.0))), 1)
        
        mock_records.append({
            "date_str": date_str,
            "temp_actual": temp_actual,
            "temp_fore": temp_fore,
            "rain_actual": rain_actual,
            "rain_fore": rain_fore,
            "wind_actual": wind_actual,
            "wind_fore": wind_fore,
            "humidity_actual": humidity_actual,
            "humidity_fore": humidity_fore
        })
        
    mock_records.reverse()
    
    temp_acc = round(random.uniform(85.0, 95.0), 2)
    rain_acc = round(random.uniform(70.0, 85.0), 2)
    wind_acc = round(random.uniform(80.0, 92.0), 2)
    overall_acc = round(0.40 * temp_acc + 0.40 * rain_acc + 0.20 * wind_acc, 2)
    
    return {
        "status": "success",
        "metrics": {
            "overall": overall_acc,
            "temp": temp_acc,
            "rain": rain_acc,
            "wind": wind_acc
        },
        "data": mock_records,
        "is_mock": True
    }


@app.route("/")
def index():
    return render_template("dashboard.html")

@app.route("/api/forecast")
def forecast_api():
    lat = request.args.get("lat", default=LATITUDE, type=float)
    lon = request.args.get("lon", default=LONGITUDE, type=float)
    try:
        data = fetch_weather_forecast(lat, lon)
        if not data:
            raise ValueError("Empty forecast data returned from Open-Meteo API")
        return jsonify({"status": "success", "data": data, "is_mock": False})

    except Exception as e:
        import traceback
        print(f"--- API Forecast Error (lat={lat}, lon={lon}) ---")
        traceback.print_exc()
        print("-------------------------------------------------")
        data = generate_mock_forecast()
        return jsonify({"status": "success", "data": data, "is_mock": True})

@app.route("/api/audit")
def audit_api():
    lat = request.args.get("lat", default=LATITUDE, type=float)
    lon = request.args.get("lon", default=LONGITUDE, type=float)
    days = request.args.get("days", default=7, type=int)
    try:
        days = max(7, min(30, days))
        
        end_dt = datetime.date.today() - datetime.timedelta(days=3)
        start_dt = end_dt - datetime.timedelta(days=days)
        start_str = start_dt.strftime("%Y-%m-%d")
        end_str = end_dt.strftime("%Y-%m-%d")
        
        archive_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={start_str}&end_date={end_str}&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia%2FSingapore"
        forecast_url = f"https://historical-forecast-api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&start_date={start_str}&end_date={end_str}&models=gfs_seamless&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia%2FSingapore"
        
        archive_res = requests.get(archive_url, timeout=5).json()
        forecast_res = requests.get(forecast_url, timeout=5).json()
        
        if "daily" not in archive_res or "daily" not in forecast_res:
            raise ValueError("Failed to fetch historical/forecast data from Open-Meteo")
            
        arch_daily = archive_res["daily"]
        fore_daily = forecast_res["daily"]
        
        import pandas as pd
        df_arch = pd.DataFrame({
            "date": pd.to_datetime(arch_daily["time"]),
            "temp_actual": arch_daily["temperature_2m_max"],
            "rain_actual": arch_daily["precipitation_sum"],
            "wind_actual": arch_daily["wind_speed_10m_max"],
            "humidity_actual": arch_daily["relative_humidity_2m_max"]
        })
        
        df_fore = pd.DataFrame({
            "date": pd.to_datetime(fore_daily["time"]),
            "temp_fore": fore_daily["temperature_2m_max"],
            "rain_fore": fore_daily["precipitation_sum"],
            "wind_fore": fore_daily["wind_speed_10m_max"],
            "humidity_fore": fore_daily["relative_humidity_2m_max"]
        })
        
        df_audit = pd.merge(df_arch, df_fore, on="date").fillna(0.0)
        
        # Compute parameter accuracies
        temp_err = (df_audit["temp_fore"] - df_audit["temp_actual"]).abs()
        temp_acc = 100.0 * (1.0 - (temp_err / df_audit["temp_actual"].replace(0.0, 1.0)).mean())
        temp_acc = max(0.0, min(100.0, temp_acc))
        
        rain_err = (df_audit["rain_fore"] - df_audit["rain_actual"]).abs()
        rain_acc = 100.0 * (1.0 - (rain_err / (df_audit["rain_actual"] + 5.0)).mean())
        rain_acc = max(0.0, min(100.0, rain_acc))
        
        wind_err = (df_audit["wind_fore"] - df_audit["wind_actual"]).abs()
        wind_denom = df_audit["wind_actual"].replace(0.0, 1.0)
        wind_acc = 100.0 * (1.0 - (wind_err / wind_denom).mean())
        wind_acc = max(0.0, min(100.0, wind_acc))
        
        overall_acc = 0.40 * temp_acc + 0.40 * rain_acc + 0.20 * wind_acc
        overall_acc = max(0.0, min(100.0, overall_acc))
        
        df_audit["date_str"] = df_audit["date"].dt.strftime("%Y-%m-%d")
        records = df_audit.to_dict(orient="records")
        
        return jsonify({
            "status": "success",
            "metrics": {
                "overall": round(overall_acc, 2),
                "temp": round(temp_acc, 2),
                "rain": round(rain_acc, 2),
                "wind": round(wind_acc, 2)
            },
            "data": records,
            "is_mock": False
        })
    except Exception as e:
        import traceback
        print(f"--- API Audit Error (lat={lat}, lon={lon}, days={days}) ---")
        traceback.print_exc()
        print("---------------------------------------------")
        mock_audit = generate_mock_audit(days)
        return jsonify(mock_audit)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
