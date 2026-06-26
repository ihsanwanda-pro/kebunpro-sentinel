// Global Application State
let currentLanguage = 'Bahasa Indonesia';
let isDarkMode = false;
let forecastData = []; // Local API forecast response cache
let auditData = [];    // Local API audit response cache
let auditChart = null; // Chart.js reference

// Default Config matching agronomy.py (represented in fractional soil moisture)
const config = {
    // Fertilizing thresholds
    fert_optimal_rain_min: 2.0,
    fert_optimal_rain_max: 8.0,
    fert_runoff_rain: 15.0,
    fert_runoff_penalty: 80.0,
    fert_volatilization_rain: 0.0,
    fert_volatilization_moisture: 0.20,
    fert_volatilization_penalty: 60.0,
    fert_saturated_moisture: 0.45,
    fert_saturated_penalty: 70.0,
    fert_heat_temp: 35.0,
    fert_heat_penalty: 30.0,
    
    // Harvesting thresholds
    harv_mud_rain: 15.0,
    harv_mud_penalty: 90.0,
    harv_wet_rain_min: 5.0,
    harv_wet_rain_max: 15.0,
    harv_wet_penalty: 50.0,
    harv_wind_speed: 25.0,
    harv_wind_penalty: 50.0,
    
    // Spraying thresholds
    spray_drift_wind_med: 15.0,
    spray_drift_penalty_med: 60.0,
    spray_drift_wind_high: 25.0,
    spray_drift_penalty_high: 100.0,
    spray_wash_rain: 2.0,
    spray_wash_penalty: 80.0,
    spray_humidity_min: 60.0,
    spray_humidity_max: 85.0,
    spray_humidity_penalty: 30.0
};

// Preset locations
const PRESETS = {
    "Kebun-1": { lat: -0.487627, lon: 101.403397, location: "Kec. Tambang, Kab. Kampar, Riau" },
    "Kebun-2": { lat:  4.346543, lon:  98.124288, location: "Kab. Langkat, Sumatera Utara" },
    "Kebun-3": { lat:  1.384223, lon: 100.505484, location: "Kec. Rambah, Kab. Rokan Hulu, Riau" },
    "Kebun-4": { lat:  1.512558, lon: 101.657155, location: "Kab. Pelalawan, Riau" },
    "Kebun-5": { lat: -1.296778, lon: 101.557500, location: "Kec. Kamang Baru, Kab. Sijunjung, Sumbar" },
    "Kebun-6": { lat: -1.294972, lon: 101.560500, location: "Kec. Kamang Baru, Kab. Sijunjung, Sumbar" }
};

