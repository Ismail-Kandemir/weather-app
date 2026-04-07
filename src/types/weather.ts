export type WeatherResponse = {
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

export type ForecastItem = {
  date: string;
  icon: string;
  description: string;
  temp: number;
  min: number;
  max: number;
};

export type OpenWeatherListItem = {
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