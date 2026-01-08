import { Footprint } from '../types';

export interface CategoryStats {
  name: string;
  value: number;
  color: string;
}

export interface CityStats {
  city: string;
  count: number;
}

export interface OverviewStats {
  totalFootprints: number;
  cityCount: number;
  earliestDate: string;
  latestDate: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  '探店': '#ef4444',
  '户外': '#10b981',
  '城市': '#3b82f6',
  '打卡': '#f59e0b',
};

const CITY_PATTERNS = [
  /([省市自治区])([^市县区]+?[市县区])/,
  /([^\s省]+?[省市])/,
];

export const extractCity = (location: string): string => {
  if (!location) return '未知';

  for (const pattern of CITY_PATTERNS) {
    const match = location.match(pattern);
    if (match && match[2]) {
      const city = match[2].replace(/[市县区]$/, '');
      if (city.length >= 2) return city;
    }
  }

  const parts = location.split(/[,\s]+/);
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part.length >= 2 && !part.includes('省') && !part.includes('市')) {
      if (/[区县]$/.test(part)) {
        return part.replace(/[区县]$/, '');
      }
    }
  }

  return location.split(',')[0] || '未知';
};

export const getCategoryStats = (footprints: Footprint[]): CategoryStats[] => {
  const categoryMap = new Map<string, number>();

  footprints.forEach(fp => {
    const count = categoryMap.get(fp.category) || 0;
    categoryMap.set(fp.category, count + 1);
  });

  return Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || '#6b7280',
  }));
};

export const getCityStats = (footprints: Footprint[]): CityStats[] => {
  const cityMap = new Map<string, number>();

  footprints.forEach(fp => {
    const city = extractCity(fp.location);
    const count = cityMap.get(city) || 0;
    cityMap.set(city, count + 1);
  });

  return Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

export const getOverviewStats = (footprints: Footprint[]): OverviewStats => {
  if (footprints.length === 0) {
    return {
      totalFootprints: 0,
      cityCount: 0,
      earliestDate: '-',
      latestDate: '-',
    };
  }

  const dates = footprints.map(fp => new Date(fp.date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const citySet = new Set(footprints.map(fp => extractCity(fp.location)));

  return {
    totalFootprints: footprints.length,
    cityCount: citySet.size,
    earliestDate: `${minDate.getFullYear()}.${minDate.getMonth() + 1}`,
    latestDate: `${maxDate.getFullYear()}.${maxDate.getMonth() + 1}`,
  };
};