// Frontend Localization Map
const LOCALES = {
    "Bahasa Indonesia": {
        "title": "🌿 Perencana & Sentinel Operasional Perkebunan Sawit",
        "subtitle": "Optimalkan kegiatan operasional harian (Pemupukan, Pemanenan, Penyemprotan) berdasarkan indikator cuaca satelit & kelembapan tanah.",
        "settings_title": "🌿 Pengaturan Lokasi & Parameter",
        "loc_selection_title": "Pemilihan Lokasi",
        "loc_preset_lbl": "Preset Perkebunan",
        "loc_custom_lbl": "Koordinat Kustom",
        "select_preset_lbl": "Pilih Perkebunan",
        "lat_lbl": "Lintang (Latitude)",
        "lon_lbl": "Bujur (Longitude)",
        "apply_loc_btn": "Terapkan Lokasi",
        "agronomic_params_title": "⚙️ Parameter Agronomis",
        "param_fert_title": "Pengaturan Pemupukan",
        "label_fert_runoff": "Curah Hujan Maksimal Runoff (mm)",
        "label_fert_min_moist": "Kelembapan Tanah Minimal (Vol %)",
        "label_fert_max_moist": "Batas Kejenuhan Tanah (Saturated) Maks.",
        "param_harv_title": "Pengaturan Pemanenan",
        "label_harv_mud": "Curah Hujan Jalan Lumpur (mm)",
        "label_harv_wind": "Kecepatan Angin Bahaya (km/jam)",
        "param_spray_title": "Pengaturan Penyemprotan",
        "label_spray_wind_med": "Angin Peringatan (km/jam)",
        "label_spray_wind_high": "Angin Kritis (km/jam)",
        "label_spray_wash": "Curah Hujan Cuci Spray (mm)",
        
        "tab_planner": "Perencana Operasi",
        "tab_audit": "Audit Akurasi",
        
        "loading_text": "Memuat prakiraan cuaca satelit...",
        
        "optimal": "Optimal",
        "caution": "Hati-hati",
        "unsuitable": "Tidak Cocok",
        
        "op_fert": "Pemupukan",
        "op_harv": "Pemanenan",
        "op_spray": "Penyemprotan",
        
        "status_green": "Aman dilakukan",
        "status_yellow": "Hati-hati (Catatan cuaca)",
        "status_red": "Tunda (Berisiko)",
        
        "lbl_temp": "Suhu Maks",
        "lbl_rain": "Hujan",
        "lbl_wind": "Angin",
        "lbl_humidity": "Kelembapan",
        "lbl_soil": "Tanah (0-7cm)",
        
        "audit_desc": "Membandingkan data prakiraan cuaca historis dengan data observasi satelit aktual dari Open-Meteo Archive untuk mengevaluasi akurasi forecast model GFS.",
        "audit_select_days": "Pilih Jendela Evaluasi Historis (Hari)",
        "audit_overall_accuracy": "Akurasi Prakiraan Keseluruhan",
        "audit_temp_acc": "Akurasi Suhu Maksimum",
        "audit_rain_acc": "Akurasi Curah Hujan",
        "audit_wind_acc": "Akurasi Kecepatan Angin",
        "audit_chart_title": "Perbandingan Historis (Prakiraan vs Observasi Aktual)",
        
        "param_temp": "Suhu Udara Maksimum",
        "param_rain": "Curah Hujan",
        "param_wind": "Kecepatan Angin",
        
        "audit_forecast": "Prakiraan Model",
        "audit_actual": "Observasi Aktual",
        
        "insight_optimal_all": "Kondisi cuaca 3 hari ke depan sangat baik. Seluruh kegiatan operasional dapat berjalan sesuai jadwal."
    },
    "English": {
        "title": "🌿 Nusantara Palm-Estate Operations Planner & Sentinel",
        "subtitle": "Optimize day-to-day operations (Fertilizing, Harvesting, Spraying) based on satellite weather & soil moisture indicators.",
        "settings_title": "🌿 Estate Controls & Parameters",
        "loc_selection_title": "Location Selection",
        "loc_preset_lbl": "Preset Estates",
        "loc_custom_lbl": "Custom Coordinates",
        "select_preset_lbl": "Select Estate",
        "lat_lbl": "Latitude",
        "lon_lbl": "Longitude",
        "apply_loc_btn": "Apply Location",
        "agronomic_params_title": "⚙️ Agronomic Parameters",
        "param_fert_title": "Fertilization Settings",
        "label_fert_runoff": "Max Rain for Runoff (mm)",
        "label_fert_min_moist": "Min Soil Moisture (Vol %)",
        "label_fert_max_moist": "Max Saturated Moisture",
        "param_harv_title": "Harvesting Settings",
        "label_harv_mud": "Impassable Mud Rain (mm)",
        "label_harv_wind": "Danger Wind Speed (km/h)",
        "param_spray_title": "Spraying Settings",
        "label_spray_wind_med": "Caution Wind (km/h)",
        "label_spray_wind_high": "Critical Wind (km/h)",
        "label_spray_wash": "Wash-off Rain (mm)",
        
        "tab_planner": "Operations Planner",
        "tab_audit": "Accuracy Audit",
        
        "loading_text": "Loading satellite meteorological forecast...",
        
        "optimal": "Optimal",
        "caution": "Caution",
        "unsuitable": "Unsuitable",
        
        "op_fert": "Fertilizing",
        "op_harv": "Harvesting",
        "op_spray": "Spraying",
        
        "status_green": "Optimal (Safe to work)",
        "status_yellow": "Caution (Check parameters)",
        "status_red": "Unsuitable (Reschedule)",
        
        "lbl_temp": "Max Temp",
        "lbl_rain": "Rain",
        "lbl_wind": "Wind",
        "lbl_humidity": "Humidity",
        "lbl_soil": "Soil (0-7cm)",
        
        "audit_desc": "Comparing historical GFS forecast data with actual satellite observation data from Open-Meteo Archive to verify model accuracy.",
        "audit_select_days": "Select Historical Evaluation Window (Days)",
        "audit_overall_accuracy": "Overall Forecast Accuracy",
        "audit_temp_acc": "Max Temperature Accuracy",
        "audit_rain_acc": "Precipitation Accuracy",
        "audit_wind_acc": "Wind Speed Accuracy",
        "audit_chart_title": "Historical Comparison (Forecast vs Actual Observation)",
        
        "param_temp": "Maximum Air Temperature",
        "param_rain": "Precipitation Sum",
        "param_wind": "Wind Speed Max",
        
        "audit_forecast": "Model Forecast",
        "audit_actual": "Actual Observation",
        
        "insight_optimal_all": "Weather conditions for the next 3 days are excellent. All operations can proceed as scheduled."
    }
};

// JS implementation of agronomy.py calculations for instant re-computation
function calculateFeasibilityJS(weather, conf) {
    let scores = {
        fertilizer: 100.0,
        harvesting: 100.0,
        spraying: 100.0
    };
    
    const temp = weather.temp_max ?? 28.0;
    const rain = weather.rain ?? 0.0;
    const moisture = weather.soil_moisture ?? 0.30;
    const wind = weather.wind_speed ?? 10.0;
    const humidity = weather.humidity ?? 75.0;

    // 1. FERTILIZER APPLICATION
    if (rain > conf.fert_runoff_rain) {
        scores.fertilizer -= conf.fert_runoff_penalty;
    } else if (rain >= conf.fert_optimal_rain_min && rain <= conf.fert_optimal_rain_max && moisture >= 0.25 && moisture <= 0.40) {
        scores.fertilizer += 10.0;
    }
        
    if (rain === conf.fert_volatilization_rain && moisture < conf.fert_volatilization_moisture) {
        scores.fertilizer -= conf.fert_volatilization_penalty;
    } else if (moisture > conf.fert_saturated_moisture) {
        scores.fertilizer -= conf.fert_saturated_penalty;
    }
        
    if (temp > conf.fert_heat_temp) {
        scores.fertilizer -= conf.fert_heat_penalty;
    }
        
    // 2. HARVESTING
    if (rain > conf.harv_mud_rain) {
        scores.harvesting -= conf.harv_mud_penalty;
    } else if (rain >= conf.harv_wet_rain_min && rain <= conf.harv_wet_rain_max) {
        scores.harvesting -= conf.harv_wet_penalty;
    }
        
    if (wind > conf.harv_wind_speed) {
        scores.harvesting -= conf.harv_wind_penalty;
    }
        
    // 3. SPRAYING
    if (wind > conf.spray_drift_wind_high) {
        scores.spraying -= conf.spray_drift_penalty_high;
    } else if (wind > conf.spray_drift_wind_med) {
        scores.spraying -= conf.spray_drift_penalty_med;
    }
        
    if (rain > conf.spray_wash_rain) {
        scores.spraying -= conf.spray_wash_penalty;
    }
        
    if (humidity < conf.spray_humidity_min || humidity > conf.spray_humidity_max) {
        scores.spraying -= conf.spray_humidity_penalty;
    }
        
    // Clamp
    scores.fertilizer = Math.max(0, Math.min(100, scores.fertilizer));
    scores.harvesting = Math.max(0, Math.min(100, scores.harvesting));
    scores.spraying = Math.max(0, Math.min(100, scores.spraying));
        
    return scores;
}

