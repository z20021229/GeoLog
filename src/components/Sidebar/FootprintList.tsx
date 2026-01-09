'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, ChevronRight, List, GitCommit } from 'lucide-react';
import { Footprint } from '../../types';
import { formatDate } from '../../utils/markerUtils';

interface FootprintListProps {
  footprints: Footprint[];
  selectedFootprintId: string | undefined;
  onSelectFootprint: (footprint: Footprint) => void;
  isRoutePlanning?: boolean;
  selectedFootprints?: Footprint[];
  onRoutePlanChange?: (selectedFootprints: Footprint[]) => void;
}

// 按年份和月份分组足迹
const groupFootprintsByDate = (footprints: Footprint[]) => {
  const grouped: Record<string, Footprint[]> = {};
  
  footprints.forEach(footprint => {
    const date = new Date(footprint.date);
    const yearMonth = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    
    if (!grouped[yearMonth]) {
      grouped[yearMonth] = [];
    }
    grouped[yearMonth].push(footprint);
  });
  
  // 按时间倒序排序
  return Object.entries(grouped).sort((a, b) => {
    const [yearA, monthA] = a[0].match(/(\d+)年(\d+)月/)!.slice(1).map(Number);
    const [yearB, monthB] = b[0].match(/(\d+)年(\d+)月/)!.slice(1).map(Number);
    return new Date(yearB, monthB - 1).getTime() - new Date(yearA, monthA - 1).getTime();
  });
};

