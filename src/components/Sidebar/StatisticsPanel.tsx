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
import { getCategoryStats, getCityStats, getOverviewStats } from '../../utils/stats';
import { BarChart3, MapPin, Calendar, Clock } from 'lucide-react';

interface StatisticsPanelProps {
  footprints: Footprint[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ footprints }) => {
  const categoryStats = getCategoryStats(footprints);
  const cityStats = getCityStats(footprints);
  const overviewStats = getOverviewStats(footprints);

  if (footprints.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>暂无足迹数据</p>
        <p className="text-sm mt-2">添加足迹后即可查看统计</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">数据统计</h2>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-accent/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <MapPin size={14} />
            <span className="text-xs">足迹数</span>
          </div>
          <p className="text-2xl font-bold">{overviewStats.totalFootprints}</p>
        </div>
        <div className="bg-accent/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <MapPin size={14} />
            <span className="text-xs">城市</span>
          </div>
          <p className="text-2xl font-bold">{overviewStats.cityCount}</p>
        </div>
        <div className="bg-accent/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Calendar size={14} />
            <span className="text-xs">最早</span>
          </div>
          <p className="text-sm font-medium">{overviewStats.earliestDate}</p>
        </div>
        <div className="bg-accent/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock size={14} />
            <span className="text-xs">最近</span>
          </div>
          <p className="text-sm font-medium">{overviewStats.latestDate}</p>
        </div>
      </div>

      <div className="bg-accent/30 rounded-lg p-3">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          分类分布
        </h3>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryStats}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
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
        <div className="flex flex-wrap gap-2 mt-2">
          {categoryStats.map((stat) => (
            <div
              key={stat.name}
              className="flex items-center gap-1 text-xs"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: stat.color }}
              />
              <span>{stat.name}: {stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-accent/30 rounded-lg p-3">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          城市排行
        </h3>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityStats} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="city"
                width={60}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}次`, '访问次数']}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