// Hover Tooltip Detailed Penalty Compiler
function compileTooltip(opType, weather, conf, lang) {
    const isIndo = lang === "Bahasa Indonesia";
    let reasons = [];
    
    const temp = weather.temp_max;
    const rain = weather.rain;
    const moisture = weather.soil_moisture;
    const wind = weather.wind_speed;
    const humidity = weather.humidity;
    
    if (opType === "fertilizer") {
        if (rain > conf.fert_runoff_rain) {
            reasons.push(isIndo ? 
                `Hujan lebat (${rain.toFixed(1)} mm > ${conf.fert_runoff_rain} mm) berisiko hanyutan (runoff)` : 
                `Heavy rain (${rain.toFixed(1)} mm > ${conf.fert_runoff_rain} mm) risks runoff`
            );
        }
        if (rain === conf.fert_volatilization_rain && moisture < conf.fert_volatilization_moisture) {
            reasons.push(isIndo ? 
                `Tanah kering (${(moisture*100).toFixed(1)}% < ${(conf.fert_volatilization_moisture*100).toFixed(0)}%) berisiko penguapan Urea` : 
                `Dry soil (${(moisture*100).toFixed(1)}% < ${(conf.fert_volatilization_moisture*100).toFixed(0)}%) risks volatilization`
            );
        } else if (moisture > conf.fert_saturated_moisture) {
            reasons.push(isIndo ? 
                `Tanah jenuh air (${(moisture*100).toFixed(1)}% > ${(conf.fert_saturated_moisture*100).toFixed(0)}%) membatasi penyerapan` : 
                `Saturated soil (${(moisture*100).toFixed(1)}% > ${(conf.fert_saturated_moisture*100).toFixed(0)}%) limits absorption`
            );
        }
        if (temp > conf.fert_heat_temp) {
            reasons.push(isIndo ? 
                `Suhu panas (${temp.toFixed(1)}°C > ${conf.fert_heat_temp}°C) memicu penguapan Nitrogen` : 
                `High temperature (${temp.toFixed(1)}°C > ${conf.fert_heat_temp}°C) triggers volatilization`
            );
        }
    } else if (opType === "harvesting") {
        if (rain > conf.harv_mud_rain) {
            reasons.push(isIndo ? 
                `Hujan lebat (${rain.toFixed(1)} mm > ${conf.harv_mud_rain} mm) menyebabkan jalan berlumpur` : 
                `Heavy rain (${rain.toFixed(1)} mm > ${conf.harv_mud_rain} mm) causes muddy roads`
            );
        } else if (rain >= conf.harv_wet_rain_min && rain <= conf.harv_wet_rain_max) {
            reasons.push(isIndo ? 
                `Hujan sedang (${rain.toFixed(1)} mm) membasahi tandan & licin` : 
                `Moderate rain (${rain.toFixed(1)} mm) causes wet & slippery roads`
            );
        }
        if (wind > conf.harv_wind_speed) {
            reasons.push(isIndo ? 
                `Angin kencang (${wind.toFixed(1)} km/jam > ${conf.harv_wind_speed} km/jam) berisiko keselamatan` : 
                `High wind (${wind.toFixed(1)} km/h > ${conf.harv_wind_speed} km/h) safety hazard`
            );
        }
    } else if (opType === "spraying") {
        if (wind > conf.spray_drift_wind_high) {
            reasons.push(isIndo ? 
                `Angin sangat kencang (${wind.toFixed(1)} km/jam > ${conf.spray_drift_wind_high} km/jam) memicu drift kritis` : 
                `High wind (${wind.toFixed(1)} km/h > ${conf.spray_drift_wind_high} km/h) causes critical chemical drift`
            );
        } else if (wind > conf.spray_drift_wind_med) {
            reasons.push(isIndo ? 
                `Angin sedang (${wind.toFixed(1)} km/jam > ${conf.spray_drift_wind_med} km/jam) memicu drift sedang` : 
                `Moderate wind (${wind.toFixed(1)} km/h > ${conf.spray_drift_wind_med} km/h) causes moderate drift`
            );
        }
        if (rain > conf.spray_wash_rain) {
            reasons.push(isIndo ? 
                `Hujan (${rain.toFixed(1)} mm > ${conf.spray_wash_rain} mm) membilas semprotan (wash-off)` : 
                `Rain (${rain.toFixed(1)} mm > ${conf.spray_wash_rain} mm) washes off chemicals`
            );
        }
        if (humidity < conf.spray_humidity_min || humidity > conf.spray_humidity_max) {
            reasons.push(isIndo ? 
                `Kelembapan (${humidity.toFixed(0)}% di luar rentang ${conf.spray_humidity_min}-${conf.spray_humidity_max}%)` : 
                `Humidity (${humidity.toFixed(0)}% out of range ${conf.spray_humidity_min}-${conf.spray_humidity_max}%)`
            );
        }
    }
    
    if (reasons.length === 0) {
        return isIndo ? "Kondisi optimal untuk pengerjaan" : "All conditions optimal for operation";
    }
    return reasons.join(" | ");
}

