'use client';

import { useEffect } from 'react';

const ServiceWorkerRegister: React.FC = () => {
  useEffect(() => {
    // 检查浏览器是否支持 Service Worker
    if ('serviceWorker' in navigator) {
      // 注册 Service Worker
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch((registrationError) => {
            console.log('ServiceWorker registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return null;
};

export default ServiceWorkerRegister;