// 获取分类对应的颜色
const getCategoryColor = (category: string) => {
  switch (category) {
    case '探店':
      return 'bg-red-500';
    case '户外':
      return 'bg-green-500';
    case '城市':
      return 'bg-blue-500';
    case '打卡':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const FootprintList: React.FC<FootprintListProps> = ({ 
  footprints, 
  selectedFootprintId, 
  onSelectFootprint,
  isRoutePlanning = false,
  selectedFootprints = [],
  onRoutePlanChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [highlightedFootprintId, setHighlightedFootprintId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  // 监听高亮足迹事件
  useEffect(() => {
    const handleHighlightFootprint = (event: CustomEvent<{ footprintId: string }>) => {
      const { footprintId } = event.detail;
      setHighlightedFootprintId(footprintId);
      
      // 滚动到高亮的足迹卡片
      setTimeout(() => {
        const element = document.getElementById(`footprint-card-${footprintId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      // 3秒后移除高亮
      setTimeout(() => {
        setHighlightedFootprintId(null);
      }, 3000);
    };
    
    window.addEventListener('highlightFootprint', handleHighlightFootprint as EventListener);
    
    return () => {
      window.removeEventListener('highlightFootprint', handleHighlightFootprint as EventListener);
    };
  }, []);

  // 处理足迹选择
  const handleFootprintSelect = (footprint: Footprint) => {
    if (isRoutePlanning) {
      // 路线规划模式下，处理多选
      const isSelected = selectedFootprints.some(fp => fp.id === footprint.id);
      let newSelectedFootprints: Footprint[];
      
      if (isSelected) {
        // 取消选择
        newSelectedFootprints = selectedFootprints.filter(fp => fp.id !== footprint.id);
        console.log('Deselecting point:', footprint.id, 'Name:', footprint.name);
      } else {
        // 添加选择
        newSelectedFootprints = [...selectedFootprints, footprint];
        console.log('Selecting point:', footprint.id, 'Name:', footprint.name);
      }
      
      onRoutePlanChange?.(newSelectedFootprints);
    } else {
      // 常规模式下，处理单选
      console.log('Selecting footprint:', footprint.id, 'Name:', footprint.name);
      onSelectFootprint(footprint);
    }
  };

  // 检查足迹是否被选中
  const isFootprintSelected = (footprint: Footprint) => {
    return selectedFootprints.some(fp => fp.id === footprint.id);
  };

  const filteredFootprints = footprints.filter((footprint) =>
    footprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    footprint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    footprint.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 时光轴视图
  const renderTimelineView = () => {
    const groupedFootprints = groupFootprintsByDate(filteredFootprints);
    
    return (
      <div className="space-y-8 mt-4">
        {groupedFootprints.map(([yearMonth, fps]) => (
          <div key={yearMonth}>
            <h3 className="text-lg font-bold text-muted-foreground mb-4">{yearMonth}</h3>
            <div className="space-y-6 relative">
              {/* 垂直线 */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700"></div>
              
              {fps.map((footprint) => (
                <div 
                  key={footprint.id}
                  id={`footprint-card-${footprint.id}`}
                  className={`flex gap-4 cursor-pointer transition-all ${selectedFootprintId === footprint.id ? 'opacity-100' : 
                           highlightedFootprintId === footprint.id ? 'opacity-100' : 
                           'opacity-70 hover:opacity-100'}`}
                  onClick={() => handleFootprintSelect(footprint)}
                >
                  {/* 时间轴节点 */}
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full ${getCategoryColor(footprint.category)} flex items-center justify-center z-10 relative`}>
                      <MapPin size={16} className="text-white" />
                    </div>
                  </div>
                  
                  {/* 足迹卡片 */}
                  <div className={`flex-1 bg-[#1e293b] rounded-xl overflow-hidden shadow-md border border-gray-700 hover:bg-gray-700/50 transition-colors ${highlightedFootprintId === footprint.id ? 'ring-2 ring-blue-500' : ''} ${isFootprintSelected(footprint) ? 'ring-2 ring-primary' : ''}`}>
                    <div className="p-4">
                      {footprint.image && (
                        <img
                          src={footprint.image}
                          alt={footprint.name}
                          className={`w-full object-cover rounded-lg mb-3 ${isRoutePlanning ? 'h-24' : 'h-32'}`}
                        />
                      )}
                      <div className="flex gap-3">
                        {isRoutePlanning && (
                          <input
                            type="checkbox"
                            checked={isFootprintSelected(footprint)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFootprintSelect(footprint);
                            }}
                            className="mt-1 flex-shrink-0 h-4 w-4 text-primary focus:ring-primary border-input rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{footprint.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Calendar size={14} />
                            <span className="truncate">{formatDate(footprint.date)}</span>
                          </div>
                          {footprint.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 truncate">{footprint.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 常规列表视图
  const renderListView = () => (
    <div className="space-y-3 mt-4">
      {filteredFootprints.map((footprint) => (
        <div
          key={footprint.id}
          id={`footprint-card-${footprint.id}`}
          className={`bg-[#1e293b] rounded-xl overflow-hidden shadow-md border border-gray-700 cursor-pointer transition-all hover:bg-gray-700/50 ${selectedFootprintId === footprint.id ? 'ring-2 ring-blue-500' : ''} ${highlightedFootprintId === footprint.id ? 'ring-2 ring-blue-500' : ''} ${isFootprintSelected(footprint) ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleFootprintSelect(footprint)}
        >
          <div className="p-4">
            {footprint.image && (
              <img
                src={footprint.image}
                alt={footprint.name}
                className={`w-full object-cover rounded-lg mb-3 ${isRoutePlanning ? 'h-24' : 'h-32'}`}
              />
            )}
            <div className="flex items-start gap-3">
              {isRoutePlanning && (
                <input
                  type="checkbox"
                  checked={isFootprintSelected(footprint)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleFootprintSelect(footprint);
                  }}
                  className="mt-1 flex-shrink-0 h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
              )}
              <MapPin className={`mt-1 flex-shrink-0 text-blue-400`} size={18} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{footprint.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <span className="truncate">{footprint.location}</span>
                  <Calendar size={14} />
                  <span className="truncate">{formatDate(footprint.date)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${footprint.category === '探店' ? 'bg-red-500/20 text-red-300' : 
                                                         footprint.category === '户外' ? 'bg-green-500/20 text-green-300' : 
                                                         footprint.category === '城市' ? 'bg-blue-500/20 text-blue-300' : 
                                                         'bg-orange-500/20 text-orange-300'}`}>
                    {footprint.category}
                  </span>
                </div>
                {footprint.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 truncate">{footprint.description}</p>
                )}
              </div>
              <ChevronRight size={16} className="mt-1 text-gray-500" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      
      {/* 搜索框 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="搜索足迹..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 视图切换和统计 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          你已在地图上留下了 {filteredFootprints.length} 个足迹
        </p>
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-full p-1">
          <button
            className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-gray-700/80 text-gray-400'}`}
            onClick={() => setViewMode('list')}
            title="常规列表"
          >
            <List size={16} />
          </button>
          <button
            className={`p-2 rounded-full transition-colors ${viewMode === 'timeline' ? 'bg-blue-500 text-white' : 'hover:bg-gray-700/80 text-gray-400'}`}
            onClick={() => setViewMode('timeline')}
            title="时光轴"
          >
            <GitCommit size={16} />
          </button>
        </div>
      </div>
      
      {/* 暂无数据提示 */}
      {filteredFootprints.length === 0 && (
        <div className="bg-gray-800/50 p-6 rounded-xl text-center border border-gray-700">
          <p className="text-gray-400">暂无足迹数据</p>
        </div>
      )}
      
      {/* 视图内容 */}
      {viewMode === 'list' ? renderListView() : renderTimelineView()}
    </div>
  );
};

export default FootprintList;