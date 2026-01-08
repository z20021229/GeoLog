'use client';

import React, { useState } from 'react';
import { Search, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Footprint } from '../../types';
import { formatDate } from '../../utils/markerUtils';

interface FootprintListProps {
  footprints: Footprint[];
  selectedFootprintId: string | undefined;
  onSelectFootprint: (footprint: Footprint) => void;
}

const FootprintList: React.FC<FootprintListProps> = ({ 
  footprints, 
  selectedFootprintId, 
  onSelectFootprint 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFootprints = footprints.filter((footprint) =>
    footprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    footprint.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    footprint.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto w-full p-4">
      {/* 重构验证埋点 */}
      <div className="bg-green-500 text-white p-2 text-xs mb-4">
        重构调试：列表组件已挂载 (数量: {footprints.length})
      </div>
      
      {/* 搜索框 */}
      <div className="mb-4">
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

      {/* 足迹统计 */}
      <p className="text-sm text-muted-foreground mb-4">
        你已在地图上留下了 {filteredFootprints.length} 个足迹
      </p>
      
      {/* 暂无数据提示 */}
      {filteredFootprints.length === 0 && (
        <div className="bg-yellow-500/10 p-4 rounded-md text-center">
          暂无足迹数据
        </div>
      )}
      
      {/* 足迹列表 */}
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
  );
};

export default FootprintList;