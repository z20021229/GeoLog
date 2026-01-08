'use client';

import React, { useRef, useState } from 'react';
import { Menu, X, Download, Upload, List, BarChart3, MapPin, Route, Plus, Save } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Footprint } from '../../types';
import { calculateTotalDistance, formatDistance } from '../../utils/distance';
import { formatOSRMDistance, formatTime } from '../../utils/osrm';
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
  onSaveRoute
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRoutePlanning, setIsRoutePlanning] = useState(false);
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

  const handleRoutePlanToggle = () => {
    setIsRoutePlanning(!isRoutePlanning);
    if (!isRoutePlanning) {
      // 进入路线规划模式时，清空之前的选择
      onRoutePlanChange?.([]);
    }
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
        <Tabs.Root defaultValue="list" onValueChange={setActiveTab} className="flex-1 flex flex-col">
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
          </Tabs.List>

          {/* 路线规划按钮 */}
          <div className="p-4 border-b border-border">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isRoutePlanning ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'} w-full justify-center`}
              onClick={handleRoutePlanToggle}
            >
              <Route size={16} />
              {isRoutePlanning ? '退出路线规划' : '规划路线'}
            </button>
          </div>

          {/* 路线统计面板 */}
          {isRoutePlanning && selectedFootprints.length > 0 && (
            <div className="route-stats-container">
              <p className="text-center">已选 {selectedFootprints.length} 个点</p>
              {walkingRoute ? (
                <div className="mt-2">
                  <p className="text-center">预计步行距离: {formatOSRMDistance(walkingRoute.distance)}</p>
                  <p className="text-center">预计耗时: {formatTime(walkingRoute.duration)}</p>
                </div>
              ) : selectedFootprints.length > 1 ? (
                <p className="text-center mt-2">直线距离: {formatDistance(calculateTotalDistance(selectedFootprints.map(fp => fp.coordinates)))}</p>
              ) : null}
            </div>
          )}

          {/* 足迹列表：使用正常布局 */}
          <Tabs.Content value="list" className="flex-1 overflow-y-auto scrollbar-thin p-4">
            <FootprintList 
              footprints={footprints} 
              selectedFootprintId={selectedFootprintId} 
              onSelectFootprint={onSelectFootprint} 
              isRoutePlanning={isRoutePlanning}
              selectedFootprints={selectedFootprints}
              onRoutePlanChange={onRoutePlanChange}
            />
          </Tabs.Content>

          {/* 数据统计：使用正常布局 */}
          <Tabs.Content value="statistics" className="flex-1 overflow-y-auto scrollbar-thin p-4">
            <StatisticsPanel footprints={footprints} />
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