// Parse next 3 days of calculated daily scores and display error/warning banner
function updateSummaryAlerts(data, conf, lang) {
    const isIndo = lang === "Bahasa Indonesia";
    const alertsContainer = document.getElementById('summary-alerts');
    alertsContainer.innerHTML = '';
    
    let worstSeverity = 'success'; // can be 'success', 'warning', or 'error'
    let dailyAlerts = []; // Array of { day: 'Senin', warnings: [...] }
    
    const dayMap = {
        "Sunday": "Minggu", "Monday": "Senin", "Tuesday": "Selasa", "Wednesday": "Rabu",
        "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu"
    };

    // Analyze first 3 days
    for (let i = 0; i < Math.min(3, data.length); i++) {
        const dayData = data[i];
        const dateObj = new Date(dayData.date);
        
        let dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        if (isIndo) {
            dayLabel = dayMap[dayLabel] || dayLabel;
        }
        
        const scores = calculateFeasibilityJS(dayData.weather, conf);
        let dayWarnings = [];
        
        // 1. Fertilizing
        if (scores.fertilizer < 40.0) {
            worstSeverity = 'error';
            dayWarnings.push(isIndo ? 
                `Pemupukan <strong>Tidak Cocok</strong> (${Math.round(scores.fertilizer)}%)` : 
                `Fertilizing <strong>Unsuitable</strong> (${Math.round(scores.fertilizer)}%)`
            );
        } else if (scores.fertilizer < 75.0) {
            if (worstSeverity !== 'error') worstSeverity = 'warning';
            dayWarnings.push(isIndo ? 
                `Pemupukan <strong>Hati-hati</strong> (${Math.round(scores.fertilizer)}%)` : 
                `Fertilizing <strong>Caution</strong> (${Math.round(scores.fertilizer)}%)`
            );
        }
        
        // 2. Harvesting
        if (scores.harvesting < 40.0) {
            worstSeverity = 'error';
            dayWarnings.push(isIndo ? 
                `Pemanenan <strong>Tidak Cocok</strong> (${Math.round(scores.harvesting)}%)` : 
                `Harvesting <strong>Unsuitable</strong> (${Math.round(scores.harvesting)}%)`
            );
        } else if (scores.harvesting < 75.0) {
            if (worstSeverity !== 'error') worstSeverity = 'warning';
            dayWarnings.push(isIndo ? 
                `Pemanenan <strong>Hati-hati</strong> (${Math.round(scores.harvesting)}%)` : 
                `Harvesting <strong>Caution</strong> (${Math.round(scores.harvesting)}%)`
            );
        }
        
        // 3. Spraying
        if (scores.spraying < 40.0) {
            worstSeverity = 'error';
            dayWarnings.push(isIndo ? 
                `Penyemprotan <strong>Tidak Cocok</strong> (${Math.round(scores.spraying)}%)` : 
                `Spraying <strong>Unsuitable</strong> (${Math.round(scores.spraying)}%)`
            );
        } else if (scores.spraying < 75.0) {
            if (worstSeverity !== 'error') worstSeverity = 'warning';
            dayWarnings.push(isIndo ? 
                `Penyemprotan <strong>Hati-hati</strong> (${Math.round(scores.spraying)}%)` : 
                `Spraying <strong>Caution</strong> (${Math.round(scores.spraying)}%)`
            );
        }
        
        if (dayWarnings.length > 0) {
            dailyAlerts.push({
                day: dayLabel,
                warnings: dayWarnings
            });
        }
    }
    
    // Render as a single unified card
    const box = document.createElement('div');
    box.className = `alert-box ${worstSeverity}`;
    
    if (worstSeverity === 'success') {
        box.innerHTML = `<p>${LOCALES[lang].insight_optimal_all}</p>`;
    } else {
        const titleIcon = worstSeverity === 'error' ? '⚠️' : 'ℹ️';
        const titleText = isIndo ? 
            `${titleIcon} <strong>Peringatan Kegiatan Operasional (3 Hari Ke Depan):</strong>` : 
            `${titleIcon} <strong>Operational Advisories (Next 3 Days):</strong>`;
            
        let listHtml = `<div style="width: 100%;">
            <p style="margin-bottom: 0.5rem; font-weight: 700;">${titleText}</p>
            <ul style="padding-left: 1.25rem; margin: 0; font-size: 0.85rem; line-height: 1.5;">`;
            
        dailyAlerts.forEach(alert => {
            listHtml += `<li style="margin-bottom: 0.35rem;">
                <strong>${alert.day}:</strong> ${alert.warnings.join(', ')}
            </li>`;
        });
        
        listHtml += `</ul></div>`;
        box.innerHTML = listHtml;
    }
    
    alertsContainer.appendChild(box);
}

// Render SawitPro Shop CTA Card
function updateMarketingCard(lang) {
    const isIndo = lang === "Bahasa Indonesia";
    const container = document.getElementById('marketing-card');
    
    if (isIndo) {
        container.innerHTML = `
            <div class="sawit-cta-inner">
                <div class="sawit-cta-icon">🛒</div>
                <div class="sawit-cta-text">
                    <h4>🛡️ Kemitraan Toko SawitPro</h4>
                    <p><b>Pastikan gunakan pupuk 100% Asli!</b> Beli pupuk premium, racun hama berkualitas, dan semua alat kebutuhan kebun sawit Anda secara aman di sini.</p>
                </div>
                <a href="https://toko.sawitpro.id/?" target="_blank" class="sawit-cta-btn">🔗 Kunjungi Toko SawitPro</a>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="sawit-cta-inner">
                <div class="sawit-cta-icon">🛒</div>
                <div class="sawit-cta-text">
                    <h4>🛡️ SawitPro Partnership Store</h4>
                    <p><b>Ensure 100% Genuine Fertilizers!</b> Buy premium fertilizers, effective crop chemicals, and all your harvesting tool needs safely.</p>
                </div>
                <a href="https://toko.sawitpro.id/?" target="_blank" class="sawit-cta-btn">🔗 Visit SawitPro Store</a>
            </div>
        `;
    }
}

