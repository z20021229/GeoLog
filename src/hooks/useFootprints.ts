import { useState, useEffect } from 'react';
import { Footprint, FootprintFormData, Guide } from '../types';
import { getFootprints, addFootprint, exportFootprints, importFootprints, getGuides, addGuide } from '../utils/storage';

// 自定义钩子，用于在客户端安全地获取和管理足迹数据
export const useFootprints = () => {
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);

  // 从 localStorage 加载足迹数据
  const loadFootprints = () => {
    const savedFootprints = getFootprints();
    setFootprints(savedFootprints);
  };

  // 从 localStorage 加载攻略数据
  const loadGuides = () => {
    const savedGuides = getGuides();
    setGuides(savedGuides);
  };

  // 在客户端组件挂载后加载数据
  useEffect(() => {
    loadFootprints();
    loadGuides();
  }, []);

  // 添加新足迹
  const handleAddFootprint = (formData: FootprintFormData, coordinates: [number, number]) => {
    const newFootprint = addFootprint({
      ...formData,
      coordinates,
    });
    setFootprints(prev => [...prev, newFootprint]);
    return newFootprint;
  };

  // 导出足迹数据
  const handleExportData = () => {
    exportFootprints();
  };

  // 导入足迹数据
  const handleImportData = async (file: File) => {
    try {
      const success = await importFootprints(file);
      if (success) {
        // 重新加载足迹数据
        loadFootprints();
      }
      return success;
    } catch (error) {
      console.error('导入数据失败:', error);
      alert('导入数据失败，请检查文件格式是否正确');
      return false;
    }
  };

  // 保存攻略
  const handleSaveGuide = (name: string, description: string, footprints: Footprint[], distance: number, duration: number) => {
    const newGuide = addGuide({
      name,
      description,
      footprints,
      distance,
      duration,
    });
    setGuides(prev => [...prev, newGuide]);
    return newGuide;
  };

  return {
    footprints,
    guides,
    loadFootprints,
    loadGuides,
    handleAddFootprint,
    handleExportData,
    handleImportData,
    handleSaveGuide,
  };
};