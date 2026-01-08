'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Footprint } from '../../types';
import { getCategoryStats, getCityStats, getOverviewStats, generateAISummary } from '../../utils/stats';
import { BarChart3, MapPin, Calendar, Clock, Sparkles, MapPin as MapPinIcon, Compass } from 'lucide-react';

interface StatisticsPanelProps {
  footprints: Footprint[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ footprints }) => {
  const categoryStats = getCategoryStats(footprints);
  const cityStats = getCityStats(footprints);
  const overviewStats = getOverviewStats(footprints);
  const aiSummary = generateAISummary(footprints);

  if (footprints.length === 0) {
    return (
      <div className="h-full flex flex-col overflow-y-auto custom-scrollbar p-4 text-center text-muted-foreground">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>暂无足迹数据</p>
        <p className="text-sm mt-2">添加足迹后即可查看统计</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <MapPinIcon size={120} className="text-primary" />
        </div>
        {/* 经纬线装饰 */}
        <div className="absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`lat-${i}`}
              className="absolute w-full h-px bg-primary/10"
              style={{ top: `${(i + 1) * 10}%` }}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`lng-${i}`}
              className="absolute h-full w-px bg-primary/10"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>
        {/* 小罗盘装饰 */}
        <div className="absolute top-4 right-4">
          <Compass size={24} className="text-primary/20" />
        </div>
      </div>

      {/* 顶部固定区 - 统计卡片 */}
      <div className="relative z-10">
        <h2 className="text-lg font-semibold mb-2">数据统计</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-4 text-center border border-blue-500/30 shadow-sm">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <MapPin size={14} />
              <span className="text-xs">足迹数</span>
            </div>
            <p className="text-2xl font-bold">{overviewStats.totalFootprints}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 text-center border border-green-500/30 shadow-sm">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <MapPin size={14} />
              <span className="text-xs">城市数</span>
            </div>
            <p className="text-2xl font-bold">{overviewStats.cityCount}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-4 text-center border border-amber-500/30 shadow-sm">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar size={14} />
              <span className="text-xs">最早</span>
            </div>
            <p className="text-sm font-medium">{overviewStats.earliestDate}</p>
          </div>
          <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-lg p-4 text-center border border-pink-500/30 shadow-sm">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock size={14} />
              <span className="text-xs">最近</span>
            </div>
            <p className="text-sm font-medium">{overviewStats.latestDate}</p>
          </div>
        </div>
      </div>

      {/* 中部滚动区 */}
      <div className="flex-1 overflow-y-auto space-y-4 relative z-10">
        {/* 饼图 */}
        <div className="bg-accent/30 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            分类分布
          </h3>
          <div className="min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}个`, '数量']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI 总结 */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-5 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={18} className="text-purple-400" />
            <h3 className="text-base font-medium">{aiSummary.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {aiSummary.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
