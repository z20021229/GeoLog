import { Footprint } from '../types';

// localStorage 键名
const STORAGE_KEY = 'geolog_footprints';

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 从 localStorage 读取足迹数据
export const getFootprints = (): Footprint[] => {
  try {
    if (isBrowser) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return [];
  } catch (error) {
    console.error('读取足迹数据失败:', error);
    return [];
  }
};

// 将足迹数据写入 localStorage
export const saveFootprints = (footprints: Footprint[]): void => {
  try {
    if (isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(footprints));
    }
  } catch (error) {
    console.error('保存足迹数据失败:', error);
  }
};

// 添加新足迹
export const addFootprint = (footprint: Omit<Footprint, 'id' | 'createdAt'>): Footprint => {
  const newFootprint: Footprint = {
    ...footprint,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  
  const footprints = getFootprints();
  footprints.push(newFootprint);
  saveFootprints(footprints);
  
  return newFootprint;
};

// 根据 ID 获取单个足迹
export const getFootprintById = (id: string): Footprint | undefined => {
  const footprints = getFootprints();
  return footprints.find((footprint) => footprint.id === id);
};

// 更新足迹
export const updateFootprint = (id: string, updates: Partial<Footprint>): Footprint | null => {
  const footprints = getFootprints();
  const index = footprints.findIndex((footprint) => footprint.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedFootprint = {
    ...footprints[index],
    ...updates,
  };
  
  footprints[index] = updatedFootprint;
  saveFootprints(footprints);
  
  return updatedFootprint;
};

// 删除足迹
export const deleteFootprint = (id: string): boolean => {
  const footprints = getFootprints();
  const initialLength = footprints.length;
  const filteredFootprints = footprints.filter((footprint) => footprint.id !== id);
  
  if (filteredFootprints.length === initialLength) {
    return false;
  }
  
  saveFootprints(filteredFootprints);
  return true;
};

// 导出足迹数据为 JSON 文件
export const exportFootprints = (): void => {
  try {
    if (isBrowser) {
      const footprints = getFootprints();
      const dataStr = JSON.stringify(footprints, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `geolog_footprints_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('导出足迹数据失败:', error);
  }
};

// 导入足迹数据
export const importFootprints = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedFootprints = JSON.parse(content) as Footprint[];
        
        // 验证导入的数据格式
        if (Array.isArray(importedFootprints)) {
          // 合并导入的数据与现有数据
          const existingFootprints = getFootprints();
          const combinedFootprints = [...existingFootprints, ...importedFootprints];
          saveFootprints(combinedFootprints);
          resolve(true);
        } else {
          reject(new Error('导入的数据格式不正确'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    
    reader.readAsText(file);
  });
};
