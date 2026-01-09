'use client';

import React, { useRef, useState } from 'react';
import { Menu, X, Download, Upload, List, BarChart3, MapPin, Route, Plus, Save } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Footprint, Guide } from '../../types';
import { calculateTotalDistance, formatDistance } from '../../utils/distance';
import { formatOSRMDistance, formatTime, getOSRMTripRoute } from '../../utils/osrm';
import { WeatherData } from '../../utils/weather';
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
  onSaveGuide?: (name: string, description: string) => void;
  isRoutePlanning: boolean;
  isDetailMode?: boolean; // 新增详情模式属性
  onRoutePlanToggle: () => void;
  onWalkingRouteChange?: (route: {
    path: [number, number][];
    distance: number;
    duration: number;
  } | null) => void;
  guides?: Guide[];
  onLoadGuideRoute?: (guide: Guide) => void;
  keyPointsWeather?: {
    start?: WeatherData | null;
    mid?: WeatherData | null;
    end?: WeatherData | null;
  };
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
  onSaveGuide,
  isRoutePlanning,
  isDetailMode = false, // 新增详情模式属性
  onRoutePlanToggle,
  onWalkingRouteChange,
  guides = [],
  onLoadGuideRoute,
  keyPointsWeather = {}
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('list');

  // 添加保存攻略的状态
  const [showSaveGuideDialog, setShowSaveGuideDialog] = useState(false);
  const [guideName, setGuideName] = useState('');
  const [guideDescription, setGuideDescription] = useState('');

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

  // 处理保存攻略
  const handleSaveGuideClick = () => {
    if (onSaveGuide) {
      setShowSaveGuideDialog(true);
    }
  };

  // 确认保存攻略
  const handleConfirmSaveGuide = () => {
    if (guideName.trim() && onSaveGuide) {
      onSaveGuide(guideName, guideDescription);
      setShowSaveGuideDialog(false);
      setGuideName('');
      setGuideDescription('');
    } else {
      alert('请输入攻略名称');
    }
  };

  // 取消保存攻略
  const handleCancelSaveGuide = () => {
    setShowSaveGuideDialog(false);
    setGuideName('');
    setGuideDescription('');
  };

  // 开始路线预览
  const handleStartPreview = () => {
    // 触发路线预览事件
    window.dispatchEvent(new CustomEvent('startRoutePreview'));
  };

  // 生成分享海报功能已移除，因为html2canvas依赖问题

  if (isCollapsed) {
    return (
      <div className={`bg-card border-r border-border h-screen transition-all duration-300 ease-in-out overflow-hidden w-16`}>
        <div className="flex items-center justify-between p-4 border-b border-border flex-none">
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

      <Tabs.Root defaultValue="list" onValueChange={setActiveTab} className="flex flex-col flex-1">
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
            {isDetailMode ? (
              <div className="flex gap-2">
                <button
                  className="flex-1 flex items-center gap-2 px-4 py-2 rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90 justify-center"
                  onClick={handleRoutePlanToggle}
                >
                  <Route size={16} />
                  进入编辑模式
                </button>
              </div>
            ) : isRoutePlanning ? (
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
                  onClick={handleSaveGuideClick}
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
          {(isRoutePlanning || isDetailMode) && selectedFootprints.length > 0 && (
            <div className="route-stats-container">
              <p className="text-center">已选 {selectedFootprints.length} 个点</p>
              {walkingRoute ? (
                <div className="mt-2">
                  <p className="text-center">🚶 预计步行: {formatOSRMDistance(walkingRoute.distance)} | ⏱️ 约 {(walkingRoute.distance / 1000 / 5).toFixed(1)} 小时</p>
                </div>
              ) : selectedFootprints.length > 1 ? (
                <p className="text-center mt-2">直线距离: {formatDistance(calculateTotalDistance(selectedFootprints.map(fp => fp.coordinates)))}</p>
              ) : null}
              
              {/* 天气小贴士 */}
              {walkingRoute && keyPointsWeather.end ? (
                <div className="mt-2">
                  {(() => {
                    // 检查路程是否超过10公里
                    const isLongDistance = walkingRoute.distance > 10000;
                    // 检查终点是否有雨
                    const endHasRain = keyPointsWeather.end?.weather?.includes('Rain') || keyPointsWeather.end?.weather?.includes('Drizzle');
                    
                    if (isLongDistance && endHasRain) {
                      return <p className="text-center text-yellow-400">💡 建议带伞，目的地预计有小雨</p>;
                    } else if (keyPointsWeather.end?.weather?.includes('Snow')) {
                      return <p className="text-center text-blue-300">💡 注意保暖，目的地预计有雪</p>;
                    } else if (keyPointsWeather.end?.weather?.includes('Clear')) {
                      return <p className="text-center text-green-300">💡 天气晴朗，适合出行</p>;
                    } else if (keyPointsWeather.end?.weather?.includes('Clouds')) {
                      return <p className="text-center text-gray-300">💡 天气多云，舒适宜人</p>;
                    } else if (keyPointsWeather.end?.weather?.includes('Thunderstorm')) {
                      return <p className="text-center text-red-300">💡 注意安全，目的地预计有雷雨</p>;
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm mt-2">天气加载中...</p>
              )}
              
              <div className="mt-3 flex justify-center gap-2">
                {isRoutePlanning && selectedFootprints.length > 2 && (
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
                )}
                {(isRoutePlanning || isDetailMode) && (
                  <button
                    className="flex items-center gap-2 px-3 py-1 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                    onClick={handleStartPreview}
                  >
                    🚶 开始预览
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* 内容区域：设置为overflow-y: auto，并填充剩余空间 */}
          <div className="overflow-y-auto p-4 flex-1">
            {/* 足迹列表 */}
            <Tabs.Content value="list" className="space-y-2">
              <FootprintList 
                footprints={footprints} 
                selectedFootprintId={selectedFootprintId} 
                onSelectFootprint={onSelectFootprint} 
                isRoutePlanning={isRoutePlanning}
                selectedFootprints={selectedFootprints}
                onRoutePlanChange={onRoutePlanChange}
              />
            </Tabs.Content>

            {/* 数据统计 */}
            <Tabs.Content value="statistics" className="space-y-2">
              <StatisticsPanel footprints={footprints} />
            </Tabs.Content>
            
            {/* 我的攻略 */}
            <Tabs.Content value="guides" className="space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-4">我的攻略</h2>
                <p className="text-sm text-muted-foreground mb-4">已保存的史诗旅程</p>
                
                {/* 真实攻略列表 */}
                {guides.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>暂无保存的攻略</p>
                    <p className="text-xs mt-2">在路线规划模式下保存攻略后，将显示在这里</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guides.map((guide) => (
                      <div 
                        key={guide.id}
                        className="p-4 rounded-md bg-background hover:bg-accent cursor-pointer transition-colors border border-border mb-4"
                        onClick={() => {
                          // 加载攻略路线
                          onLoadGuideRoute?.(guide);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{guide.name}</h3>
                          <span className="text-sm text-muted-foreground">{(guide.distance / 1000).toFixed(1)}公里</span>
                        </div>
                        {guide.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{guide.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          包含{guide.footprints.length}个地点，预计耗时{formatTime(guide.duration)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>
      
      <div className="p-4 border-t border-border">
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
      
      {/* 保存攻略对话框 */}
      {showSaveGuideDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">保存攻略</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">攻略名称</label>
                <input
                  type="text"
                  value={guideName}
                  onChange={(e) => setGuideName(e.target.value)}
                  placeholder="输入攻略名称"
                  className="w-full p-2 border border-border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">攻略描述（可选）</label>
                <textarea
                  value={guideDescription}
                  onChange={(e) => setGuideDescription(e.target.value)}
                  placeholder="输入攻略描述"
                  className="w-full p-2 border border-border rounded-md h-20"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelSaveGuide}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSaveGuide}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
