// 天气API调用工具函数，用于获取实时天气数据

// OpenWeatherMap API Key（从环境变量获取或使用默认值）
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo_key'; // 使用环境变量或演示密钥

/**
 * 天气数据接口
 */
export interface WeatherData {
  temperature: number;
  weather: string;
  icon: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

/**
 * 调用OpenWeatherMap API获取实时天气数据
 * @param coordinates 坐标 [纬度, 经度]
 * @returns 天气数据，失败时返回null
 */
export const getWeatherData = async (coordinates: [number, number]): Promise<WeatherData | null> => {
  try {
    const [lat, lon] = coordinates;
    
    // 使用OpenWeatherMap API获取天气数据
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 转换天气数据格式
    return {
      temperature: Math.round(data.main.temp),
      weather: data.weather[0].main,
      icon: data.weather[0].icon,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

/**
 * 获取天气对应的图标
 * @param weather 天气类型
 * @returns 天气图标
 */
export const getWeatherIcon = (weather: string): string => {
  const weatherIcons: Record<string, string> = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Smoke: '🌫️',
    Haze: '🌫️',
    Dust: '🌫️',
    Fog: '🌫️',
    Sand: '🌫️',
    Ash: '🌫️',
    Squall: '💨',
    Tornado: '🌪️'
  };
  
  return weatherIcons[weather] || '❓';
};

/**
 * 从路径中提取关键坐标点（起点、中点、终点）
 * @param path 路径坐标数组
 * @returns 关键坐标点数组
 */
export const extractKeyPoints = (path: [number, number][]): [number, number][] => {
  if (path.length < 2) {
    return path;
  }
  
  // 起点
  const start = path[0];
  
  // 终点
  const end = path[path.length - 1];
  
  // 中点
  const midIndex = Math.floor(path.length / 2);
  const mid = path[midIndex];
  
  return [start, mid, end];
};
