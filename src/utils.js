// map weather codes to friendly text
export function weatherCodeToText(code) {
  const map = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Moderate showers',
    82: 'Violent showers',
    95: 'Thunderstorm',
    96: 'Thunder + slight hail',
    99: 'Thunder + heavy hail',
  };
  return map[code] || 'Unknown';
}

// map weather codes to emoji
export function weatherCodeToEmoji(code) {
  const map = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌦️',
    53: '🌦️',
    55: '🌧️',
    61: '🌧️',
    63: '🌧️',
    65: '🌧️',
    71: '❄️',
    73: '❄️',
    75: '❄️',
    80: '🌦️',
    81: '🌧️',
    82: '⛈️',
    95: '⛈️',
    96: '⛈️',
    99: '⛈️',
  };
  return map[code] || '🌈';
}

// convert Celsius -> Fahrenheit
export function cToF(c) {
  return (c * 9) / 5 + 32;
}

/**
 * themeFromWeatherCode (more aggressive):
 * - returns "dark" for codes that imply overcast, fog, drizzle, rain, thunder, and snow.
 * - treats partly cloudy (2) as light, but you can tweak this set if you'd like a more aggressive dark behavior.
 */
export function themeFromWeatherCode(code) {
  // codes we treat as definitely dark/gloomy
  const darkCodes = new Set([
    3, // overcast
    45,
    48, // fog
    51,
    53,
    55, // drizzle
    61,
    63,
    65,
    80,
    81,
    82, // rain/showers
    95,
    96,
    99, // thunder
    71,
    73,
    75, // snow
  ]);

  // codes we treat as definitely light/sunny
  const lightCodes = new Set([0, 1]);

  if (darkCodes.has(code)) return 'dark';
  if (lightCodes.has(code)) return 'light';

  // For ambiguous codes like 2 (partly cloudy) treat as "dark" if you want a more aggressive theme:
  // return "dark" for 2 to bias towards dark on partly-cloudy days:
  if (code === 2) return 'dark';

  // Fallback: default to light
  return 'light';
}

/**
 * backgroundFromWeatherCode:
 * returns one of:
 *  - 'sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'thunder', 'night'
 */
export function backgroundFromWeatherCode(code) {
  // thunder -> dramatic
  const thunderCodes = new Set([95, 96, 99]);

  // snow
  const snowCodes = new Set([71, 73, 75]);

  // rain/drizzle/shower
  const rainCodes = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82]);

  // fog
  const fogCodes = new Set([45, 48]);

  // overcast/mostly cloudy
  const cloudyCodes = new Set([2, 3]);

  if (thunderCodes.has(code)) return 'thunder';
  if (rainCodes.has(code)) return 'rainy';
  if (snowCodes.has(code)) return 'snowy';
  if (fogCodes.has(code)) return 'foggy';
  if (cloudyCodes.has(code)) return 'cloudy';

  // sunny / mainly clear
  if (code === 0 || code === 1) return 'sunny';

  // fallback
  return 'sunny';
}
