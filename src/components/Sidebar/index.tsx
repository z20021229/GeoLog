'use client';

import React, { useRef } from 'react';
import { Menu, X, Download, Upload, List, BarChart3 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
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

        {/* 足迹列表 */}
        <Tabs.Content value="list" className="h-full w-full p-0 m-0 data-[state=inactive]:hidden">
          {/* 这里的容器必须是 flex，确保 List 能撑开 */}
          <div className="flex flex-col h-full w-full overflow-hidden">
            <FootprintList 
              footprints={footprints} 
              selectedFootprintId={selectedFootprintId} 
              onSelectFootprint={onSelectFootprint} 
            />
          </div>
        </Tabs.Content>

        {/* 数据统计 */}
        <Tabs.Content value="statistics" className="h-full w-full p-0 m-0 data-[state=inactive]:hidden">
          {/* 这里的容器维持 block，确保吸顶 */}
          <div className="block h-full w-full overflow-y-auto">
            <StatisticsPanel footprints={footprints} />
          </div>
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
