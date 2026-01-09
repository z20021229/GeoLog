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
  
  // 路线规划相关状态
  const [isRoutePlanning, setIsRoutePlanning] = useState(false);
  const [selectedFootprints, setSelectedFootprints] = useState<Footprint[]>([]);
  const [walkingRoute, setWalkingRoute] = useState<{
    path: [number, number][];
    distance: number;
    duration: number;
  } | null>(null);
  
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

  // 处理路线规划模式切换
  const handleRoutePlanToggle = () => {
    const newRoutePlanningState = !isRoutePlanning;
    setIsRoutePlanning(newRoutePlanningState);
    
    if (!newRoutePlanningState) {
      // 退出路线规划模式时，清空所有选择和路线
      setSelectedFootprints([]);
      setWalkingRoute(null);
    }
  };

  // 处理路线规划选择变化
  const handleRoutePlanChange = (footprints: Footprint[]) => {
    setSelectedFootprints(footprints);
  };

  // 处理OSRM路线变化
  const handleWalkingRouteChange = (route: {
    path: [number, number][];
    distance: number;
    duration: number;
  } | null) => {
    setWalkingRoute(route);
  };

  // 处理从攻略库加载路线
  const handleLoadGuideRoute = (routeType: '96km' | '500km') => {
    // 模拟加载不同长度的路线
    const mockFootprints: Footprint[] = [];
    
    if (routeType === '96km') {
      // 模拟96公里路线，创建12个随机足迹点
      for (let i = 0; i < 12; i++) {
        // 创建大致围绕北京的随机坐标
        const lat = 39.9042 + (Math.random() - 0.5) * 0.5;
        const lng = 116.4074 + (Math.random() - 0.5) * 0.5;
        
        mockFootprints.push({
          id: `mock-${Date.now()}-${i}`,
          name: `地点 ${i + 1}`,
          location: `模拟位置 ${i + 1}`,
          coordinates: [lat, lng],
          description: `这是96公里路线的第${i + 1}个地点`,
          category: '户外',
          date: new Date().toISOString().split('T')[0],
          createdAt: Date.now(),
        });
      }
    } else {
      // 模拟500公里路线，创建25个随机足迹点，范围更大
      for (let i = 0; i < 25; i++) {
        // 创建更大范围的随机坐标，模拟长途路线
        const lat = 39.9042 + (Math.random() - 0.5) * 5;
        const lng = 116.4074 + (Math.random() - 0.5) * 5;
        
        mockFootprints.push({
          id: `mock-${Date.now()}-${i}`,
          name: `长途地点 ${i + 1}`,
          location: `长途位置 ${i + 1}`,
          coordinates: [lat, lng],
          description: `这是500公里路线的第${i + 1}个地点`,
          category: '户外',
          date: new Date().toISOString().split('T')[0],
          createdAt: Date.now(),
        });
      }
    }
    
    // 进入路线规划模式
    setIsRoutePlanning(true);
    // 设置选中的足迹
    setSelectedFootprints(mockFootprints);
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
        selectedFootprints={selectedFootprints}
        onRoutePlanChange={handleRoutePlanChange}
        walkingRoute={walkingRoute}
        isRoutePlanning={isRoutePlanning}
        onRoutePlanToggle={handleRoutePlanToggle}
        onWalkingRouteChange={handleWalkingRouteChange}
        onLoadGuideRoute={handleLoadGuideRoute}
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
              selectedFootprints={selectedFootprints}
              onRoutePlanChange={handleRoutePlanChange}
              onWalkingRouteChange={handleWalkingRouteChange}
              isRoutePlanning={isRoutePlanning}
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
