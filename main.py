from flask import Flask, jsonify, render_template, request
import requests
import datetime
import os
from agronomy import calculate_feasibility, DEFAULT_CONFIG

app = Flask(__name__)

# Preset coordinates (e.g., Pekanbaru, Riau)
LATITUDE = 0.507
LONGITUDE = 101.447

def fetch_weather_forecast(latitude=LATITUDE, longitude=LONGITUDE):
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max,et0_fao_evapotranspiration&timezone=Asia%2FSingapore"
    soil_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&hourly=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_temperature_0_to_7cm&timezone=Asia%2FSingapore"
    
    r_weather = requests.get(weather_url).json()
    r_soil = requests.get(soil_url).json()
    
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

@app.route("/")
def index():
    return render_template("dashboard.html")

@app.route("/api/forecast")
def forecast_api():
    try:
        lat = request.args.get("lat", default=LATITUDE, type=float)
        lon = request.args.get("lon", default=LONGITUDE, type=float)
        data = fetch_weather_forecast(lat, lon)
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/audit")
def audit_api():
    try:
        lat = request.args.get("lat", default=LATITUDE, type=float)
        lon = request.args.get("lon", default=LONGITUDE, type=float)
        days = request.args.get("days", default=7, type=int)
        
        days = max(7, min(30, days))
        
        end_dt = datetime.date.today() - datetime.timedelta(days=3)
        start_dt = end_dt - datetime.timedelta(days=days)
        start_str = start_dt.strftime("%Y-%m-%d")
        end_str = end_dt.strftime("%Y-%m-%d")
        
        archive_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={start_str}&end_date={end_str}&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia%2FSingapore"
        forecast_url = f"https://historical-forecast-api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&start_date={start_str}&end_date={end_str}&models=gfs_seamless&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max&timezone=Asia%2FSingapore"
        
        archive_res = requests.get(archive_url).json()
        forecast_res = requests.get(forecast_url).json()
        
        if "daily" not in archive_res or "daily" not in forecast_res:
            return jsonify({"status": "error", "message": "Failed to fetch historical/forecast data from Open-Meteo"}), 500
            
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
            "data": records
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
