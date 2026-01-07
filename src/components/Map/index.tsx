'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Footprint } from '../../types';
import { checkBrowserSupport, isMobile, showError } from '../../utils/compatibility';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  footprints: Footprint[];
  onMapClick: (latlng: [number, number]) => void;
  selectedFootprintId?: string;
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

// 地图视图控制器组件
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

// 地图点击事件处理组件
const MapEvents: React.FC<MapEventsProps> = ({ onMapClick, tempMarker, setTempMarker }) => {
  useMapEvents({
    click: (e) => {
      try {
        const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
        setTempMarker(latlng);
        onMapClick(latlng);
        
        setTimeout(() => {
          setTempMarker(null);
        }, 3000);
      } catch (error) {
        console.error('Map click error:', error);
        showError(error as Error);
      }
    },
  });

  return null;
};

// 创建临时 Marker 图标的工厂函数
const createTemporaryIcon = (L: any) => {
  const color = '#ec4899';
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="marker-container">${svgIcon}</div>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
};

// 创建自定义 Marker 图标的工厂函数
const createCustomIcon = (L: any, category: string) => {
  const colors: Record<string, string> = {
    '探店': '#ef4444',
    '户外': '#10b981',
    '城市': '#3b82f6',
    '打卡': '#f59e0b',
  };
  
  const color = colors[category] || '#3b82f6';
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="marker-container">${svgIcon}</div>`,
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
  selectedFootprintId 
}) => {
  // 确保只在客户端执行
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

  const mapRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [isClient, setIsClient] = useState(true);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 添加错误监听
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

  // 检查浏览器兼容性
  useEffect(() => {
    const supports = checkBrowserSupport();
    
    // 检查必要的支持
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

  // 动态加载 Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // 等待 DOM 加载完成
        if (document.readyState !== 'complete') {
          await new Promise(resolve => window.addEventListener('load', resolve));
        }
        
        // 动态导入 Leaflet
        const leaflet = await import('leaflet');
        setL(leaflet.default);
        
        // 延迟一点确保地图准备就绪
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

  // 处理弹窗打开
  useEffect(() => {
    if (isClient && mapRef.current && selectedFootprintId && L) {
      const selectedFootprint = footprints.find(fp => fp.id === selectedFootprintId);
      if (selectedFootprint) {
        try {
          setTimeout(() => {
            mapRef.current?.eachLayer((layer: any) => {
              if (layer instanceof L.Marker) {
                const markerLatLng = layer.getLatLng();
                if (markerLatLng.lat === selectedFootprint.coordinates[0] && 
                    markerLatLng.lng === selectedFootprint.coordinates[1]) {
                  layer.openPopup();
                }
              }
            });
          }, 500);
        } catch (error) {
          console.error('Failed to open popup:', error);
        }
      }
    }
  }, [selectedFootprintId, footprints, isClient, L]);

  // 显示错误信息
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

  // 显示加载状态
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
        whenReady={() => {
          setIsMapReady(true);
        }}
      >
        {/* CartoDB Dark Matter Tile Layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains={['a', 'b', 'c', 'd']}
        />
        
        <MapEvents 
          onMapClick={onMapClick} 
          tempMarker={tempMarker}
          setTempMarker={setTempMarker}
        />
        
        {/* 渲染所有足迹的 Marker */}
        {footprints.map((footprint) => (
          <Marker 
            key={footprint.id} 
            position={footprint.coordinates} 
            icon={createCustomIcon(L, footprint.category)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg">{footprint.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{footprint.location}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="bg-accent px-2 py-0.5 rounded-full">{footprint.category}</span>
                  <span>{footprint.date}</span>
                </div>
                <p className="text-sm">{footprint.description || '暂无描述'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {tempMarker && (
          <Marker position={tempMarker} icon={createTemporaryIcon(L)}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">临时标记</h3>
                <p>点击位置：{tempMarker[0].toFixed(6)}, {tempMarker[1].toFixed(6)}</p>
                <p className="text-xs text-muted-foreground mt-1">3秒后自动消失</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        <MapView center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
};

export default Map;
