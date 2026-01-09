'use client';

import React, { useRef, useState } from 'react';
import { Menu, X, Download, Upload, List, BarChart3, MapPin, Route, Plus, Save } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Footprint } from '../../types';
import { calculateTotalDistance, formatDistance } from '../../utils/distance';
import { formatOSRMDistance, formatTime, getOSRMTripRoute } from '../../utils/osrm';
import StatisticsPanel from './StatisticsPanel';
import FootprintList from './FootprintList';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  footprints: Footprint[];
  selectedFootprintId: string | undefined;
  onSelectFootprint: (footprint: Footprint) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onRoutePlanChange?: (selectedFootprints: Footprint[]) => void;
  selectedFootprints?: Footprint[];
  walkingRoute?: {
    path: [number, number][];
    distance: number;
    duration: number;
  } | null;
  onSaveRoute?: () => void;
  isRoutePlanning: boolean;
  onRoutePlanToggle: () => void;
  onWalkingRouteChange?: (route: {
    path: [number, number][];
    distance: number;
    duration: number;
  } | null) => void;
  onLoadGuideRoute?: (routeType: '96km' | '500km') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  onToggle, 
  footprints = [], // 设置默认值，防止undefined
  selectedFootprintId, 
  onSelectFootprint,
  onExportData,
  onImportData,
  onRoutePlanChange,
  selectedFootprints = [],
  walkingRoute = null,
  onSaveRoute,
  isRoutePlanning,
  onRoutePlanToggle,
  onWalkingRouteChange,
  onLoadGuideRoute
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('list');

  const handleExportClick = () => {
    onExportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 处理路线规划模式切换，使用外部传入的回调函数
  const handleRoutePlanToggle = () => {
    onRoutePlanToggle();
  };

  const handleSaveRoute = () => {
    onSaveRoute?.();
  };

  if (isCollapsed) {
    return (
      <div className={`bg-card border-r border-border h-screen transition-all duration-300 ease-in-out overflow-hidden w-16`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={onToggle}
            className="p-2 rounded-full hover:bg-accent transition-colors mx-auto"
          >
            <Menu size={20} />
          </button>
        </div>
        <div className="p-2 flex flex-col items-center gap-2">
          <div className="text-xs text-muted-foreground text-center py-2">
            {footprints.length} 足迹
          </div>
          {footprints.map((footprint) => (
            <div
              key={footprint.id}
              className={`p-3 rounded-md cursor-pointer transition-all flex items-center justify-center ${selectedFootprintId === footprint.id ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
              onClick={() => onSelectFootprint(footprint)}
              title={footprint.name}
            >
              <MapPin size={20} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-r border-border h-screen transition-all duration-300 ease-in-out overflow-hidden w-64 flex flex-col relative">
      {/* 添加统计面板样式 */}
      <style jsx>{`
        /* 给统计面板增加明显的视觉区分 */
        .route-stats-container {
          background: rgba(59, 130, 246, 0.1); /* 淡淡的蓝色背景 */
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          padding: 12px;
          margin: 10px;
          color: #60a5fa; /* 天蓝色字体 */
          font-size: 0.875rem;
        }
      `}</style>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">GeoLog</h1>
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <Tabs.Root defaultValue="list" onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <Tabs.List className="flex border-b border-border">
            <Tabs.Trigger
              value="list"
              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors flex items-center gap-2 px-4"
            >
              <List size={16} />
              足迹列表
            </Tabs.Trigger>
            <Tabs.Trigger
              value="statistics"
              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors flex items-center gap-2 px-4"
            >
              <BarChart3 size={16} />
              数据统计
            </Tabs.Trigger>
            <Tabs.Trigger
              value="guides"
              className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors flex items-center gap-2 px-4"
            >
              <Save size={16} />
              我的攻略
            </Tabs.Trigger>
          </Tabs.List>

          {/* 路线规划按钮 */}
          <div className="p-4 border-b border-border">
            {isRoutePlanning ? (
              <div className="flex gap-2">
                <button
                  className="flex-1 flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90 justify-center"
                  onClick={handleRoutePlanToggle}
                >
                  <Route size={16} />
                  退出路线规划
                </button>
                <button
                  className="flex-1 flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/90 justify-center"
                  onClick={() => {
                    // 模拟保存攻略功能
                    const distance = walkingRoute ? walkingRoute.distance / 1000 : calculateTotalDistance(selectedFootprints.map(fp => fp.coordinates)) / 1000;
                    alert(`已将这趟 ${distance.toFixed(1)}km 的史诗旅程存入你的攻略库！`);
                  }}
                >
                  <Save size={16} />
                  保存攻略
                </button>
              </div>
            ) : (
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full justify-center`}
                onClick={handleRoutePlanToggle}
              >
                <Route size={16} />
                规划路线
              </button>
            )}
          </div>

          {/* 路线统计面板 */}
          {isRoutePlanning && selectedFootprints.length > 0 && (
            <div className="route-stats-container flex-shrink-0">
              <p className="text-center">已选 {selectedFootprints.length} 个点</p>
              {walkingRoute ? (
                <div className="mt-2">
                  <p className="text-center">🚶 预计步行: {formatOSRMDistance(walkingRoute.distance)} | ⏱️ 约 {(walkingRoute.distance / 1000 / 5).toFixed(1)} 小时</p>
                </div>
              ) : selectedFootprints.length > 1 ? (
                <p className="text-center mt-2">直线距离: {formatDistance(calculateTotalDistance(selectedFootprints.map(fp => fp.coordinates)))}</p>
              ) : null}
              {selectedFootprints.length > 2 && (
                <div className="mt-3 flex justify-center">
                  <button
                    className="flex items-center gap-2 px-3 py-1 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    onClick={async () => {
                      try {
                        // 调用OSRM的trip接口获取优化路径
                        const coordinates = selectedFootprints.map(fp => fp.coordinates);
                        const tripResult = await getOSRMTripRoute(coordinates);
                        
                        if (tripResult) {
                          // 根据优化后的顺序重新排列足迹
                          const optimizedFootprints = tripResult.optimizedOrder.map(idx => selectedFootprints[idx]);
                          // 更新选中的足迹顺序，触发路径重新渲染
                          onRoutePlanChange?.(optimizedFootprints);
                          // 如果有路线更新回调，直接传递优化后的路径
                          if (onWalkingRouteChange) {
                            onWalkingRouteChange({
                              path: tripResult.path,
                              distance: tripResult.distance,
                              duration: tripResult.duration
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error optimizing route:', error);
                      }
                    }}
                  >
                    ✨ 优化顺序
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 足迹列表：使用固定高度和强制滚动 */}
          <Tabs.Content value="list" className="h-[calc(100vh-280px)] overflow-y-scroll !important p-4">
            <FootprintList 
              footprints={footprints} 
              selectedFootprintId={selectedFootprintId} 
              onSelectFootprint={onSelectFootprint} 
              isRoutePlanning={isRoutePlanning}
              selectedFootprints={selectedFootprints}
              onRoutePlanChange={onRoutePlanChange}
            />
          </Tabs.Content>

          {/* 数据统计：使用固定高度和强制滚动 */}
          <Tabs.Content value="statistics" className="h-[calc(100vh-280px)] overflow-y-scroll !important p-4">
            <StatisticsPanel footprints={footprints} />
          </Tabs.Content>
          
          {/* 我的攻略：使用固定高度和强制滚动 */}
          <Tabs.Content value="guides" className="h-[calc(100vh-280px)] overflow-y-scroll !important p-4">
            <div>
              <h2 className="text-lg font-bold mb-4">我的攻略</h2>
              <p className="text-sm text-muted-foreground mb-4">已保存的史诗旅程</p>
              
              {/* 模拟攻略数据 */}
          <div className="space-y-3">
            {/* 96公里路线 */}
            <div 
              className="p-3 rounded-md bg-background hover:bg-accent cursor-pointer transition-colors border border-border"
              onClick={() => {
                // 加载96公里路线
                onLoadGuideRoute?.('96km');
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">96公里城市探索</h3>
                <span className="text-sm text-muted-foreground">96.0公里</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">包含12个地点，预计耗时18小时</p>
            </div>
            
            {/* 500公里路线 */}
            <div 
              className="p-3 rounded-md bg-background hover:bg-accent cursor-pointer transition-colors border border-border"
              onClick={() => {
                // 加载500公里路线
                onLoadGuideRoute?.('500km');
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">500公里长途跋涉</h3>
                <span className="text-sm text-muted-foreground">500.0公里</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">包含25个地点，预计耗时100小时</p>
            </div>
            
            {/* 其他示例路线 */}
            <div 
              className="p-3 rounded-md bg-background hover:bg-accent cursor-pointer transition-colors border border-border"
              onClick={() => {
                // 模拟加载其他路线
                alert('加载周末短途游路线...');
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">周末短途游</h3>
                <span className="text-sm text-muted-foreground">15.5公里</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">包含5个地点，预计耗时3小时</p>
            </div>
          </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <div className="mt-auto p-4 border-t border-border">
        <div className="flex gap-2">
          <button
            onClick={handleExportClick}
            className="flex items-center justify-center gap-2 flex-1 bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-md transition-colors text-sm"
          >
            <Download size={14} />
            <span>导出</span>
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center justify-center gap-2 flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 p-2 rounded-md transition-colors text-sm"
          >
            <Upload size={14} />
            <span>导入</span>
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default Sidebar;
