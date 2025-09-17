// src/App.jsx (with injected background CSS for weather states)
import React, { useState, useEffect } from 'react';
import { geocodeCity, getWeather } from './api';
import {
  weatherCodeToText,
  weatherCodeToEmoji,
  cToF,
  themeFromWeatherCode,
  backgroundFromWeatherCode,
} from './utils';

// NOTE: this file injects a small CSS block into document.head so you don't
// need to touch your tailwind setup. If you prefer to put these styles into
// src/index.css or Tailwind config, copy the styles from the `injectedCss`
// variable below.

const injectedCss = `
/* Weather background and animation styles (injected) */
.weather-bg { transition: background 0.6s ease, color 0.3s ease; }

/* SUNNY */
.weather-bg.sunny {
  background: linear-gradient(180deg,#fff7e6 0%, #ffe9b3 40%, #ffd166 100%);
  background-attachment: fixed;
}
.weather-bg.sunny::after {
  content: "";
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image: radial-gradient(ellipse at 10% 10%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 40%), radial-gradient(ellipse at 85% 25%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 35%);
  mix-blend-mode: overlay;
}

/* CLOUDY */
.weather-bg.cloudy {
  background: linear-gradient(180deg,#f2f4f8 0%, #d9e0ea 60%, #bfcadb 100%);
}
.weather-bg.cloudy .clouds {
  position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: 0.9;
  background-image: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9) 0 10%, rgba(255,255,255,0) 30%), radial-gradient(circle at 50% 30%, rgba(255,255,255,0.95) 0 12%, rgba(255,255,255,0) 32%), radial-gradient(circle at 80% 25%, rgba(255,255,255,0.9) 0 10%, rgba(255,255,255,0) 30%);
  background-size: 80% 40%;
  background-repeat: no-repeat;
  transform: translateY(-6%);
}

/* RAINY */
.weather-bg.rainy {
  background: linear-gradient(180deg,#e6f0fb 0%, #cfe6ff 40%, #b6d8ff 100%);
}
.rain-layer {
  z-index: 0;
}
.rain-layer::before {
  content: "";
  position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(transparent 60%, rgba(255,255,255,0.02) 60%),
                    repeating-linear-gradient(120deg, rgba(255,255,255,0.02) 0 2px, rgba(255,255,255,0) 2px 6px),
                    linear-gradient(transparent, rgba(0,0,0,0.03));
  background-size: 100% 100%, 6px 60px, 100% 100%;
  animation: rain-fall 0.8s linear infinite;
  opacity: 0.85;
}
@keyframes rain-fall { from { background-position: 0 0, 0 0, 0 0; } to { background-position: 0 60px, 0 120px, 0 0; } }

/* SNOW */
.weather-bg.snowy {
  background: linear-gradient(180deg,#f8fbff 0%, #e9f3ff 60%, #dcebf9 100%);
}
.snow-layer {
  position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
}
.snow-layer::before {
  content: "";
  position: absolute; inset: -20% -10% -20% -10%;
  background-image: radial-gradient(circle, rgba(255,255,255,0.9) 0 2px, rgba(255,255,255,0) 4px);
  background-size: 8px 8px;
  animation: snow-fall 12s linear infinite;
  opacity: 0.9;
}
@keyframes snow-fall { from { transform: translateY(-10%); } to { transform: translateY(110%); } }

/* FOG */
.weather-bg.foggy {
  background: linear-gradient(180deg,#eef1f4 0%, #e0e6ea 70%);
}
.weather-bg.foggy::before {
  content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: linear-gradient(transparent, rgba(255,255,255,0.6));
}

/* NIGHT */
.weather-bg.night {
  background: radial-gradient(circle at 10% 10%, #0b1020 0%, #071027 30%, #071027 100%);
}
.weather-bg.night::after {
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image: radial-gradient(circle at 85% 20%, rgba(255,255,255,0.08) 0 2px, rgba(255,255,255,0) 6px);
}

/* small safety: ensure container positioning for injected pseudo elements */
.weather-bg { position: relative; overflow: hidden; }

`;

function injectCssOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('weather-bg-injected-css')) return;
  const style = document.createElement('style');
  style.id = 'weather-bg-injected-css';
  style.innerHTML = injectedCss;
  document.head.appendChild(style);
}