// DOM UI Translations Updater
function updatePageLanguage(lang) {
    currentLanguage = lang;
    const map = LOCALES[lang];
    
    // Header & Subtitles
    document.getElementById('txt-app-title').textContent = map.title;
    document.getElementById('txt-app-subtitle').textContent = map.subtitle;
    document.getElementById('txt-settings-title').textContent = map.settings_title;
    
    // Settings Sidebar labels
    document.getElementById('txt-loc-selection-title').textContent = map.loc_selection_title;
    document.getElementById('txt-loc-preset-label').textContent = map.loc_preset_lbl;
    document.getElementById('txt-loc-custom-label').textContent = map.loc_custom_lbl;
    document.getElementById('txt-select-preset-label').textContent = map.select_preset_lbl;
    document.getElementById('txt-lat-label').textContent = map.lat_lbl;
    document.getElementById('txt-lon-label').textContent = map.lon_lbl;
    document.getElementById('btn-apply-coords').textContent = map.apply_loc_btn;
    document.getElementById('txt-agronomic-params-title').textContent = map.agronomic_params_title;
    
    // Details expanders
    document.getElementById('txt-param-fert-title').textContent = map.param_fert_title;
    document.getElementById('txt-label-fert-runoff').textContent = map.label_fert_runoff;
    document.getElementById('txt-label-fert-min-moist').textContent = map.label_fert_min_moist;
    document.getElementById('txt-label-fert-max-moist').textContent = map.label_fert_max_moist;
    
    document.getElementById('txt-param-harv-title').textContent = map.param_harv_title;
    document.getElementById('txt-label-harv-mud').textContent = map.label_harv_mud;
    document.getElementById('txt-label-harv-wind').textContent = map.label_harv_wind;
    
    document.getElementById('txt-param-spray-title').textContent = map.param_spray_title;
    document.getElementById('txt-label-spray-wind-med').textContent = map.label_spray_wind_med;
    document.getElementById('txt-label-spray-wind-high').textContent = map.label_spray_wind_high;
    document.getElementById('txt-label-spray-wash').textContent = map.label_spray_wash;
    
    // Nav tabs
    document.getElementById('txt-tab-planner').textContent = map.tab_planner;
    document.getElementById('txt-tab-audit').textContent = map.tab_tab_audit || map.tab_audit;
    
    // Loading State
    document.getElementById('txt-loading-text').textContent = map.loading_text;
    
    // Audit labels
    document.getElementById('txt-audit-desc').textContent = map.audit_desc;
    document.getElementById('txt-audit-select-days').textContent = map.audit_select_days;
    document.getElementById('txt-audit-overall-lbl').textContent = map.audit_overall_accuracy;
    document.getElementById('txt-audit-temp-lbl').textContent = map.audit_temp_acc;
    document.getElementById('txt-audit-rain-lbl').textContent = map.audit_rain_acc;
    document.getElementById('txt-audit-wind-lbl').textContent = map.audit_wind_acc;
    document.getElementById('txt-audit-chart-title').textContent = map.audit_chart_title;

    // Refresh layout outputs
    if (forecastData.length > 0) {
        renderForecast(forecastData);
    }
    
    updateMarketingCard(lang);
    setupAuditParamsDropdown();
    if (auditData.length > 0) {
        renderAudit(auditData);
    }
}

// Fetch forecast from server and cache locally
function fetchForecast(lat, lon) {
    resetKebunCardSkeleton();
    updateKebunCard(null); // update name/location immediately
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    
    let url = '/api/forecast';
    if (lat !== undefined && lon !== undefined) {
        url += `?lat=${lat}&lon=${lon}`;
    }
    
    fetch(url)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                forecastData = res.data;
                renderForecast(forecastData);
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
            } else {
                showError("Gagal memuat data: " + res.message);
            }
        })
        .catch(err => {
            showError("Koneksi bermasalah: " + err.message);
        });
}

// Show error loading
function showError(msg) {
    document.getElementById('loading').innerHTML = `<p style="color:red; font-weight:bold;">${msg}</p>`;
}

// ── Kebun Name Storage ────────────────────────────────────────
const KBP_NAME_PREFIX = 'kbp_kebun_name_';

function getStoredKebunName(key) {
    return localStorage.getItem(KBP_NAME_PREFIX + key) || key;
}

function setStoredKebunName(key, name) {
    localStorage.setItem(KBP_NAME_PREFIX + key, name.trim() || key);
}

function getActivePresetKey() {
    const isPreset = document.querySelector('input[name="loc-mode"][value="preset"]').checked;
    return isPreset ? document.getElementById('select-preset').value : '_custom';
}

function getActiveLocation() {
    const isPreset = document.querySelector('input[name="loc-mode"][value="preset"]').checked;
    if (isPreset) {
        const key = document.getElementById('select-preset').value;
        return PRESETS[key].location;
    }
    return currentLanguage === 'Bahasa Indonesia' ? 'Lokasi Kustom' : 'Custom Location';
}

// ── Kebun Context Card ────────────────────────────────────────

