const API_KEY = "b3a6151cab4c7eae787444c0a6e421c2";

const els = {
  form: document.getElementById("searchForm"),
  input: document.getElementById("cityInput"),
  status: document.getElementById("status"),
  result: document.getElementById("result"),
  clockTime: document.getElementById("clockTime"),
  clockDate: document.getElementById("clockDate"),
  iconWrap: document.getElementById("iconWrap"),
  compactTemp: document.getElementById("compactTemp"),
  compactMeta: document.getElementById("compactMeta"),
  feels: document.getElementById("feels"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  pressure: document.getElementById("pressure"),
  dailyRow: document.getElementById("dailyRow"),
  hourRow: document.getElementById("hourRow"),
  tempChartCanvas: document.getElementById("tempChart"),
  aqiBadge: document.getElementById("aqiBadge"),
  aqiDetails: document.getElementById("aqiDetails"),
  alertsBox: document.getElementById("alertsBox"),
  miniMap: document.getElementById("miniMap"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  locButton: document.getElementById("locButton"),
  spinnerTmpl: document.getElementById("spinnerTmpl"),
 
  rainLight: document.getElementById("rain-light"),
  rainMedium: document.getElementById("rain-medium"),
  rainHeavy: document.getElementById("rain-heavy"),
  lightningFlash: document.getElementById("lightning-flash"),
  snowContainer: document.getElementById("snow-container"),
  fog1: document.getElementById("fog-layer-1"),
  fog2: document.getElementById("fog-layer-2"),
  sunGlow: document.getElementById("sun-glow"),
};

let map = null, marker = null, tempChart = null;
let lightningTimer = null;


const kmh = ms => (ms * 3.6).toFixed(0);
const toF = c => Math.round((c * 9/5) + 32);
const iconHTML = (icon, alt) => `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${alt||'weather'}">`;
const fmtTime = (ts, tz) => new Date((ts + (tz||0)) * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:true});

function showSpinner(msg = "Loading...") {
  if (!els.status) return;
  const clone = els.spinnerTmpl?.content?.cloneNode(true);
  if (clone) {
    els.status.innerHTML = "";
    els.status.appendChild(clone);
    const s = document.createElement("span");
    s.style.marginLeft = "8px";
    s.textContent = msg;
    els.status.appendChild(s);
  } else {
    els.status.textContent = msg;
  }
}
function showStatus(msg = "") { if (els.status) els.status.textContent = msg; }
function showError(msg) { if (els.result) els.result.classList.add("hidden"); showStatus(msg); }


function updateClock() {
  const now = new Date();
  if (els.clockTime) els.clockTime.textContent = `🕒 ${now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:true})}`;
  if (els.clockDate) els.clockDate.textContent = `📅 ${now.toLocaleDateString([], {weekday:'long', day:'numeric', month:'short'})}`;
}
setInterval(updateClock, 1000);
updateClock();


function initMap() {
  if (map || !els.miniMap) return;
  try {
    map = L.map(els.miniMap, { attributionControl: false, zoomControl: false }).setView([9.93, 76.27], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    marker = L.marker([9.93, 76.27]).addTo(map);
    map.on("click", e => loadByCoords(e.latlng.lat, e.latlng.lng));
  } catch (e) {
    console.warn("Leaflet init failed:", e);
  }
}
initMap();
function updateMap(lat, lon, label) {
  if (!map) return;
  if (!marker) marker = L.marker([lat, lon]).addTo(map);
  map.setView([lat, lon], Math.max(8, map.getZoom()));
  marker.setLatLng([lat, lon]).bindPopup(label || "").openPopup();
}


function clearAllEffects() {
  
  ['rainLight','rainMedium','rainHeavy','lightningFlash','snowContainer','fog1','fog2','sunGlow'].forEach(k=>{
    const el = els[k];
    if (!el) return;
    el.classList.add('hidden');
    if (k === 'snowContainer') el.innerHTML = '';
    if (k === 'lightningFlash') el.classList.remove('flash');
    if (k === 'sunGlow') el.classList.remove('active');
  });
  if (lightningTimer) { clearTimeout(lightningTimer); lightningTimer = null; }
}

function applyRain(code) {
  const container = document.getElementById("rain-medium"); // use one layer for simplicity
  if (!container) return;

  // clear any old drops first
  container.innerHTML = "";
  container.classList.remove("hidden");

  // number of raindrops depends on intensity
  let dropCount = 0;
  if (code >= 300 && code < 400) dropCount = 80;  // drizzle
  else if (code >= 500 && code < 520) dropCount = 150; // rain
  else if (code >= 520 && code < 600) dropCount = 220; // heavy rain

  for (let i = 0; i < dropCount; i++) {
    const drop = document.createElement("div");
    drop.classList.add("rain-drop");
    drop.style.left = Math.random() * 100 + "vw"; // random X position
    drop.style.animationDuration = (0.4 + Math.random() * 0.6) + "s";
    drop.style.animationDelay = Math.random() * 2 + "s";
    container.appendChild(drop);
  }
}


function applyLightning(code) {
  const flash = els.lightningFlash;
  if (!flash) return;
  flash.classList.add('hidden');
  flash.classList.remove('flash');
  if (lightningTimer) { clearTimeout(lightningTimer); lightningTimer = null; }

  if (code >= 200 && code < 300) {
    flash.classList.remove('hidden');
    const loop = () => {
      lightningTimer = setTimeout(() => {
        flash.classList.add('flash');
        setTimeout(() => {
          flash.classList.remove('flash');
          if (!flash.classList.contains('hidden')) loop();
        }, 120);
      }, 1200 + Math.random() * 3000);
    };
    loop();
  }
}

function applySnow(code) {
  const container = els.snowContainer;
  if (!container) return;
  container.classList.add('hidden');
  container.innerHTML = '';
  if (code >= 600 && code < 700) {
    container.classList.remove('hidden');
    const count = 40;
    for (let i = 0; i < count; i++) {
      const f = document.createElement('div');
      f.className = 'snowflake';
      f.style.left = Math.random() * 100 + 'vw';
      const size = 3 + Math.random() * 6;
      f.style.width = f.style.height = size + 'px';
      f.style.setProperty('--driftX', (Math.random() * 40 - 20) + 'px');
      f.style.animationDuration = (4 + Math.random() * 3) + 's';
      container.appendChild(f);
    }
  }
}

function applyFog(code) {
  const f1 = els.fog1, f2 = els.fog2;
  if (!f1 || !f2) return;
  f1.classList.add('hidden'); f2.classList.add('hidden');
  if (code >= 700 && code < 800) {
    f1.classList.remove('hidden');
    f2.classList.remove('hidden');
  }
}

function applySunGlow(code, isDay) {
  const g = els.sunGlow;
  if (!g) return;
  g.classList.add('hidden'); g.classList.remove('active');
  if (code === 800 && isDay) {
    g.classList.remove('hidden'); g.classList.add('active');
  }
}

function setWeatherBackground(code, isDay) {
  const root = document.documentElement;
  function setBG(a,b,c){
    root.style.setProperty('--bg1', a);
    root.style.setProperty('--bg2', b);
    root.style.setProperty('--bg3', c);
  }

  if (typeof code !== 'number') {
    setBG('#1b2a3b','#20394e','#16212d'); 
    clearAllEffects();
    return;
  }

  if (code >= 200 && code < 300) {
    setBG('#1a202c','#2d3748','#0f131a');
    clearAllEffects();
    applyRain(code);
    applyLightning(code);
    return;
  }

  if (code >= 300 && code < 400) {
    setBG('#264a6f','#1f3b5f','#0c1a2b');
    clearAllEffects();
    applyRain(code);
    return;
  }

  if (code >= 500 && code < 600) {
    setBG('#0f1f33','#1e3a5f','#0b1424');
    clearAllEffects();
    applyRain(code);
    return;
  }

  if (code >= 600 && code < 700) {
    setBG('#d7e9f7','#c0d8f0','#a3bcd5');
    clearAllEffects();
    applySnow(code);
    return;
  }

  if (code >= 700 && code < 800) {
    setBG('#1d2a38','#2a3e52','#162230');
    clearAllEffects();
    applyFog(code);
    return;
  }

  if (code === 800) {
    if (isDay) {
      setBG('#7fc0ff','#5aa9f7','#3b82f6');
    } else {
      setBG('#0e1424','#111a2e','#0b0f19');
    }
    clearAllEffects();
    applySunGlow(code, isDay);
    return;
  }

  if (code > 800) {
    setBG('#1b2a3b','#20394e','#16212d');
    clearAllEffects();
    return;
  }

  setBG('#1b2a3b','#20394e','#16212d');
  clearAllEffects();
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

async function getCurrent(q) {
  
  if (typeof q === 'string') {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${API_KEY}&units=metric`;
    return fetchJSON(url);
  } else {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${q.lat}&lon=${q.lon}&appid=${API_KEY}&units=metric`;
    return fetchJSON(url);
  }
}
async function getForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  return fetchJSON(url);
}
async function getAir(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  return fetchJSON(url);
}

function setIcon(icon, alt) { if (els.iconWrap) els.iconWrap.innerHTML = icon ? iconHTML(icon, alt) : ""; }

function renderCurrent(cur) {
  
  clearAllEffects();

  const { main, weather, wind, sys, coord, name, timezone } = cur;
  const w = (weather && weather[0]) || {};
  
  if (els.compactTemp) els.compactTemp.textContent = `${Math.round(main.temp)}°C / ${toF(main.temp)}°F • ${w.description || '—'}`;
  if (els.compactMeta) els.compactMeta.textContent = `Feels like ${Math.round(main.feels_like)}°C • Humidity ${main.humidity}% • Wind ${kmh(wind.speed)} km/h`;
  if (els.feels) els.feels.textContent = `${Math.round(main.feels_like)}°C`;
  if (els.humidity) els.humidity.textContent = `${main.humidity}%`;
  if (els.wind) els.wind.textContent = `${kmh(wind.speed)} km/h`;
  if (els.pressure) els.pressure.textContent = `${main.pressure} hPa`;
  setIcon(w.icon, w.description);

  
  const isDay = !!(w.icon && w.icon.includes('d'));
  setWeatherBackground(w.id, isDay);

  
  if (coord && (coord.lat !== undefined) && (coord.lon !== undefined)) updateMap(coord.lat, coord.lon, name);
}

function renderHourly(list, tz) {
  if (!els.hourRow) return;
  els.hourRow.innerHTML = "";
  const next = list.filter(x => x.dt * 1000 > Date.now()).slice(0, 6);
  next.forEach(it => {
    const time = new Date((it.dt + tz) * 1000).toLocaleTimeString([], {hour:'2-digit', minute: '2-digit'});
    const html = `
      <div class="hour-card">
        <div class="time">${time}</div>
        <div>${iconHTML(it.weather[0].icon, it.weather[0].description)}</div>
        <div class="val">${Math.round(it.main.temp)}°C</div>
        <div class="wind">${kmh(it.wind.speed)} km/h</div>
      </div>`;
    els.hourRow.insertAdjacentHTML('beforeend', html);
  });
}

function renderDaily(list, tz) {
  if (!els.dailyRow) return;
  els.dailyRow.innerHTML = "";
  const byDay = {};
  list.forEach(it => {
    const key = new Date((it.dt + tz) * 1000).toISOString().slice(0,10);
    (byDay[key] ||= []).push(it);
  });
  Object.entries(byDay).slice(0,5).forEach(([date, arr]) => {
    const temps = arr.map(a => a.main.temp);
    const min = Math.round(Math.min(...temps)), max = Math.round(Math.max(...temps));
    const mid = arr[Math.floor(arr.length/2)];
    const dayLabel = new Date(date).toLocaleDateString([], { weekday: 'short' });
    const html = `<div class="day-card">
      <div class="d">${dayLabel}</div>
      <div>${iconHTML(mid.weather[0].icon, mid.weather[0].description)}</div>
      <div class="mm">${max}° / ${min}°</div>
    </div>`;
    els.dailyRow.insertAdjacentHTML('beforeend', html);
  });
}

function renderTempChart(list, tz) {
  if (!els.tempChartCanvas) return;
  const pts = list.slice(0, 8);
  const labels = pts.map(it => new Date((it.dt + tz) * 1000).toLocaleTimeString([], {hour:'2-digit'}));
  const temps = pts.map(it => Math.round(it.main.temp));
  if (tempChart) tempChart.destroy();
  tempChart = new Chart(els.tempChartCanvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Temp °C', data: temps, tension: .35, borderColor: '#8fd0ff', pointRadius: 2, fill: false }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.06)' } } } }
  });
}

function renderAQI(air) {
  if (!air || !air.list || !air.list[0]) {
    if (els.aqiBadge) els.aqiBadge.textContent = 'AQI —';
    if (els.aqiDetails) els.aqiDetails.textContent = '—';
    if (els.alertsBox) els.alertsBox.textContent = 'No active alerts.';
    return;
  }
  const a = air.list[0];
  const legend = ['Good','Fair','Moderate','Poor','Very Poor'];
  if (els.aqiBadge) els.aqiBadge.textContent = `AQI ${a.main.aqi}: ${legend[a.main.aqi - 1] || '-'}`;
  if (els.aqiDetails) {
    const c = a.components || {};
    els.aqiDetails.textContent = `PM2.5 ${c.pm2_5?.toFixed(2) || '-'} • PM10 ${c.pm10?.toFixed(2) || '-'} • NO₂ ${c.no2?.toFixed(2) || '-'}`;
  }
  if (els.alertsBox) els.alertsBox.textContent = 'No active alerts.';
}

async function loadByCity(city) {
  showSpinner('Fetching weather…');
  try {
    
    if (els.input) els.input.value = city;

    const cur = await getCurrent(city);
    const { lat, lon } = cur.coord || { lat: null, lon: null };
    const [forecast, air] = await Promise.all([ getForecast(lat, lon), getAir(lat, lon) ]);
    renderCurrent(cur);
    renderHourly(forecast.list, forecast.city.timezone);
    renderDaily(forecast.list, forecast.city.timezone);
    renderTempChart(forecast.list, forecast.city.timezone);
    renderAQI(air);
    if (els.result) els.result.classList.remove('hidden');
    showStatus('');
    
    localStorage.setItem('weather.lastCity', city);
  } catch (err) {
    console.error(err);
    showError('Could not fetch weather. Try another place.');
  }
}

async function loadByCoords(lat, lon) {
  showSpinner("Fetching weather…");
  try {
    
    let cityName = "Here";
    try {
      const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
      const geoData = await geoRes.json();
      cityName = geoData?.[0]?.name || cityName;
    } catch (e) {
      
    }

    const cur = await getCurrent({ lat, lon });
    const [f, air] = await Promise.all([ getForecast(lat, lon), getAir(lat, lon) ]);

    renderCurrent(cur);
    renderHourly(f.list, f.city.timezone);
    renderDaily(f.list, f.city.timezone);
    renderTempChart(f.list, f.city.timezone);
    renderAQI(air);
    updateMap(lat, lon, cityName);

    
    if (els.input) els.input.value = cityName;

    showStatus("");
    els.result.classList.remove("hidden");
    
    try { localStorage.setItem('weather.lastCity', cityName); } catch(e){}
  } catch (e) {
    console.error(e);
    showStatus("Couldn't fetch weather for this location.");
  }
}

els.form?.addEventListener('submit', e => {
  e.preventDefault();
  const q = (els.input?.value || '').trim();
  if (!q) return showError('Please enter a city.');
  loadByCity(q);
});
els.locButton?.addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported.');
  navigator.geolocation.getCurrentPosition(
    pos => loadByCoords(pos.coords.latitude, pos.coords.longitude),
    () => alert('Unable to get your location.')
  );
});

const THEME_KEY = 'weather.theme';
function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  if (els.themeIcon) els.themeIcon.textContent = mode === 'light' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, mode);
}
els.themeToggle?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(cur);
});
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
})();

function loadCurrentLocationOnStart() {
  
  if (!navigator.geolocation) {
    const last = localStorage.getItem('weather.lastCity');
    if (last) { if (els.input) els.input.value = last; loadByCity(last); }
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      loadByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    err => {
      
      const last = localStorage.getItem('weather.lastCity');
      if (last) {
        if (els.input) els.input.value = last;
        loadByCity(last);
      } else {
        
        showStatus("Allow location or search a city.");
      }
    },
    { timeout: 7000 }
  );
}

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  
  loadCurrentLocationOnStart();
 
});