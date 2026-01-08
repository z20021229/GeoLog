'use client';

import React, { useState, useRef } from 'react';
import { Search, Menu, X, MapPin, Calendar, ChevronRight, Download, Upload, List, BarChart3 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Footprint } from '../../types';
import { formatDate } from '../../utils/markerUtils';
import StatisticsPanel from './StatisticsPanel';

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
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFootprints = footprints.filter((footprint) =>
    footprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    footprint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    footprint.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {filteredFootprints.map((footprint) => (
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

      <Tabs.Root defaultValue="list" className="flex-1 flex flex-col">
        <Tabs.List className="flex border-b border-border">
          <Tabs.Trigger
            value="list"
            className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors flex items-center justify-center gap-2"
          >
            <List size={16} />
            足迹列表
          </Tabs.Trigger>
          <Tabs.Trigger
            value="stats"
            className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors flex items-center justify-center gap-2"
          >
            <BarChart3 size={16} />
            数据统计
          </Tabs.Trigger>
        </Tabs.List>

        {/* 足迹列表 */}
        <Tabs.Content value="list" className="flex-1 flex flex-col">
          <div className="flex-1 h-[calc(100vh-120px)] overflow-y-auto block min-h-[200px] w-full bg-red-500/10">
            {/* 调试点亮测试 */}
            <div className="bg-yellow-500 text-black p-2">列表组件已加载，数量：{footprints.length}</div>
            {/* 强制显示测试 */}
            <p className="text-white p-4">列表测试：{footprints.length}</p>
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="搜索足迹..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-4">
                你已在地图上留下了 {filteredFootprints.length} 个足迹
              </p>
              
              {/* 强制渲染测试：显示暂无数据提示 */}
              {filteredFootprints.length === 0 && (
                <div className="bg-yellow-500/10 p-4 rounded-md text-center">
                  暂无足迹数据
                </div>
              )}
              
              {/* 渲染足迹列表 */}
              <div className="space-y-2 mt-4">
                {filteredFootprints.map((footprint) => (
                  <div
                    key={footprint.id}
                    className={`p-3 rounded-md cursor-pointer transition-all ${selectedFootprintId === footprint.id ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
                    onClick={() => onSelectFootprint(footprint)}
                  >
                    <div className="flex flex-col gap-3">
                      {footprint.image && (
                        <img
                          src={footprint.image}
                          alt={footprint.name}
                          className="w-full h-24 object-cover rounded-md"
                        />
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-1 flex-shrink-0" size={18} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{footprint.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span className="truncate">{footprint.location}</span>
                            <Calendar size={14} />
                            <span>{formatDate(footprint.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${footprint.category === '探店' ? 'bg-red-500/20 text-red-300' : 
                                                           footprint.category === '户外' ? 'bg-green-500/20 text-green-300' : 
                                                           footprint.category === '城市' ? 'bg-blue-500/20 text-blue-300' : 
                                                           'bg-orange-500/20 text-orange-300'}`}>
                              {footprint.category}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="mt-1 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tabs.Content>

        {/* 数据统计 */}
        <Tabs.Content value="stats" className="flex-1 flex flex-col">
          <StatisticsPanel footprints={footprints} />
        </Tabs.Content>
      </Tabs.Root>

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