// Update the Kebun Context Card with live location + today's weather
function updateKebunCard(todayWeather) {
    const isIndo = currentLanguage === 'Bahasa Indonesia';
    const key    = getActivePresetKey();
    const name   = getStoredKebunName(key);
    const loc    = getActiveLocation();

    document.getElementById('kcc-name').textContent     = name;
    document.getElementById('kcc-location').textContent = loc;

    if (!todayWeather) return; // keep skeleton

    const ids = ['kcc-temp','kcc-rain','kcc-wind','kcc-humidity','kcc-soil','kcc-date'];
    ids.forEach(id => {
        document.getElementById(id).classList.remove('skeleton','skeleton-line');
    });

    document.getElementById('kcc-temp').textContent     = `${Math.round(todayWeather.temp_max)}\u00B0C`;
    document.getElementById('kcc-rain').textContent     = `${todayWeather.rain.toFixed(1)} mm`;
    document.getElementById('kcc-wind').textContent     = isIndo
        ? `${todayWeather.wind_speed.toFixed(1)} km/jam`
        : `${todayWeather.wind_speed.toFixed(1)} km/h`;
    document.getElementById('kcc-humidity').textContent = `${todayWeather.humidity.toFixed(0)}%`;
    document.getElementById('kcc-soil').textContent     = `${(todayWeather.soil_moisture * 100).toFixed(0)}% Vol`;

    const dayNamesIndo = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const dayNamesEn   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dateObj   = new Date(forecastData[0].date);
    const dayName   = isIndo ? dayNamesIndo[dateObj.getDay()] : dayNamesEn[dateObj.getDay()];
    const formatted = dateObj.toLocaleDateString(isIndo ? 'id-ID' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    document.getElementById('kcc-date').textContent = isIndo
        ? `Hari Ini \u00B7 ${dayName}, ${formatted}`
        : `Today \u00B7 ${dayName}, ${formatted}`;
}

// Reset Kebun Context Card to skeleton state before a new fetch
function resetKebunCardSkeleton() {
    ['kcc-temp','kcc-rain','kcc-wind','kcc-humidity','kcc-soil'].forEach(id => {
        const el = document.getElementById(id);
        el.classList.add('skeleton');
        el.textContent = '--';
    });
    const dateEl = document.getElementById('kcc-date');
    dateEl.classList.add('skeleton-line');
    dateEl.textContent = 'Memuat...';
}

// Initialize inline name editor with localStorage persistence
function initKebunNameEditor() {
    const nameSpan  = document.getElementById('kcc-name');
    const editBtn   = document.getElementById('kcc-edit-btn');
    const nameInput = document.getElementById('kcc-name-input');

    function openEditor() {
        const key = getActivePresetKey();
        nameInput.value = getStoredKebunName(key);
        nameSpan.classList.add('hidden');
        editBtn.classList.add('hidden');
        nameInput.classList.remove('hidden');
        nameInput.focus();
        nameInput.select();
    }

    function closeEditor() {
        const key = getActivePresetKey();
        const val = nameInput.value.trim() || key;
        setStoredKebunName(key, val);
        nameSpan.textContent = val;
        nameSpan.classList.remove('hidden');
        editBtn.classList.remove('hidden');
        nameInput.classList.add('hidden');
    }

    editBtn.addEventListener('click', openEditor);
    nameSpan.addEventListener('click', openEditor);

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  closeEditor();
        if (e.key === 'Escape') {
            nameInput.classList.add('hidden');
            nameSpan.classList.remove('hidden');
            editBtn.classList.remove('hidden');
        }
    });

    nameInput.addEventListener('blur', closeEditor);
}

// Render 7-day operations planner forecast cards
function renderForecast(data) {
    const list = document.getElementById('forecast-list');
    list.innerHTML = '';
    const template = document.getElementById('card-template');
    
    const isIndo = currentLanguage === 'Bahasa Indonesia';
    const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    data.forEach((dayData, index) => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.forecast-card');

        // Date calculations
        const dateObj = new Date(dayData.date);
        let dayName = isIndo ? dayNamesIndo[dateObj.getDay()] : dayNamesEn[dateObj.getDay()];
        
        if (index === 0) dayName = isIndo ? "Hari Ini" : "Today";
        else if (index === 1) dayName = isIndo ? "Besok" : "Tomorrow";

        const formattedDate = dateObj.toLocaleDateString(isIndo ? 'id-ID' : 'en-US', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });

        card.querySelector('.day-name').textContent = dayName;
        card.querySelector('.full-date').textContent = formattedDate;

        // Weather summary row
        card.querySelector('.temp').textContent = `${Math.round(dayData.weather.temp_max)}°C`;
        card.querySelector('.rain').textContent = `🌧️ ${dayData.weather.rain.toFixed(1)}mm`;

        // Calculate and setup operational cards based on sliders values
        const scores = calculateFeasibilityJS(dayData.weather, config);
        
        setupOperationItem(card, 'fertilizer', scores.fertilizer, dayData.weather);
        setupOperationItem(card, 'harvesting', scores.harvesting, dayData.weather);
        setupOperationItem(card, 'spraying', scores.spraying, dayData.weather);

        // Weather details inline block
        card.querySelector('.detail-temp').textContent = `${dayData.weather.temp_max.toFixed(1)}°C`;
        card.querySelector('.detail-rain').textContent = `${dayData.weather.rain.toFixed(1)} mm`;
        card.querySelector('.detail-wind').textContent = `${dayData.weather.wind_speed.toFixed(1)} km/jam`;
        card.querySelector('.detail-humidity').textContent = `${dayData.weather.humidity.toFixed(0)}%`;
        card.querySelector('.detail-soil').textContent = `${(dayData.weather.soil_moisture * 100).toFixed(0)}% Vol`;

        // Localizing details label text
        card.querySelector('.lbl-detail-temp').textContent = LOCALES[currentLanguage].lbl_temp;
        card.querySelector('.lbl-detail-rain').textContent = LOCALES[currentLanguage].lbl_rain;
        card.querySelector('.lbl-detail-wind').textContent = LOCALES[currentLanguage].lbl_wind;
        card.querySelector('.lbl-detail-humidity').textContent = LOCALES[currentLanguage].lbl_humidity;
        card.querySelector('.lbl-detail-soil').textContent = LOCALES[currentLanguage].lbl_soil;

        if (index === 0) {
            card.classList.add('expanded');
        }

        list.appendChild(card);
    });

    // Update Warnings summary alerts
    updateSummaryAlerts(data, config, currentLanguage);

    // Update Kebun Context Card with today's live weather
    updateKebunCard(data[0].weather);
}

