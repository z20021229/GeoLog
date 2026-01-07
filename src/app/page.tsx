'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar';
import AddFootprintDialog from '../components/Dialog/AddFootprintDialog';
import { Footprint, FootprintFormData } from '../types';
import { useFootprints } from '../hooks/useFootprints';

// 使用 next/dynamic 动态导入地图组件，避免 SSR 错误
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted flex items-center justify-center">加载地图中...</div>,
});

const Home: React.FC = () => {
  // 使用自定义钩子管理足迹数据
  const { footprints, handleAddFootprint, handleExportData, handleImportData } = useFootprints();

  // 状态管理
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFootprintId, setSelectedFootprintId] = useState<string | undefined>();
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.9042, 116.4074]);
  const [mapZoom, setMapZoom] = useState<number>(10);
  
  // 添加足迹弹窗相关状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [clickedCoordinates, setClickedCoordinates] = useState<[number, number]>([0, 0]);

  // 切换侧边栏
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 处理地图点击事件，打开添加足迹弹窗
  const handleMapClick = (latlng: [number, number]) => {
    setClickedCoordinates(latlng);
    setIsAddDialogOpen(true);
  };

  // 处理侧边栏足迹点击事件，地图跳转到对应坐标
  const handleSelectFootprint = (footprint: Footprint) => {
    setSelectedFootprintId(footprint.id);
    setMapCenter(footprint.coordinates);
    setMapZoom(15);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
        footprints={footprints}
        selectedFootprintId={selectedFootprintId}
        onSelectFootprint={handleSelectFootprint}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
      
      {/* Main Content - Map */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 p-4">
          <Suspense fallback={<div className='h-full w-full bg-slate-900 animate-pulse' />}>
            <Map 
              center={mapCenter}
              zoom={mapZoom}
              footprints={footprints}
              onMapClick={handleMapClick}
              selectedFootprintId={selectedFootprintId}
            />
          </Suspense>
        </div>
      </div>
      
      {/* 添加足迹弹窗 */}
      <AddFootprintDialog 
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddFootprint={(formData) => handleAddFootprint(formData, clickedCoordinates)}
        coordinates={clickedCoordinates}
      />
    </div>
  );
};

export default Home;
