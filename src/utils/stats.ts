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

export interface AISummary {
  title: string;
  content: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  '探店': '#ef4444',
  '户外': '#10b981',
  '城市': '#3b82f6',
  '打卡': '#f59e0b',
};

// 更健壮的城市识别正则表达式
const CITY_PATTERNS = [
  // 匹配直辖市/特别行政区（如：北京市、上海市、香港特别行政区）
  /^(北京|上海|天津|重庆|香港|澳门)(?:市|特别行政区)?/,
  // 匹配省份+城市（如：广东省广州市、江苏省苏州市）
  /(?:(?:[\u4e00-\u9fa5]+?(?:省|自治区|自治州))\s*)([\u4e00-\u9fa5]+?[市州盟])/,
  // 匹配直接带市的城市名称（如：深圳市、杭州市）
  /([\u4e00-\u9fa5]{2,}(?:市|州|盟))/,
  // 匹配县级市（如：昆山市、义乌市）
  /([\u4e00-\u9fa5]{2,}市)/,
  // 匹配地区名称（如：三亚市、桂林市）
  /([\u4e00-\u9fa5]{2,}(?:市|地区|自治州))/,
];

export const extractCity = (location: string): string => {
  if (!location || location.trim() === '') return '未知区域';
  
  const trimmedLocation = location.trim();

  // 遍历所有正则模式
  for (const pattern of CITY_PATTERNS) {
    const match = trimmedLocation.match(pattern);
    if (match) {
      // 提取匹配到的城市名称
      let city = match[1];
      // 移除可能的后缀
      city = city.replace(/(市|州|盟|地区)$/, '');
      if (city.length >= 2) return city;
    }
  }

  // 处理特殊情况：直接包含省名但没有明确城市的情况
  const provincePattern = /^([\u4e00-\u9fa5]+?(省|自治区|直辖市))/;
  const provinceMatch = trimmedLocation.match(provincePattern);
  if (provinceMatch) {
    // 如果只有省份，返回省份名
    return provinceMatch[1].replace(/(省|自治区|直辖市)$/, '');
  }

  // 无法提取城市时，返回未知区域
  return '未知区域';
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

export const generateAISummary = (footprints: Footprint[]): AISummary => {
  if (footprints.length === 0) {
    return {
      title: '等待你的足迹',
      content: '开始你的旅行，记录你的足迹，让我们为你生成专属的旅行故事。'
    };
  }

  const categoryStats = getCategoryStats(footprints);
  const cityStats = getCityStats(footprints);
  const overviewStats = getOverviewStats(footprints);
  
  // 找到最常去的分类
  const topCategory = categoryStats.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current
  );
  
  // 找到最常去的城市
  const topCity = cityStats.length > 0 ? cityStats[0].city : '未知区域';
  
  // 生成总结
  let summary = '';
  
  if (topCategory.name === '探店') {
    summary = `你是一个热爱美食的探索家，在${overviewStats.cityCount}个城市留下了${overviewStats.totalFootprints}个美食足迹。`;
    if (cityStats.length > 0) {
      summary += ` 你在${topCity}探索的美食最多，那里一定有让你难以忘怀的味道。`;
    }
  } else if (topCategory.name === '户外') {
    summary = `你是一个热爱大自然的冒险家，在${overviewStats.cityCount}个城市留下了${overviewStats.totalFootprints}个户外足迹。`;
    if (cityStats.length > 0) {
      summary += ` ${topCity}是你最常去探索自然的地方，那里的山山水水一定给你留下了深刻的印象。`;
    }
  } else if (topCategory.name === '城市') {
    summary = `你是一个城市探索者，在${overviewStats.cityCount}个城市留下了${overviewStats.totalFootprints}个城市足迹。`;
    if (cityStats.length > 0) {
      summary += ` ${topCity}是你最钟爱的城市，那里的每一个角落都有你的故事。`;
    }
  } else if (topCategory.name === '打卡') {
    summary = `你是一个热衷于打卡的旅行者，在${overviewStats.cityCount}个城市留下了${overviewStats.totalFootprints}个打卡足迹。`;
    if (cityStats.length > 0) {
      summary += ` ${topCity}是你打卡最多的地方，那里一定有很多值得分享的精彩瞬间。`;
    }
  } else {
    summary = `你在${overviewStats.cityCount}个城市留下了${overviewStats.totalFootprints}个足迹，每一个足迹都是你旅行的见证。`;
    if (cityStats.length > 0) {
      summary += ` ${topCity}是你最常去的地方，那里充满了你的回忆。`;
    }
  }
  
  summary += ` 从${overviewStats.earliestDate}到${overviewStats.latestDate}，你的旅行故事还在继续...`;
  
  return {
    title: '你的旅行故事',
    content: summary
  };
};