// Format each operation item inside a day card
function setupOperationItem(card, opKey, score, weather) {
    const item = card.querySelector(`[data-op="${opKey}"]`);
    const statusText = item.querySelector('.op-status-text');
    const badgeContainer = item.querySelector('.op-badge-container');
    const tooltip = badgeContainer.querySelector('.custom-tooltip');
    
    // Dynamic text
    item.className = 'operation-item'; // reset
    let label = "";
    let className = "";
    
    if (score >= 75.0) {
        label = LOCALES[currentLanguage].status_green;
        className = "status-green";
    } else if (score >= 40.0) {
        label = LOCALES[currentLanguage].status_yellow;
        className = "status-yellow";
    } else {
        label = LOCALES[currentLanguage].status_red;
        className = "status-red";
    }

    item.classList.add(className);
    statusText.textContent = `${label} (${Math.round(score)}%)`;
    
    // Localize header text of operations
    const titlesMap = {
        fertilizer: LOCALES[currentLanguage].op_fert,
        harvesting: LOCALES[currentLanguage].op_harv,
        spraying: LOCALES[currentLanguage].op_spray
    };
    item.querySelector(`h3`).textContent = titlesMap[opKey];
    
    // Update tooltip message
    tooltip.innerHTML = compileTooltip(opKey, weather, config, currentLanguage);
}

// Expanded card detail toggle
function toggleDetails(headerEl) {
    const card = headerEl.closest('.forecast-card');
    card.classList.toggle('expanded');
}

// Local parameter controls listeners
function initializeParametersSliders() {
    const sliders = [
        { id: 'slider-fert-runoff', configKey: 'fert_runoff_rain', labelId: 'val-fert-runoff', scale: 1 },
        { id: 'slider-fert-min-moist', configKey: 'fert_volatilization_moisture', labelId: 'val-fert-min-moist', scale: 0.01 },
        { id: 'slider-fert-max-moist', configKey: 'fert_saturated_moisture', labelId: 'val-fert-max-moist', scale: 0.01 },
        
        { id: 'slider-harv-mud', configKey: 'harv_mud_rain', labelId: 'val-harv-mud', scale: 1 },
        { id: 'slider-harv-wind', configKey: 'harv_wind_speed', labelId: 'val-harv-wind', scale: 1 },
        
        { id: 'slider-spray-wind-med', configKey: 'spray_drift_wind_med', labelId: 'val-spray-wind-med', scale: 1 },
        { id: 'slider-spray-wind-high', configKey: 'spray_drift_wind_high', labelId: 'val-spray-wind-high', scale: 1 },
        { id: 'slider-spray-wash', configKey: 'spray_wash_rain', labelId: 'val-spray-wash', scale: 1 }
    ];
    
    sliders.forEach(s => {
        const input = document.getElementById(s.id);
        const label = document.getElementById(s.labelId);
        
        // Setup initial display value
        if (s.scale === 0.01) {
            input.value = Math.round(config[s.configKey] * 100);
            label.textContent = input.value;
        } else {
            input.value = config[s.configKey];
            label.textContent = input.value;
        }
        
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            label.textContent = e.target.value;
            
            // Update global config
            config[s.configKey] = val * s.scale;
            
            // Re-render immediately
            if (forecastData.length > 0) {
                renderForecast(forecastData);
            }
        });
    });
}

// Location Control Events
function initializeLocationSettings() {
    const presetRadio = document.querySelector('input[name="loc-mode"][value="preset"]');
    const customRadio = document.querySelector('input[name="loc-mode"][value="custom"]');
    const presetGroup = document.getElementById('group-preset-select');
    const customGroup = document.getElementById('group-custom-coords');
    
    presetRadio.addEventListener('change', () => {
        presetGroup.classList.remove('hidden');
        customGroup.classList.add('hidden');
        // trigger loading preset coords
        const select = document.getElementById('select-preset');
        const coords = PRESETS[select.value];
        fetchForecast(coords.lat, coords.lon);
    });
    
    customRadio.addEventListener('change', () => {
        presetGroup.classList.add('hidden');
        customGroup.classList.remove('hidden');
    });
    
    document.getElementById('select-preset').addEventListener('change', (e) => {
        const coords = PRESETS[e.target.value];
        fetchForecast(coords.lat, coords.lon);
    });
    
    document.getElementById('btn-apply-coords').addEventListener('click', () => {
        const lat = parseFloat(document.getElementById('input-lat').value);
        const lon = parseFloat(document.getElementById('input-lon').value);
        if (!isNaN(lat) && !isNaN(lon)) {
            fetchForecast(lat, lon);
        }
    });
}

// Sidebar panel slider animation toggle
function initializeSidebar() {
    const sidebar = document.getElementById('settings-sidebar');
    
    document.getElementById('btn-settings-toggle').addEventListener('click', () => {
        sidebar.classList.remove('hidden');
    });
    
    document.getElementById('btn-settings-close').addEventListener('click', () => {
        sidebar.classList.add('hidden');
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            sidebar.classList.add('hidden');
        }
    });
}

// Light & Dark Theme Controller
function initializeTheme() {
    isDarkMode = false;
    document.body.classList.remove('dark-mode');
}

// Navigation Tabs Router
function initializeTabs() {
    const plannerBtn = document.getElementById('btn-tab-planner');
    const auditBtn = document.getElementById('btn-tab-audit');
    const plannerView = document.getElementById('view-planner');
    const auditView = document.getElementById('view-audit');
    
    plannerBtn.addEventListener('click', () => {
        plannerBtn.classList.add('active');
        auditBtn.classList.remove('active');
        plannerView.classList.remove('hidden');
        auditView.classList.add('hidden');
    });
    
    auditBtn.addEventListener('click', () => {
        auditBtn.classList.add('active');
        plannerBtn.classList.remove('active');
        auditView.classList.remove('hidden');
        plannerView.classList.add('hidden');
        
        // Load audit values if empty
        const daysInput = document.getElementById('slider-audit-days');
        fetchAuditData(daysInput.value);
    });
}

