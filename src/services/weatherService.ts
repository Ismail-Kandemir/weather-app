import { WeatherResponse, OpenWeatherListItem } from '../types/weather';

const API_KEY = '4eaef920768bbb0cf2e3ecd9fcc7b7b9';
const API_ROOT = 'https://api.openweathermap.org/data/2.5';

export const fetchJson = async <T,>(url: string, errorMessage: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(errorMessage);
  }
  return response.json();
};

export const loadWeather = async (
  weatherUrl: string,
  forecastUrl: string
): Promise<{ weatherData: WeatherResponse; forecastData: { list: OpenWeatherListItem[] } }> => {
  const weatherData = await fetchJson<WeatherResponse>(
    weatherUrl,
    'Hava durumu bilgisi alınamadı.'
  );
  const forecastData = await fetchJson<{ list: OpenWeatherListItem[] }>(
    forecastUrl,
    'Tahmin verisi alınamadı.'
  );

  return { weatherData, forecastData };
};

export const getWeatherUrl = (city: string): string =>
  `${API_ROOT}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=tr`;

export const getForecastUrl = (city: string): string =>
  `${API_ROOT}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=tr`;

export const getWeatherByCoordsUrl = (lat: number, lon: number): string =>
  `${API_ROOT}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=tr`;

export const getForecastByCoordsUrl = (lat: number, lon: number): string =>
  `${API_ROOT}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=tr`;