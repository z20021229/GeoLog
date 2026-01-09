'use client';

import React, { useRef, useState } from 'react';
import { Menu, X, Download, Upload, List, BarChart3, MapPin, Route, Plus, Save } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Footprint, Guide } from '../../types';
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
  onSaveGuide?: (name: string, description: string) => void;
  isRoutePlanning: boolean;
  onRoutePlanToggle: () => void;
  onWalkingRouteChange?: (route: {
    path: [number, number][];
    distance: number;
    duration: number;
  } | null) => void;
  guides?: Guide[];
  onLoadGuideRoute?: (guide: Guide) => void;
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
  onRoutePlanToggle,
  onWalkingRouteChange,
  guides = [],
  onLoadGuideRoute
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

  // 生成分享海报
  const handleGeneratePoster = async () => {
    try {
      // 创建海报容器
      const posterContainer = document.createElement('div');
      posterContainer.style.cssText = `
        position: fixed;
        top: -10000px;
        left: -10000px;
        width: 800px;
        height: 1200px;
        background: #1e293b;
        color: white;
        display: flex;
        flex-direction: column;
        padding: 20px;
        z-index: 9999;
      `;
      
      // 获取地图元素
      const mapElement = document.querySelector('.leaflet-container');
      if (!mapElement) {
        console.error('无法找到地图元素');
        return;
      }
      
      // 克隆地图元素
      const mapClone = mapElement.cloneNode(true) as HTMLElement;
      mapClone.style.cssText = `
        width: 100%;
        height: 600px;
        border-radius: 8px;
        margin-bottom: 20px;
      `;
      
      // 创建攻略信息容器
      const guideInfoContainer = document.createElement('div');
      guideInfoContainer.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      `;
      
      // 添加攻略标题
      const guideTitle = document.createElement('h2');
      guideTitle.textContent = '我的足迹攻略';
      guideTitle.style.cssText = `
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        text-align: center;
      `;
      guideInfoContainer.appendChild(guideTitle);
      
      // 添加统计信息
      const statsContainer = document.createElement('div');
      statsContainer.style.cssText = `
        display: flex;
        justify-content: space-around;
        padding: 16px;
        background: #334155;
        border-radius: 8px;
      `;
      
      const distanceStat = document.createElement('div');
      distanceStat.innerHTML = `
        <div style="font-size: 14px; color: #94a3b8;">总距离</div>
        <div style="font-size: 20px; font-weight: bold;">${formatOSRMDistance(walkingRoute?.distance || 0)}</div>
      `;
      statsContainer.appendChild(distanceStat);
      
      const durationStat = document.createElement('div');
      durationStat.innerHTML = `
        <div style="font-size: 14px; color: #94a3b8;">预计耗时</div>
        <div style="font-size: 20px; font-weight: bold;">${formatTime(walkingRoute?.duration || 0)}</div>
      `;
      statsContainer.appendChild(durationStat);
      
      const locationsStat = document.createElement('div');
      locationsStat.innerHTML = `
        <div style="font-size: 14px; color: #94a3b8;">地点数量</div>
        <div style="font-size: 20px; font-weight: bold;">${selectedFootprints?.length || 0}个</div>
      `;
      statsContainer.appendChild(locationsStat);
      
      guideInfoContainer.appendChild(statsContainer);
      
      // 添加足迹列表
      const footprintsTitle = document.createElement('h3');
      footprintsTitle.textContent = '足迹清单';
      footprintsTitle.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        margin: 0;
      `;
      guideInfoContainer.appendChild(footprintsTitle);
      
      const footprintsList = document.createElement('div');
      footprintsList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
      `;
      
      selectedFootprints?.forEach((footprint, index) => {
        const footprintItem = document.createElement('div');
        footprintItem.style.cssText = `
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #334155;
          border-radius: 6px;
        `;
        
        const indexBadge = document.createElement('div');
        indexBadge.textContent = (index + 1).toString();
        indexBadge.style.cssText = `
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #60a5fa;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          flex-shrink: 0;
        `;
        
        const footprintInfo = document.createElement('div');
        footprintInfo.style.cssText = `
          flex: 1;
          overflow: hidden;
        `;
        
        const footprintName = document.createElement('div');
        footprintName.textContent = footprint.name;
        footprintName.style.cssText = `
          font-weight: bold;
          margin-bottom: 4px;
        `;
        
        const footprintLocation = document.createElement('div');
        footprintLocation.textContent = footprint.location;
        footprintLocation.style.cssText = `
          font-size: 12px;
          color: #94a3b8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `;
        
        footprintInfo.appendChild(footprintName);
        footprintInfo.appendChild(footprintLocation);
        
        footprintItem.appendChild(indexBadge);
        footprintItem.appendChild(footprintInfo);
        
        footprintsList.appendChild(footprintItem);
      });
      
      guideInfoContainer.appendChild(footprintsList);
      
      // 添加水印
      const watermark = document.createElement('div');
      watermark.textContent = 'GeoLog 记录我的足迹';
      watermark.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        font-size: 14px;
        color: #94a3b8;
      `;
      
      // 构建海报
      posterContainer.appendChild(mapClone);
      posterContainer.appendChild(guideInfoContainer);
      posterContainer.appendChild(watermark);
      
      // 添加到文档
      document.body.appendChild(posterContainer);
      
      // 使用html2canvas截图（使用类型断言避免编译错误）
      const html2canvas = (await import('html2canvas' as any)).default;
      const canvas = await html2canvas(posterContainer, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // 移除海报容器
      document.body.removeChild(posterContainer);
      
      // 下载图片
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.download = `足迹海报_${date}.jpg`;
      link.href = canvas.toDataURL('image/jpeg');
      link.click();
      
      console.log('海报生成成功！');
    } catch (error) {
      console.error('生成海报失败:', error);
      alert('生成海报失败，请重试');
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
              <div className="mt-3 flex justify-center gap-2">
                {selectedFootprints.length > 2 && (
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
                <button
                  className="flex items-center gap-2 px-3 py-1 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                  onClick={handleGeneratePoster}
                >
                  📸 生成海报
                </button>
              </div>
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
              
              {/* 真实攻略列表 */}
          {guides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无保存的攻略</p>
              <p className="text-xs mt-2">在路线规划模式下保存攻略后，将显示在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {guides.map((guide) => (
                <div 
                  key={guide.id}
                  className="p-3 rounded-md bg-background hover:bg-accent cursor-pointer transition-colors border border-border"
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
