'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icons
import 'leaflet/dist/leaflet.css';
import { Footprint } from '../../types';
import { createCustomMarkerIcon, createTemporaryMarkerIcon } from '../../utils/markerUtils';

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
}

// 地图视图控制器组件
const MapView: React.FC<MapViewProps> = ({ center, zoom }) => {
  const map = useMap();
  
  React.useEffect(() => {
    // 使用 flyTo 实现平滑动画跳转
    map.flyTo(center, zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);

  return null;
};

// 地图点击事件处理组件 - 使用 useMapEvents 钩子
const MapEvents: React.FC<MapEventsProps> = ({ onMapClick }) => {
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  
  // 使用 useMapEvents 钩子处理地图点击事件
  const map = useMapEvents({
    click: (e) => {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      
      // 设置临时 Marker
      setTempMarker(latlng);
      
      // 触发地图点击回调，弹出弹窗
      onMapClick(latlng);
      
      // 3秒后移除临时 Marker
      setTimeout(() => {
        setTempMarker(null);
      }, 3000);
    },
  });

  return (
    <>
      {/* 临时 Marker */}
      {tempMarker && (
        <Marker position={tempMarker} icon={createTemporaryMarkerIcon()}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">临时标记</h3>
              <p>点击位置：{tempMarker[0].toFixed(6)}, {tempMarker[1].toFixed(6)}</p>
              <p className="text-xs text-muted-foreground mt-1">3秒后自动消失</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
};

const Map: React.FC<MapProps> = ({ 
  center = [39.9042, 116.4074], 
  zoom = 10, 
  footprints, 
  onMapClick,
  selectedFootprintId 
}) => {
  const mapRef = React.useRef<L.Map | null>(null);

  // 当选中足迹变化时，打开对应的弹窗
  useEffect(() => {
    if (mapRef.current && selectedFootprintId) {
      const selectedFootprint = footprints.find(fp => fp.id === selectedFootprintId);
      if (selectedFootprint) {
        // 延迟执行，确保地图已经渲染完成
        setTimeout(() => {
          // 找到对应的 marker 并打开弹窗
          const marker = mapRef.current?.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              const markerLatLng = layer.getLatLng();
              if (markerLatLng.lat === selectedFootprint.coordinates[0] && 
                  markerLatLng.lng === selectedFootprint.coordinates[1]) {
                layer.openPopup();
              }
            }
          });
        }, 500);
      }
    }
  }, [selectedFootprintId, footprints]);

  return (
    <div className="w-full h-full rounded-md overflow-hidden relative z-10">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ height: '100%', width: '100%', pointerEvents: 'auto', zIndex: 1 }}
        ref={mapRef}
      >
        {/* CartoDB Dark Matter Tile Layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains={['a', 'b', 'c', 'd']}
        />
        
        {/* 地图点击事件处理组件 - 嵌套在 MapContainer 内部 */}
        <MapEvents onMapClick={onMapClick} />
        
        {/* 渲染所有足迹的 Marker */}
        {footprints.map((footprint) => (
          <Marker 
            key={footprint.id} 
            position={footprint.coordinates} 
            icon={createCustomMarkerIcon(footprint.category)}
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
        
        {/* Map view controller */}
        <MapView center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
};

export default Map;
