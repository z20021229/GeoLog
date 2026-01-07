'use client';

import React, { useState, useEffect } from 'react';
import { showError } from '../utils/compatibility';

interface NetworkMonitorProps {
  children: React.ReactNode;
}

const NetworkMonitor: React.FC<NetworkMonitorProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [resourceTimeout, setResourceTimeout] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 监测网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showError('网络已恢复，应用功能已正常');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showError('网络连接已断开，部分功能可能不可用');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 设置资源加载超时检测
    const timeoutId = setTimeout(() => {
      setResourceTimeout(true);
      showError('资源加载超时，请检查网络连接或稍后再试');
    }, 10000);

    // 模拟资源加载完成
    const loadCompleteId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeoutId);
      clearTimeout(loadCompleteId);
    };
  }, []);

  return (
    <>
      {children}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>网络连接已断开</span>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkMonitor;
