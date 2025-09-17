export async function geocodeCity(city) {
  if (!city) throw new Error('No city provided');
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  const { latitude, longitude, name, country, admin1 } = data.results[0];
  return { latitude, longitude, name, country, admin1 };
}

export async function getWeather(lat, lon, options = { windspeedUnit: 'm/s' }) {
  if (lat == null || lon == null) throw new Error('Missing lat/lon');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();

  const current = data.current_weather;
  if (!current) throw new Error('No current weather available from API');

  // Robust humidity lookup
  let humidity = null;
  if (
    data.hourly &&
    Array.isArray(data.hourly.time) &&
    Array.isArray(data.hourly.relativehumidity_2m)
  ) {
    let idx = data.hourly.time.indexOf(current.time);
    if (idx === -1) {
      // fallback: try to match by date/time prefix (be a bit forgiving)
      idx = data.hourly.time.findIndex((t) =>
        t.startsWith(current.time.split(':')[0])
      );
    }
    if (idx !== -1) humidity = data.hourly.relativehumidity_2m[idx];
  }

  let windspeed = Number(current.windspeed);
  // Convert km/h -> m/s when requested (Open-Meteo default is km/h)
  if (options.windspeedUnit === 'm/s') {
    windspeed = Number((windspeed / 3.6).toFixed(1));
  } else {
    windspeed = Number(windspeed.toFixed(1));
  }

  return {
    temperature: Number(current.temperature),
    windspeed,
    weathercode: current.weathercode,
    time: current.time,
    humidity,
  };
}
