import { useCallback, useEffect, useState } from 'react';
import { WeatherResponse, ForecastItem, OpenWeatherListItem } from '../types/weather';
import { loadWeather, getWeatherUrl, getForecastUrl, getWeatherByCoordsUrl, getForecastByCoordsUrl } from '../services/weatherService';

export const useWeather = () => {
  const [query, setQuery] = useState<string>('Istanbul');
  const [current, setCurrent] = useState<WeatherResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const extractDailyForecast = (list: OpenWeatherListItem[]): ForecastItem[] => {
    const days: Record<string, OpenWeatherListItem[]> = {};

    list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().split('T')[0];
      if (!days[dayKey]) {
        days[dayKey] = [];
      }
      days[dayKey].push(item);
    });

    const todayKey = new Date().toISOString().split('T')[0];

    return Object.keys(days)
      .sort()
      .filter((key) => key !== todayKey)
      .slice(0, 5)
      .map((key) => {
        const items = days[key];
        const midDay =
          items.find((item) => new Date(item.dt * 1000).getHours() === 12) || items[0];
        const temps = items.map((item) => item.main.temp);

        return {
          date: key,
          icon: midDay.weather[0].icon,
          description: midDay.weather[0].description,
          temp: Math.round(midDay.main.temp),
          min: Math.round(Math.min(...temps)),
          max: Math.round(Math.max(...temps)),
        };
      });
  };

  const fetchWeatherData = useCallback(
    async (
      weatherUrl: string,
      forecastUrl: string,
      updateQuery = false
    ): Promise<WeatherResponse | undefined> => {
      setLoading(true);
      setError('');

      try {
        const { weatherData, forecastData } = await loadWeather(weatherUrl, forecastUrl);

        setCurrent(weatherData);
        setForecast(extractDailyForecast(forecastData.list));

        if (updateQuery) {
          setQuery(weatherData.name);
        }

        return weatherData;
      } catch (err) {
        setCurrent(null);
        setForecast([]);
        setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchWeather = useCallback(async (city: string) => {
    const weatherUrl = getWeatherUrl(city);
    const forecastUrl = getForecastUrl(city);

    return fetchWeatherData(weatherUrl, forecastUrl);
  }, [fetchWeatherData]);

  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number) => {
    const weatherUrl = getWeatherByCoordsUrl(lat, lon);
    const forecastUrl = getForecastByCoordsUrl(lat, lon);

    return fetchWeatherData(weatherUrl, forecastUrl, true);
  }, [fetchWeatherData]);

  useEffect(() => {
    const initialCity = 'Istanbul';

    const loadInitialWeather = async () => {
      if (!navigator.geolocation) {
        await fetchWeather(initialCity);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await fetchWeatherByCoords(latitude, longitude);
        },
        async () => {
          setError('Konum izni verilmedi. Şehir aratarak devam edebilirsin.');
          await fetchWeather(initialCity);
        }
      );
    };

    loadInitialWeather();
  }, [fetchWeather, fetchWeatherByCoords]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Tarayıcın konum özelliğini desteklemiyor.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      () => {
        setError('Konum alınamadı.');
      }
    );
  };

  return {
    query,
    setQuery,
    current,
    forecast,
    loading,
    error,
    fetchWeather,
    handleUseMyLocation,
  };
};