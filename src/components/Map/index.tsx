'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, LayersControl, Polyline } from 'react-leaflet';
import { Footprint } from '../../types';
import { checkBrowserSupport, isMobile, showError } from '../../utils/compatibility';
import { getOSRMWalkingRoute, formatOSRMDistance, formatTime } from '../../utils/osrm';
import { getWeatherData, extractKeyPoints, WeatherData } from '../../utils/weather';
import { MapPin } from 'lucide-react';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  footprints: Footprint[];
  onMapClick: (latlng: [number, number]) => void;
  selectedFootprintId?: string;
  selectedFootprints?: Footprint[];
  onRoutePlanChange?: (footprints: Footprint[]) => void;
  onWalkingRouteChange?: (route: {
    path: [number, number][];
    distance: number;
    duration: number;
  } | null) => void;
  isRoutePlanning?: boolean;
  isDetailMode?: boolean; // 新增详情模式属性
  onWeatherDataChange?: (weatherData: {
    start?: WeatherData | null;
    mid?: WeatherData | null;
    end?: WeatherData | null;
  }) => void;
}

interface MapViewProps {
  center: [number, number];
  zoom: number;
}

interface MapEventsProps {
  onMapClick: (latlng: [number, number]) => void;
  tempMarker: [number, number] | null;
  setTempMarker: (marker: [number, number] | null) => void;
}

const MapView: React.FC<MapViewProps> = ({ center, zoom }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (map) {
      try {
        map.flyTo(center, zoom, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      } catch (error) {
        console.error('Failed to fly to location:', error);
      }
    }
  }, [center, zoom, map]);

  return null;
};

const MapEvents: React.FC<MapEventsProps> = ({ onMapClick, tempMarker, setTempMarker }) => {
  // 长按逻辑：只有长按1秒才触发标记地点
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressLatLngRef = useRef<[number, number] | null>(null);

  useMapEvents({
    // 鼠标按下，启动长按计时器
    mousedown: (e) => {
      longPressLatLngRef.current = [e.latlng.lat, e.latlng.lng];
      longPressTimerRef.current = setTimeout(() => {
        // 长按1秒后触发标记地点
        if (longPressLatLngRef.current) {
          setTempMarker(longPressLatLngRef.current);
          onMapClick(longPressLatLngRef.current);
          
          setTimeout(() => {
            setTempMarker(null);
          }, 3000);
        }
      }, 1000);
    },
    
    // 鼠标右键点击，弹出添加足迹菜单
    contextmenu: (e) => {
      e.originalEvent.preventDefault(); // 阻止默认右键菜单
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      
      // 创建自定义右键菜单
      const menu = document.createElement('div');
      menu.className = 'custom-context-menu';
      menu.style.cssText = `
        position: absolute;
        top: ${e.containerPoint.y}px;
        left: ${e.containerPoint.x}px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        cursor: pointer;
      `;
      
      // 添加菜单项
      const menuItem = document.createElement('div');
      menuItem.textContent = '在此处添加足迹';
      menuItem.style.cssText = `
        padding: 8px 16px;
        font-size: 14px;
        color: #333;
      `;
      menuItem.addEventListener('click', () => {
        onMapClick(latlng);
        document.body.removeChild(menu);
      });
      menu.appendChild(menuItem);
      
      // 添加到文档
      document.body.appendChild(menu);
      
      // 点击其他地方关闭菜单
      const closeMenu = () => {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      };
      document.addEventListener('click', closeMenu);
    },
    
    // 鼠标松开，清除计时器
    mouseup: () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      longPressLatLngRef.current = null;
    },
    
    // 鼠标离开地图，清除计时器
    mouseout: () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      longPressLatLngRef.current = null;
    },
  });

  return null;
};

