import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useWeather } from '../hooks/useWeather';
import './App.css';

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

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const { query, setQuery, current, forecast, loading, error, fetchWeather, handleUseMyLocation } = useWeather();

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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    fetchWeather(trimmed);
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