function WeatherCard({ cityInfo, weather, unit, onToggleUnit }) {
  if (!cityInfo || !weather) return null;

  const tempDisplay =
    unit === 'C'
      ? `${Math.round(weather.temperature)}°C`
      : `${Math.round(cToF(weather.temperature))}°F`;

  const humidity = weather.humidity !== null ? `${weather.humidity}%` : '—';
  const conditionText = weatherCodeToText(weather.weathercode);
  const emoji = weatherCodeToEmoji(weather.weathercode);

  const rainCodes = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]);
  const showRain = rainCodes.has(weather.weathercode);

  const snowCodes = new Set([71, 73, 75, 77, 85, 86]);
  const showSnow = snowCodes.has(weather.weathercode);

  return (
    <div
      className={`relative max-w-md mx-auto mt-6 p-6 rounded-3xl shadow-md transition-all duration-300
        bg-white/80 text-gray-900 dark:bg-slate-800/60 dark:text-white
        ${showRain ? 'overflow-hidden' : ''}`}
      data-testid="weather-card"
    >
      {/* background layers (rain/snow) */}
      {showRain && (
        <div className="absolute inset-0 pointer-events-none rain-layer"></div>
      )}
      {showSnow && (
        <div className="absolute inset-0 pointer-events-none snow-layer"></div>
      )}

      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {cityInfo.name}
            {cityInfo.admin1 ? `, ${cityInfo.admin1}` : ''}{' '}
            <span className="text-sm font-normal">— {cityInfo.country}</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-300 mt-1">
            {new Date(weather.time).toLocaleString()}
          </p>
        </div>
        <div className="text-6xl leading-none">{emoji}</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 relative z-10">
        <div className="rounded-lg p-3 bg-white/60 dark:bg-slate-700/50">
          <p className="text-xs text-gray-500 dark:text-slate-300">
            Temperature
          </p>
          <p className="text-2xl font-bold">{tempDisplay}</p>
        </div>

        <div className="rounded-lg p-3 bg-white/60 dark:bg-slate-700/50">
          <p className="text-xs text-gray-500 dark:text-slate-300">Condition</p>
          <p className="text-lg">{conditionText}</p>
        </div>

        <div className="rounded-lg p-3 bg-white/60 dark:bg-slate-700/50">
          <p className="text-xs text-gray-500 dark:text-slate-300">Humidity</p>
          <p className="text-lg">{humidity}</p>
        </div>

        <div className="rounded-lg p-3 bg-white/60 dark:bg-slate-700/50">
          <p className="text-xs text-gray-500 dark:text-slate-300">Wind</p>
          <p className="text-lg">{weather.windspeed} m/s</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between relative z-10">
        <div className="text-sm text-gray-600 dark:text-slate-300">Units</div>
        <div className="flex gap-2">
          <button
            onClick={() => onToggleUnit('C')}
            className={`px-3 py-1 rounded-lg transition ${
              unit === 'C'
                ? 'bg-indigo-600 text-white'
                : 'bg-white/90 dark:bg-slate-700/60 text-gray-800 dark:text-white'
            }`}
          >
            °C
          </button>
          <button
            onClick={() => onToggleUnit('F')}
            className={`px-3 py-1 rounded-lg transition ${
              unit === 'F'
                ? 'bg-indigo-600 text-white'
                : 'bg-white/90 dark:bg-slate-700/60 text-gray-800 dark:text-white'
            }`}
          >
            °F
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [city, setCity] = useState('');
  const [cityInfo, setCityInfo] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('C'); // 'C' or 'F'
  const [theme, setTheme] = useState('light'); // 'light' or 'dark' (kept for automatic switching)
  const [background, setBackground] = useState(
    theme === 'dark' ? 'night' : 'sunny'
  );

  useEffect(() => {
    injectCssOnce();
  }, []);

  useEffect(() => {
    // toggle Tailwind dark class automatically based on computed theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // when theme is manually changed and no weather is present, pick a reasonable background
    if (!weather) {
      setBackground(theme === 'dark' ? 'night' : 'sunny');
    }
  }, [theme, weather]);

  function handleToggleUnit(u) {
    setUnit(u);
  }

  async function handleSearch(e) {
    e?.preventDefault();
    setError('');
    setWeather(null);
    setCityInfo(null);

    const trimmed = city.trim();
    if (!trimmed) {
      setError('Please enter a city name.');
      return;
    }

    setLoading(true);
    try {
      const geo = await geocodeCity(trimmed);
      if (!geo) {
        setError('City not found. Try a different name.');
        setLoading(false);
        return;
      }
      setCityInfo(geo);
      const w = await getWeather(geo.latitude, geo.longitude);
      setWeather(w);

      const newTheme = themeFromWeatherCode(w.weathercode);
      setTheme(newTheme);

      const bg = backgroundFromWeatherCode(w.weathercode);
      // backgroundFromWeatherCode should return one of: 'sunny','cloudy','rainy','snowy','foggy','night'
      setBackground(bg);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    setError('');
    setLoading(true);
    setWeather(null);
    setCityInfo(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const w = await getWeather(lat, lon);
          setWeather(w);
          setCityInfo({ name: 'Your location', country: '', admin1: '' });

          const newTheme = themeFromWeatherCode(w.weathercode);
          setTheme(newTheme);

          const bg = backgroundFromWeatherCode(w.weathercode);
          setBackground(bg);
        } catch (err) {
          console.error(err);
          setError('Could not fetch weather for your location.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError('Permission denied or location unavailable.');
        setLoading(false);
      }
    );
  }

  // header control bg uses dark: classes so we don't need theme string for styling
  const headerControlClasses =
    'px-3 py-2 rounded-lg shadow-sm bg-white/90 text-gray-900 dark:bg-slate-800/60 dark:text-white';

  return (
    <div
      className={`weather-bg ${background} min-h-screen flex flex-col items-center p-6 transition-colors duration-500 text-gray-900 dark:text-white`}
    >
      <header className="w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Weather Now</h1>
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
              Quick current weather for any city (Open-Meteo)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={useMyLocation}
              className={`${headerControlClasses} flex items-center gap-2`}
            >
              <span className="text-lg">📍</span>
              <span className="text-sm">Use my location</span>
            </button>

            {/* THEME SELECT REMOVED */}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mt-4">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city, e.g. Mumbai"
            className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </header>

      <main className="w-full max-w-3xl mt-6">
        {/* optional clouds overlay for cloudy background */}
        {background === 'cloudy' && <div className="clouds" aria-hidden />}
        <WeatherCard
          cityInfo={cityInfo}
          weather={weather}
          unit={unit}
          onToggleUnit={handleToggleUnit}
        />
      </main>

      <footer className="mt-10 text-sm text-gray-600 dark:text-slate-300">
        Data from Open-Meteo • No API key required
      </footer>
    </div>
  );
}
