'use client';

import React, { useRef, useState } from 'react';
import { Menu, X, Download, Upload, List, BarChart3 } from 'lucide-react';
import { Footprint } from '../../types';
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  onToggle, 
  footprints, 
  selectedFootprintId, 
  onSelectFootprint,
  onExportData,
  onImportData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 添加activeTab状态来控制Tab切换
  const [activeTab, setActiveTab] = useState<'list' | 'statistics'>('list');

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
    <div className="bg-card border-r border-border h-screen transition-all duration-300 ease-in-out overflow-hidden w-64 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">GeoLog</h1>
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* 自定义Tab切换 */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 px-4 ${activeTab === 'list' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <List size={16} />
          足迹列表
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 px-4 ${activeTab === 'statistics' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <BarChart3 size={16} />
          数据统计
        </button>
      </div>

      {/* 1. 足迹列表：使用固定CSS样式 */}
      <div 
        style={{ 
          height: 'calc(100vh - 160px)', 
          position: 'relative', 
          display: activeTab === 'list' ? 'block' : 'none' 
        }}
      >
        {/* 强制渲染的大红字测试信息 */}
        <div className="bg-red-500 text-white p-4">组件加载测试：当前足迹 {footprints.length} 个</div>
        
        {/* FootprintList组件 */}
        <div style={{ height: 'calc(100% - 56px)', overflow: 'auto' }}>
          <FootprintList 
            footprints={footprints} 
            selectedFootprintId={selectedFootprintId} 
            onSelectFootprint={onSelectFootprint} 
          />
        </div>
      </div>
      
      {/* 2. 数据统计：使用固定CSS样式 */}
      <div 
        style={{ 
          height: 'calc(100vh - 160px)', 
          position: 'relative', 
          display: activeTab === 'statistics' ? 'block' : 'none' 
        }}
      >
        <div style={{ height: '100%', overflow: 'auto' }}>
          <StatisticsPanel footprints={footprints} />
        </div>
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