function setupAuditParamsDropdown() {
    const isIndo = currentLanguage === 'Bahasa Indonesia';
    const select = document.getElementById('select-audit-param');
    const prevValue = select.value;
    
    select.innerHTML = '';
    
    const options = [
        { value: 'temp', text: isIndo ? 'Suhu Udara Maksimum (°C)' : 'Maximum Temperature (°C)' },
        { value: 'rain', text: isIndo ? 'Curah Hujan (mm)' : 'Precipitation Sum (mm)' },
        { value: 'wind', text: isIndo ? 'Kecepatan Angin (km/jam)' : 'Wind Speed Max (km/h)' }
    ];
    
    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.text;
        select.appendChild(el);
    });
    
    if (prevValue) {
        select.value = prevValue;
    }
}

function fetchAuditData(days) {
    document.getElementById('val-audit-overall').textContent = '...';
    document.getElementById('val-audit-temp').textContent = '...';
    document.getElementById('val-audit-rain').textContent = '...';
    document.getElementById('val-audit-wind').textContent = '...';
    
    const isPreset = document.querySelector('input[name="loc-mode"][value="preset"]').checked;
    let lat, lon;
    if (isPreset) {
        const select = document.getElementById('select-preset');
        lat = PRESETS[select.value].lat;
        lon = PRESETS[select.value].lon;
    } else {
        lat = parseFloat(document.getElementById('input-lat').value);
        lon = parseFloat(document.getElementById('input-lon').value);
    }
    
    if (isNaN(lat) || isNaN(lon)) {
        lat = -0.487627;
        lon = 101.403397;
    }
    
    fetch(`/api/audit?days=${days}&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                auditData = res.data;
                
                document.getElementById('val-audit-overall').textContent = `${res.metrics.overall}%`;
                document.getElementById('val-audit-temp').textContent = `${res.metrics.temp}%`;
                document.getElementById('val-audit-rain').textContent = `${res.metrics.rain}%`;
                document.getElementById('val-audit-wind').textContent = `${res.metrics.wind}%`;
                
                renderAudit(auditData);
            } else {
                alert("Gagal memuat audit data: " + res.message);
            }
        })
        .catch(err => {
            console.error("Audit fetch error: ", err);
        });
}

function renderAudit(data) {
    if (data.length === 0) return;
    
    const param = document.getElementById('select-audit-param').value || 'temp';
    const isIndo = currentLanguage === 'Bahasa Indonesia';
    
    let foreKey = 'temp_fore';
    let actualKey = 'temp_actual';
    let seriesLabel = isIndo ? 'Suhu Maksimum' : 'Max Temperature';
    
    if (param === 'rain') {
        foreKey = 'rain_fore';
        actualKey = 'rain_actual';
        seriesLabel = isIndo ? 'Curah Hujan' : 'Precipitation';
    } else if (param === 'wind') {
        foreKey = 'wind_fore';
        actualKey = 'wind_actual';
        seriesLabel = isIndo ? 'Kecepatan Angin' : 'Wind Speed';
    }
    
    const labels = data.map(d => {
        const parts = d.date_str.split('-');
        return `${parts[2]}/${parts[1]}`; // DD/MM format
    });
    const forecastValues = data.map(d => d[foreKey]);
    const actualValues = data.map(d => d[actualKey]);
    
    const gridColor = isDarkMode ? '#374151' : '#e2e8f0';
    const textColor = isDarkMode ? '#ecf0f1' : '#1e293b';
    
    const foreLineColor = isDarkMode ? '#34d399' : '#10b981';
    const actualLineColor = isDarkMode ? '#fbbf24' : '#f59e0b';
    
    const forecastLabel = LOCALES[currentLanguage].audit_forecast;
    const actualLabel = LOCALES[currentLanguage].audit_actual;

    const ctx = document.getElementById('audit-chart').getContext('2d');
    
    if (auditChart) {
        auditChart.destroy();
    }
    
    auditChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: forecastLabel,
                    data: forecastValues,
                    borderColor: foreLineColor,
                    backgroundColor: foreLineColor + '10',
                    borderWidth: 2.5,
                    pointRadius: 3,
                    tension: 0.25,
                    fill: true
                },
                {
                    label: actualLabel,
                    data: actualValues,
                    borderColor: actualLineColor,
                    backgroundColor: actualLineColor + '10',
                    borderWidth: 2.5,
                    pointRadius: 3,
                    tension: 0.25,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        boxWidth: 15,
                        font: {
                            family: "'Inter', sans-serif",
                            weight: '600',
                            size: 11
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    titleFont: { family: "'Inter', sans-serif" },
                    bodyFont: { family: "'Inter', sans-serif" }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 10
                        }
                    }
                },
                y: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

function initializeAuditEvents() {
    const slider = document.getElementById('slider-audit-days');
    const label = document.getElementById('val-audit-days');
    const selectParam = document.getElementById('select-audit-param');
    
    slider.addEventListener('change', (e) => {
        label.textContent = e.target.value;
        fetchAuditData(e.target.value);
    });
    
    slider.addEventListener('input', (e) => {
        label.textContent = e.target.value;
    });
    
    selectParam.addEventListener('change', () => {
        renderAudit(auditData);
    });
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeSidebar();
    initializeTabs();
    initializeLocationSettings();
    initializeParametersSliders();
    initializeAuditEvents();
    initKebunNameEditor();
    
    updatePageLanguage('Bahasa Indonesia');
    fetchForecast();
});
