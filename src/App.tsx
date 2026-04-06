import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const API_KEY = '4eaef920768bbb0cf2e3ecd9fcc7b7b9';
const API_ROOT = 'https://api.openweathermap.org/data/2.5';

const weatherStyles: Record<string, string> = {
  Clear: 'clear',
  Clouds: 'clouds',
  Rain: 'rain',
  Drizzle: 'rain',
  Thunderstorm: 'storm',
  Snow: 'snow',
  Mist: 'mist',
  Smoke: 'mist',
  Haze: 'mist',
  Dust: 'mist',
  Fog: 'mist',
  Sand: 'mist',
  Ash: 'mist',
  Squall: 'storm',
  Tornado: 'storm',
};

type WeatherResponse = {
  name: string;
  sys: {
    country: string;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
};

type ForecastItem = {
  date: string;
  icon: string;
  description: string;
  temp: number;
  min: number;
  max: number;
};

type OpenWeatherListItem = {
  dt: number;
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    icon: string;
    description: string;
    main: string;
  }>;
};

function App() {
  const [query, setQuery] = useState<string>('Istanbul');
  const [current, setCurrent] = useState<WeatherResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const fetchJson = async <T,>(url: string, errorMessage: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(errorMessage);
    }
    return response.json();
  };

  const loadWeather = useCallback(
    async (
      weatherUrl: string,
      forecastUrl: string,
      updateQuery = false
    ): Promise<WeatherResponse | undefined> => {
      setLoading(true);
      setError('');

    try {
      const weatherData = await fetchJson<WeatherResponse>(
        weatherUrl,
        'Hava durumu bilgisi alınamadı.'
      );
      const forecastData = await fetchJson<{ list: OpenWeatherListItem[] }>(
        forecastUrl,
        'Tahmin verisi alınamadı.'
      );

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
  }, []);

  const fetchWeather = useCallback(async (city: string) => {
    const weatherUrl = `${API_ROOT}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=tr`;
    const forecastUrl = `${API_ROOT}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=tr`;

    return loadWeather(weatherUrl, forecastUrl);
  }, [loadWeather]);

  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number) => {
    const weatherUrl = `${API_ROOT}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=tr`;
    const forecastUrl = `${API_ROOT}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=tr`;

    return loadWeather(weatherUrl, forecastUrl, true);
  }, [loadWeather]);

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

  const themeClass = current
    ? weatherStyles[current.weather[0].main] ?? 'clear'
    : 'clear';

  const formattedDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    fetchWeather(trimmed);
  };

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

  const appClassName = `app ${darkMode ? 'dark-mode' : 'light-mode'} ${themeClass}`;

  return (
    <div className={appClassName}>
      <div className="weather-shell">
        <header className="top-panel">
          <div>
            <p className="small-label">Güncel</p>
            <h1>Hava Durumu</h1>
            <p className="date-label">{formattedDate}</p>
          </div>
          <button
            className="mode-toggle"
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? 'Açık Mod' : 'Koyu Mod'}
          </button>
        </header>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Şehir arayın, örn. Istanbul"
            aria-label="Şehir arama"
          />
          <button type="submit">Ara</button>
          <button type="button" onClick={handleUseMyLocation}>
            Konumum
          </button>
        </form>

        {error && <div className="message error">{error}</div>}
        {loading && <div className="message">Yükleniyor...</div>}

        {current && (
          <section className="current-weather">
            <div className="current-top">
              <div>
                <h2>
                  {current.name}, {current.sys.country}
                </h2>
                <p className="weather-text">{current.weather[0].description}</p>
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`}
                alt={current.weather[0].description}
                className="current-icon"
              />
            </div>

            <div className="current-details">
              <div className="temp-card">
                <span className="temp-value">{Math.round(current.main.temp)}°C</span>
                <p>Hissedilen {Math.round(current.main.feels_like)}°C</p>
              </div>
              <div className="stats-grid">
                <div>
                  <span>Rüzgar</span>
                  <strong>{Math.round(current.wind.speed)} m/s</strong>
                </div>
                <div>
                  <span>Nem</span>
                  <strong>{current.main.humidity}%</strong>
                </div>
                <div>
                  <span>Basınç</span>
                  <strong>{current.main.pressure} hPa</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {forecast.length > 0 && (
          <section className="forecast">
            <h3>5 Günlük Tahmin</h3>
            <div className="forecast-grid">
              {forecast.map((day) => (
                <article key={day.date} className="forecast-card">
                  <p className="forecast-date">
                    {new Date(day.date).toLocaleDateString('tr-TR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'numeric',
                    })}
                  </p>
                  <img
                    src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                    alt={day.description}
                  />
                  <p className="forecast-desc">{day.description}</p>
                  <p className="forecast-temp">
                    {day.max}° / {day.min}°
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="footer-note">Veri kaynağı: OpenWeatherMap</footer>
      </div>
    </div>
  );
}

export default App;
