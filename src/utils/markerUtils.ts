// Marker 工具函数 - 自定义 Leaflet DivIcon

import { FootprintCategory } from '../types';

// 分类颜色映射
const categoryColors: Record<FootprintCategory, string> = {
  '探店': '#ef4444', // 红色
  '户外': '#10b981', // 绿色
  '城市': '#3b82f6', // 蓝色
  '打卡': '#f59e0b', // 橙色
};

// 临时 Marker 颜色
const temporaryMarkerColor = '#ec4899'; // 粉色

/**
 * 创建自定义的 Leaflet DivIcon
 * @param category 足迹分类
 * @returns Leaflet DivIcon 对象
 */
export const createCustomMarkerIcon = (category: FootprintCategory): any => {
  // 只在客户端执行，避免 SSR 错误
  if (typeof window === 'undefined') {
    return null;
  }
  
  // 动态导入 Leaflet
  const L = require('leaflet');
  
  const color = categoryColors[category];
  
  // 使用内联 SVG 作为 Marker 图标，基于 Lucide-React 的 MapPin 图标
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="marker-container">
        ${svgIcon}
      </div>
    `,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
};

/**
 * 创建临时 Marker 图标
 * @returns Leaflet DivIcon 对象
 */
export const createTemporaryMarkerIcon = (): any => {
  // 只在客户端执行，避免 SSR 错误
  if (typeof window === 'undefined') {
    return null;
  }
  
  // 动态导入 Leaflet
  const L = require('leaflet');
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="marker-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${temporaryMarkerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3" fill="${temporaryMarkerColor}" stroke="white" stroke-width="2"/>
        </svg>
      </div>
    `,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
};

/**
 * 格式化日期为更易读的形式
 * @param dateString 日期字符串，格式：YYYY-MM-DD
 * @returns 格式化后的日期字符串，格式：YYYY年MM月DD日
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};
