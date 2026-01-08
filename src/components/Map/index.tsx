'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, LayersControl } from 'react-leaflet';
import { Footprint } from '../../types';
import { checkBrowserSupport, isMobile, showError } from '../../utils/compatibility';
import { MapPin } from 'lucide-react';

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

// 创建自定义图标，使用 lucide-react 的 MapPin 图标，并添加动画效果
const createCustomIcon = (L: any, category: string) => {
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
  
  return L.divIcon({
    // 添加动画类名
    className: 'custom-leaflet-marker marker-animate',
    html: `<div class="marker-container animate-pop">${svgIcon}</div>`,
    iconSize: [28, 38],
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
  selectedFootprintId 
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

  useEffect(() => {
    if (isClient && mapRef.current && selectedFootprintId && L) {
      const selectedFootprint = footprints.find(fp => fp.id === selectedFootprintId);
      if (selectedFootprint) {
        try {
          // 平滑移动到选中足迹的坐标
          mapRef.current.flyTo(selectedFootprint.coordinates, zoom, {
            duration: 1.5,
            easeLinearity: 0.25,
          });
          
          // 更新目标足迹，显示详情面板
          setTargetFootprint(selectedFootprint);
        } catch (error) {
          console.error('Failed to center map:', error);
        }
      }
    }
  }, [selectedFootprintId, footprints, isClient, L, zoom]);

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
        whenReady={() => {
          setIsMapReady(true);
        }}
      >
        <LayersControl>
          {/* 底图层 */}
          <LayersControl.BaseLayer checked name="暗黑模式 (CartoDB)">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains={['a', 'b', 'c', 'd']}
              maxZoom={18}
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
        
        <MapEvents 
          onMapClick={onMapClick} 
          tempMarker={tempMarker}
          setTempMarker={setTempMarker}
        />
        
        {footprints.map((footprint) => (
          <Marker 
            key={footprint.id} 
            position={footprint.coordinates} 
            icon={createCustomIcon(L, footprint.category)}
            eventHandlers={{
              click: () => {
                console.log('Marker clicked:', footprint.name);
                setTargetFootprint(footprint);
              }
            }}
          />
        ))}
        
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
