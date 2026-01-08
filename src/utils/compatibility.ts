// 兼容性工具函数

/**
 * 检查浏览器是否支持特定特性
 */
export const checkBrowserSupport = () => {
  // 检查必要的浏览器特性
  const supports = {
    promise: typeof Promise !== 'undefined',
    fetch: typeof window !== 'undefined' && typeof window.fetch !== 'undefined',
    map: typeof window !== 'undefined' && typeof window.Map !== 'undefined',
    set: typeof window !== 'undefined' && typeof window.Set !== 'undefined',
  };
  
  return supports;
};

/**
 * 检查是否为移动端
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * 显示错误提示 - 改为控制台日志，避免UI干扰
 */
export const showError = (error: Error | string) => {
  if (typeof window === 'undefined') return;
  
  const message = typeof error === 'string' ? error : error.message;
  console.error(`错误: ${message}`);
};
