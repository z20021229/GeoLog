'use client';

import React, { useState, useEffect } from 'react';

interface NetworkMonitorProps {
  children: React.ReactNode;
}

const NetworkMonitor: React.FC<NetworkMonitorProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // 监测网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('网络已恢复，应用功能已正常');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('网络连接已断开，部分功能可能不可用');
    };

    // 仅监听真实的网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
};

export default NetworkMonitor;