// 创建自定义图标，使用 lucide-react 的 MapPin 图标，并添加动画效果和天气图标
const createCustomIcon = (L: any, category: string, footprintId?: string, weatherIcon?: string) => {
  const colors: Record<string, string> = {
    '探店': '#ef4444',
    '户外': '#10b981',
    '城市': '#3b82f6',
    '打卡': '#f59e0b',
  };
  
  const color = colors[category] || '#3b82f6';
  
  // 使用 MapPin 图标的 SVG 结构
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3" fill="${color}" stroke="white" stroke-width="2"/>
  </svg>`;
  
  // 添加footprintId到HTML元素上
  const footprintIdAttr = footprintId ? `data-footprint-id="${footprintId}"` : '';
  
  // 天气图标HTML
  const weatherIconHtml = weatherIcon ? `<div class="weather-icon">${weatherIcon}</div>` : '';
  
  return L.divIcon({
    // 添加动画类名
    className: 'custom-leaflet-marker marker-animate',
    html: `<div class="marker-container animate-pop" ${footprintIdAttr}>
            ${svgIcon}
            ${weatherIconHtml}
          </div>`,
    iconSize: [28, 50], // 增加高度以容纳天气图标
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
};

// 创建临时标记图标，使用相同的动画效果
const createTemporaryIcon = (L: any) => {
  const color = '#ec4899';
  
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3" fill="${color}" stroke="white" stroke-width="2"/>
  </svg>`;
  
  return L.divIcon({
    className: 'custom-leaflet-marker marker-animate',
    html: `<div class="marker-container animate-pop">${svgIcon}</div>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
};

const Map: React.FC<MapProps> = ({ 
  center = [39.9042, 116.4074], 
  zoom = 10, 
  footprints, 
  onMapClick,
  selectedFootprintId,
  selectedFootprints = [],
  onRoutePlanChange,
  onWalkingRouteChange,
  isRoutePlanning = false,
  isDetailMode = false, // 新增详情模式属性
  onWeatherDataChange
}) => {
  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-3"></div>
          <p className="text-white text-sm">加载地图中...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = '/leaflet/leaflet.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      return () => {
        const cssLink = document.getElementById('leaflet-css');
        if (cssLink) {
          cssLink.remove();
        }
      };
    }
  }, []);

  const mapRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [isClient, setIsClient] = useState(true);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 添加状态来控制自定义详情面板
  const [targetFootprint, setTargetFootprint] = useState<Footprint | null>(null);
  // OSRM路由相关状态
  const [walkingRoute, setWalkingRoute] = useState<{
    path: [number, number][];
    distance: number;
    duration: number;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  // 路线预览相关状态
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewProgressRef = useRef(0);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  
  // 天气数据相关状态
  const [keyPointsWeather, setKeyPointsWeather] = useState<{
    start?: WeatherData | null;
    mid?: WeatherData | null;
    end?: WeatherData | null;
  }>({});
  
  // 天气Marker引用，用于清除现有Marker
  const weatherMarkersRef = useRef<any[]>([]);
  
  // 当天气数据变化时，调用回调函数传递给父组件
  useEffect(() => {
    onWeatherDataChange?.(keyPointsWeather);
  }, [keyPointsWeather, onWeatherDataChange]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Window error:', event.error);
      showError(event.error);
      setLoadError(event.error.message);
      return true;
    };

    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    const supports = checkBrowserSupport();
    
    const requiredSupports = Object.values(supports);
    if (requiredSupports.some(support => !support)) {
      const missingFeatures = Object.entries(supports)
        .filter(([_, supported]) => !supported)
        .map(([feature]) => feature)
        .join(', ');
      
      const errorMsg = `您的浏览器缺少必要功能：${missingFeatures}。请尝试更新浏览器或使用现代浏览器。`;
      setLoadError(errorMsg);
      showError(errorMsg);
      return;
    }
  }, []);

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        if (document.readyState !== 'complete') {
          await new Promise(resolve => window.addEventListener('load', resolve));
        }
        
        const leaflet = await import('leaflet');
        setL(leaflet.default);
        
        setTimeout(() => {
          setIsMapReady(true);
        }, 500);
      } catch (error) {
        const errorMsg = '加载地图资源失败，请检查网络连接后刷新页面。';
        console.error(errorMsg, error);
        setLoadError(errorMsg);
        showError(errorMsg);
      }
    };
    
    loadLeaflet();
  }, []);

  // 为地图flyTo添加防抖处理，避免频繁点击导致的卡顿
  const flyToDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isClient && mapRef.current && selectedFootprintId && L) {
      const selectedFootprint = footprints.find(fp => fp.id === selectedFootprintId);
      if (selectedFootprint) {
        try {
          // 清除之前的计时器
          if (flyToDebounceRef.current) {
            clearTimeout(flyToDebounceRef.current);
          }
          
          // 防抖处理，300ms后执行
          flyToDebounceRef.current = setTimeout(() => {
            // 平滑移动到选中足迹的坐标
            mapRef.current.flyTo(selectedFootprint.coordinates, zoom, {
              duration: 1.5,
              easeLinearity: 0.25,
            });
            
            // 更新目标足迹，显示详情面板
            setTargetFootprint(selectedFootprint);
          }, 300);
        } catch (error) {
          console.error('Failed to center map:', error);
        }
      }
    }
    
    // 清理函数
    return () => {
      if (flyToDebounceRef.current) {
        clearTimeout(flyToDebounceRef.current);
      }
    };
  }, [selectedFootprintId, footprints, isClient, L, zoom]);

  // 当选中足迹变化时，计算OSRM步行路线 - 添加防抖机制
  useEffect(() => {
    const calculateRoute = async () => {
      if (selectedFootprints.length < 2) {
        setWalkingRoute(null);
        onWalkingRouteChange?.(null);
        return;
      }
      
      setRouteLoading(true);
      
      try {
        const coordinates = selectedFootprints.map(fp => fp.coordinates);
        // 使用简化的OSRM调用函数
        const route = await getOSRMWalkingRoute(coordinates);
        setWalkingRoute(route);
        onWalkingRouteChange?.(route);
      } catch (error) {
        console.error('Error calculating walking route:', error);
        // 确保在发生错误时也设置为null，触发fallback
        setWalkingRoute(null);
        onWalkingRouteChange?.(null);
      } finally {
        setRouteLoading(false);
      }
    };
    
    // 添加防抖机制，500ms后再发起请求
    const debounceTimeout = setTimeout(() => {
      calculateRoute();
    }, 500);
    
    // 清理函数
    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [selectedFootprints, onWalkingRouteChange]);

  // 当选中足迹或路线变化时，自动缩放地图以显示所有选中的足迹或完整路线
  useEffect(() => {
    if (isClient && mapRef.current && selectedFootprints.length > 1) {
      try {
        let coordinates: [number, number][];
        
        if (walkingRoute?.path) {
          // 如果有OSRM路线，使用路线的所有坐标
          coordinates = walkingRoute.path;
        } else {
          // 否则，使用选中足迹的坐标
          coordinates = selectedFootprints.map(fp => fp.coordinates);
        }
        
        // 使用fitBounds自动缩放地图以显示所有选中的足迹或完整路线
        mapRef.current.fitBounds(coordinates, {
          padding: [50, 50],
          animate: true,
          duration: 1.5
        });
      } catch (error) {
        console.error('Failed to fit bounds:', error);
      }
    }
  }, [selectedFootprints, walkingRoute, isClient]);
  
  // 当路线变化时，获取三个关键点的天气数据
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!walkingRoute?.path || walkingRoute.path.length < 2) {
        return;
      }
      
      try {
        // 提取起点、中点、终点
        const [start, mid, end] = extractKeyPoints(walkingRoute.path);
        
        console.log('Fetching weather data for coordinates:', { start, mid, end });
        
        // 并行获取三个点的天气数据
        const [startWeather, midWeather, endWeather] = await Promise.all([
          getWeatherData(start),
          getWeatherData(mid),
          getWeatherData(end)
        ]);
        
        console.log('Weather data fetched successfully:', { startWeather, midWeather, endWeather });
        
        // 更新天气数据状态
        setKeyPointsWeather({
          start: startWeather,
          mid: midWeather,
          end: endWeather
        });
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        // 在控制台打印明确的错误日志
        if (error instanceof Error) {
          console.error('Weather API error message:', error.message);
        }
      }
    };
    
    fetchWeatherData();
  }, [walkingRoute]);
  
  // 当天气数据和地图准备就绪时，添加天气Marker
  useEffect(() => {
    if (!L || !mapRef.current || !walkingRoute?.path || walkingRoute.path.length < 2) {
      return;
    }
    
    console.log('Adding weather markers...');
    
    // 提取起点和终点坐标
    const [start, _, end] = extractKeyPoints(walkingRoute.path);
    
    // 清除现有的天气Marker
    if (weatherMarkersRef.current) {
      weatherMarkersRef.current.forEach(marker => marker.remove());
      weatherMarkersRef.current = [];
    }
    
    // 创建天气图标映射
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
    
    // 添加起点天气Marker
    if (keyPointsWeather.start) {
      const startIcon = weatherIcons[keyPointsWeather.start.weather] || '❓';
      const startTemp = keyPointsWeather.start.temperature;
      
      const startMarkerIcon = L.divIcon({
        className: 'weather-marker',
        html: `<div style="display: flex; flex-direction: column; align-items: center; background: rgba(0, 0, 0, 0.5); padding: 4px 8px; border-radius: 8px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                <div style="font-size: 24px;">${startIcon}</div>
                <div style="font-size: 14px; font-weight: bold; color: white;">${startTemp}°C</div>
              </div>`,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
      });
      
      const startMarker = L.marker(start, { icon: startMarkerIcon });
      startMarker.addTo(mapRef.current);
      weatherMarkersRef.current.push(startMarker);
      console.log('Added start weather marker:', start);
    }
    
    // 添加终点天气Marker
    if (keyPointsWeather.end) {
      const endIcon = weatherIcons[keyPointsWeather.end.weather] || '❓';
      const endTemp = keyPointsWeather.end.temperature;
      
      const endMarkerIcon = L.divIcon({
        className: 'weather-marker',
        html: `<div style="display: flex; flex-direction: column; align-items: center; background: rgba(0, 0, 0, 0.5); padding: 4px 8px; border-radius: 8px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                <div style="font-size: 24px;">${endIcon}</div>
                <div style="font-size: 14px; font-weight: bold; color: white;">${endTemp}°C</div>
              </div>`,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
      });
      
      const endMarker = L.marker(end, { icon: endMarkerIcon });
      endMarker.addTo(mapRef.current);
      weatherMarkersRef.current.push(endMarker);
      console.log('Added end weather marker:', end);
    }
    
  }, [L, mapRef, walkingRoute, keyPointsWeather]);
  
  // 当选中足迹变化时，也检查是否需要获取天气数据（用于从攻略加载路线时）
  useEffect(() => {
    if (selectedFootprints?.length > 1 && !walkingRoute?.path) {
      // 当从攻略加载路线时，可能先有选中足迹，后有walkingRoute
      console.log('Selected footprints changed, checking if weather data is needed');
    }
  }, [selectedFootprints, walkingRoute]);

  // 路线预览功能
  useEffect(() => {
    // 初始化语音合成
    speechSynthesisRef.current = window.speechSynthesis;
    
    const handleStartRoutePreview = async () => {
      console.log('=== Start Route Preview Triggered ===');
      console.log('Selected footprints:', selectedFootprints.map(fp => fp.name));
      console.log('Map ref exists:', !!mapRef.current);
      
      // 检查是否有足够的足迹点和地图引用
      if (selectedFootprints.length < 2 || !mapRef.current) {
        console.error('Cannot start preview: insufficient footprints or map not ready');
        return;
      }
      
      setIsPreviewing(true);
      previewProgressRef.current = 0;
      
      // 清除之前的定时器
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
        previewIntervalRef.current = null;
      }
      
      // 开始路线预览
      const startRoutePreview = async () => {
        try {
          // 确保地图先移动到第一个足迹
          const firstFootprint = selectedFootprints[0];
          console.log(`First, flying to first footprint: ${firstFootprint.name}`);
          
          // 地图飞行到第一个地点
          await new Promise<void>((resolve) => {
            if (mapRef.current) {
              mapRef.current.flyTo(firstFootprint.coordinates, 15, {
                duration: 2,
                easeLinearity: 0.25,
                animate: true,
                callback: () => {
                  console.log(`Arrived at first footprint: ${firstFootprint.name}`);
                  resolve();
                }
              });
            } else {
              console.error('Map ref is null for first flyTo');
              resolve();
            }
          });
          
          // 等待1秒，然后继续下一个地点
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 继续遍历其他足迹
          for (let i = 1; i < selectedFootprints.length; i++) {
            const footprint = selectedFootprints[i];
            
            console.log(`Flying to footprint ${i + 1}: ${footprint.name}`);
            
            // 地图飞行到当前地点
            await new Promise<void>((resolve) => {
              if (mapRef.current) {
                mapRef.current.flyTo(footprint.coordinates, 15, {
                  duration: 2,
                  easeLinearity: 0.25,
                  animate: true,
                  callback: () => {
                    console.log(`Arrived at ${footprint.name}`);
                    resolve();
                  }
                });
              } else {
                console.error('Map ref is null during flyTo');
                resolve();
              }
            });
            
            // 触发Marker跳动动画
            const markerElement = document.querySelector(`[data-footprint-id="${footprint.id}"] .marker-container`) as HTMLElement;
            if (markerElement) {
              markerElement.classList.remove('animate-bounce');
              // 触发重排
              void markerElement.offsetWidth;
              markerElement.classList.add('animate-bounce');
            }
            
            // 打开详情弹窗
            setTargetFootprint(footprint);
            
            // 触发列表高亮
            window.dispatchEvent(new CustomEvent('highlightFootprint', {
              detail: { footprintId: footprint.id }
            }));
            
            // 语音播报
            if (speechSynthesisRef.current && 'speechSynthesis' in window) {
              // 清空之前的语音队列
              speechSynthesisRef.current.cancel();
              
              const utterance = new SpeechSynthesisUtterance(`正在经过：${footprint.name}`);
              utterance.lang = 'zh-CN';
              speechSynthesisRef.current.speak(utterance);
            }
            
            // 等待2秒，然后继续到下一个地点
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error('Error during route preview:', error);
        } finally {
          // 预览结束
          console.log('Route preview completed');
          setIsPreviewing(false);
          previewProgressRef.current = 0;
        }
      };
      
      // 立即启动预览
      startRoutePreview();
    };
    
    // 监听开始预览事件
    window.addEventListener('startRoutePreview', handleStartRoutePreview);
    
    // 清理函数
    return () => {
      window.removeEventListener('startRoutePreview', handleStartRoutePreview);
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
        previewIntervalRef.current = null;
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      // 清除天气Marker
      if (weatherMarkersRef.current) {
        weatherMarkersRef.current.forEach(marker => marker.remove());
        weatherMarkersRef.current = [];
      }
    };
  }, [selectedFootprints, isClient]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">⚠️</div>
          <h3 className="text-white text-lg font-medium mb-2">地图加载失败</h3>
          <p className="text-gray-300 text-sm mb-4">{loadError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  if (!isMapReady || !L) {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto mb-4"></div>
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
        </div>
        <p className="text-white text-sm mb-2">加载地图资源中...</p>
        <p className="text-gray-400 text-xs">请稍候，这可能需要几秒钟</p>
        {isMobile() && (
          <p className="text-gray-500 text-xs mt-2">正在为移动设备优化...</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-md overflow-hidden relative z-10">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ height: '100%', width: '100%', pointerEvents: 'auto', zIndex: 1 }}
        ref={mapRef}
        doubleClickZoom={true}
        whenReady={() => {
          setIsMapReady(true);
        }}
      >
        <LayersControl>
          {/* 底图层 - 添加Fallback机制 */}
          <LayersControl.BaseLayer checked name="暗黑模式 (CartoDB)">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains={['a', 'b', 'c', 'd']}
              maxZoom={18}
              errorTileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          {/* 添加OpenStreetMap标准源作为备用 */}
          <LayersControl.BaseLayer name="OpenStreetMap 标准源">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              subdomains={['a', 'b', 'c']}
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="卫星影像 (Esri)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="混合视图 (Google)">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* 路线连线 - 使用OSRM真实路径或降级为直线 */}
        {selectedFootprints.length > 1 && (
          <Polyline
            positions={walkingRoute?.path || selectedFootprints.map(fp => fp.coordinates)}
            color="#3b82f6"
            weight={5}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
            dashArray="10, 5"
            // 添加流动蚂蚁线动画效果
            className="animate-dash"
          />
        )}
        
        <MapEvents 
          onMapClick={onMapClick} 
          tempMarker={tempMarker}
          setTempMarker={setTempMarker}
        />
        
        {footprints.map((footprint) => {
          // 检查当前足迹是否是选中足迹列表中的起点、中点或终点
          let weatherIcon = undefined;
          if (walkingRoute?.path && selectedFootprints?.length > 1) {
            const selectedFootprintIds = selectedFootprints.map(fp => fp.id);
            if (selectedFootprintIds.includes(footprint.id)) {
              const index = selectedFootprintIds.indexOf(footprint.id);
              // 获取天气数据
              const weatherData = index === 0 ? keyPointsWeather.start : 
                                index === Math.floor(selectedFootprints.length / 2) ? keyPointsWeather.mid : 
                                index === selectedFootprints.length - 1 ? keyPointsWeather.end : undefined;
              if (weatherData) {
                // 使用天气数据生成图标
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
                weatherIcon = weatherIcons[weatherData.weather] || '❓';
              }
            }
          }
          
          return (
            <Marker 
              key={footprint.id} 
              position={footprint.coordinates} 
              icon={createCustomIcon(L, footprint.category, footprint.id, weatherIcon)}
              eventHandlers={{
                click: () => {
                  console.log('Marker clicked:', footprint.name);
                  setTargetFootprint(footprint);
                  
                  if (isRoutePlanning && onRoutePlanChange) {
                    // 只有在路线规划模式下，才处理选点逻辑
                    const isSelected = selectedFootprints?.some(fp => fp.id === footprint.id) || false;
                    let newSelectedFootprints: Footprint[];
                    
                    if (isSelected) {
                      // 取消选择
                      newSelectedFootprints = (selectedFootprints || []).filter(fp => fp.id !== footprint.id);
                      console.log('Deselecting point:', footprint.id, 'Name:', footprint.name);
                    } else {
                      // 添加选择
                      newSelectedFootprints = [...(selectedFootprints || []), footprint];
                      console.log('Selecting point:', footprint.id, 'Name:', footprint.name);
                    }
                    
                    onRoutePlanChange(newSelectedFootprints);
                  }
                }
              }}
            />
          );
        })}
        
        {tempMarker && (
          <Marker position={tempMarker} icon={createTemporaryIcon(L)}>
            {/* 临时标记不显示详情面板 */}
          </Marker>
        )}
        
        <MapView center={center} zoom={zoom} />
        
        {/* 自定义固定详情面板 */}
        {targetFootprint && (
          <div 
            id="custom-info-box"
            className="fixed bottom-4 right-4 z-[99999] bg-slate-900/80 backdrop-blur-md p-4 rounded-lg shadow-2xl border border-white/10 transition-all duration-300 ease-in-out opacity-0 transform translate-y-4 animate-fade-in"
            style={{ 
              minWidth: '200px', 
              maxWidth: '300px',
              animation: 'fadeIn 0.3s ease-in-out forwards'
            }}
          >
            <h3 className="font-bold text-white text-sm mb-2 truncate">{targetFootprint.name}</h3>
            <p className="text-xs text-gray-400 mb-2">{targetFootprint.location}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500/30 text-blue-200 text-xs px-2 py-0.5 rounded-full">{targetFootprint.category}</span>
              <span className="text-xs text-gray-500">{targetFootprint.date}</span>
            </div>
            {targetFootprint.description && (
              <p className="text-xs text-gray-300 mt-2 line-clamp-3">{targetFootprint.description}</p>
            )}
            <button 
              onClick={() => setTargetFootprint(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-white text-xs transition-colors"
              aria-label="关闭详情面板"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* 移动端适配的底部横幅样式 */}
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translate(0, 20px);
            }
            to {
              opacity: 1;
              transform: translate(0, 0);
            }
          }
          
          /* 弹跳动画 */
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-20px);
            }
            60% {
              transform: translateY(-10px);
            }
          }
          
          .animate-bounce {
            animation: bounce 1s ease-in-out;
          }
          
          /* 天气图标样式 */
          .weather-icon {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 20px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            padding: 2px;
            backdrop-filter: blur(2px);
          }
          
          /* 流动蚂蚁线动画 */
          @keyframes dash {
            to {
              stroke-dashoffset: -15;
            }
          }
          
          .animate-dash {
            stroke-dasharray: 10, 5;
            animation: dash 1s linear infinite;
          }
          
          @media (max-width: 640px) {
            #custom-info-box {
              bottom: 0 !important;
              right: 0 !important;
              left: 0 !important;
              min-width: auto !important;
              max-width: none !important;
              border-radius: 0 !important;
              border-left: none !important;
              border-right: none !important;
              border-bottom: none !important;
              animation: fadeIn 0.3s ease-in-out forwards;
            }
          }
        `}</style>
      </MapContainer>
    </div>
  );
};

export default Map;
