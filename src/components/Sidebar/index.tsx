'use client';

import React, { useRef, useState } from 'react';
import { Menu, X, Download, Upload, List, BarChart3, MapPin, Route, Plus, Save } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { Footprint, Guide } from '../../types';
import { calculateTotalDistance, formatDistance } from '../../utils/distance';
import { formatOSRMDistance, formatTime, getOSRMTripRoute } from '../../utils/osrm';
import StatisticsPanel from './StatisticsPanel';
import FootprintList from './FootprintList';

// 错误边界组件 - 防止子组件报错导致整个侧边栏崩溃
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-background rounded-md">
          <p className="text-sm text-muted-foreground">加载组件时出错</p>
          <button 
            onClick={this.handleRetry} 
            className="mt-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  children?: React.ReactNode;
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
  children
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

  // 开始路线预览 - 暂时注释掉
  /* const handleStartPreview = () => {
    // 触发路线预览事件
    window.dispatchEvent(new CustomEvent('startRoutePreview'));
  }; */

  // 生成分享海报功能已移除，因为html2canvas依赖问题

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-0 h-[100vh] w-16 bg-[#0f172a] border-r border-slate-700 z-[1000] transition-all duration-300 ease-in-out overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-none">
          <button
            onClick={onToggle}
            className="p-2 rounded-full hover:bg-gray-700/50 transition-colors mx-auto"
          >
            <Menu size={20} className="text-white" />
          </button>
        </div>
        <div className="p-2 flex flex-col items-center gap-2 overflow-y-auto">
          <div className="text-xs text-gray-400 text-center py-2">
            {footprints.length} 足迹
          </div>
          {footprints.map((footprint) => (
            <div
              key={footprint.id}
              className={`p-3 rounded-md cursor-pointer transition-all flex items-center justify-center ${selectedFootprintId === footprint.id ? 'bg-blue-500 text-white' : 'bg-gray-800/50 hover:bg-gray-700/50'}`}
              onClick={() => onSelectFootprint(footprint)}
              title={footprint.name}
            >
              <MapPin size={20} className="text-white" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 w-[320px] h-[100vh] flex flex-col bg-[#0f172a] z-[1000] border-r border-slate-700 pointer-events-auto">
      {/* 路线统计面板样式 */}
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
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">GeoLog</h1>
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* 统一的Tab切换状态机 */}
      <Tabs.Root defaultValue="list" onValueChange={(value) => {
        console.log('Switching to', value);
        setActiveTab(value);
      }}>
        {/* 固定的Tab切换 */}
        <Tabs.List className="flex gap-2 p-2 bg-gray-800/50 mx-4 my-2 relative">
          <Tabs.Trigger
            value="list"
            className="px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-300 hover:text-white relative group"
          >
            <List size={16} />
            足迹列表
            {/* 下划线指示器 */}
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 origin-left"></span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="statistics"
            className="px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-300 hover:text-white relative group"
          >
            <BarChart3 size={16} />
            数据统计
            {/* 下划线指示器 */}
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 origin-left"></span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="guides"
            className="px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-300 hover:text-white relative group"
          >
            <Save size={16} />
            我的攻略
            {/* 下划线指示器 */}
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 origin-left"></span>
          </Tabs.Trigger>
        </Tabs.List>

        {/* 路线规划按钮 */}
        <div className="p-4 border-b border-gray-700">
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
            
            {/* 天气小贴士 - 静态展示 */}
            <div className="mt-2">
              <p className="text-center text-gray-300">☀️ 20°C</p>
            </div>
            
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
              {/* 开始预览按钮 - 暂时注释掉
              {(isRoutePlanning || isDetailMode) && (
                <button
                  className="flex items-center gap-2 px-3 py-1 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                  onClick={handleStartPreview}
                >
                  🚶 开始预览
                </button>
              )} */}
            </div>
          </div>
        )}
        
        {/* 内容区域：设置为overflow-y: scroll，并填充剩余空间 */}
        <div className="flex-1 overflow-y-scroll scrollbar-width:thin p-4">
          {/* 足迹列表 */}
          <Tabs.Content value="list" className="space-y-2">
            <ErrorBoundary>
              <FootprintList 
                footprints={footprints} 
                selectedFootprintId={selectedFootprintId} 
                onSelectFootprint={onSelectFootprint} 
                isRoutePlanning={isRoutePlanning}
                selectedFootprints={selectedFootprints}
                onRoutePlanChange={onRoutePlanChange}
              />
            </ErrorBoundary>
          </Tabs.Content>

          {/* 数据统计 */}
          <Tabs.Content value="statistics" className="space-y-2">
            <ErrorBoundary>
              <StatisticsPanel footprints={footprints} />
            </ErrorBoundary>
          </Tabs.Content>
          
          {/* 我的攻略 */}
          <Tabs.Content value="guides" className="space-y-4">
            <ErrorBoundary>
              <div>
                <h2 className="text-lg font-bold mb-4 text-white">我的攻略</h2>
                <p className="text-sm text-gray-400 mb-4">已保存的史诗旅程</p>
                
                {/* 真实攻略列表 */}
                {guides.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>暂无保存的攻略</p>
                    <p className="text-xs mt-2">在路线规划模式下保存攻略后，将显示在这里</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guides.map((guide) => (
                      <div 
                        key={guide.id}
                        className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer transition-colors border border-gray-700 mb-4"
                        onClick={() => {
                          // 加载攻略路线
                          onLoadGuideRoute?.(guide);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-white">{guide.name}</h3>
                          <span className="text-sm text-gray-400">{(guide.distance / 1000).toFixed(1)}公里</span>
                        </div>
                        {guide.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{guide.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          包含{guide.footprints.length}个地点，预计耗时{formatTime(guide.duration)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ErrorBoundary>
          </Tabs.Content>
        </div>
      </Tabs.Root>
        
        {/* 渲染子组件 */}
        {children}
      
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <button
            onClick={handleExportClick}
            className="flex items-center justify-center gap-2 flex-1 bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-md transition-colors text-sm border border-gray-700 text-white"
          >
            <Download size={14} className="text-white" />
            <span className="text-white">导出</span>
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center justify-center gap-2 flex-1 bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-md transition-colors text-sm border border-gray-700 text-white"
          >
            <Upload size={14} className="text-white" />
            <span className="text-white">导入</span>
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
