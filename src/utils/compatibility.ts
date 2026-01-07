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
 * 显示错误提示
 */
export const showError = (error: Error | string) => {
  if (typeof window === 'undefined') return;
  
  const message = typeof error === 'string' ? error : error.message;
  
  // 创建错误提示元素
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ef4444;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 90%;
    text-align: center;
  `;
  errorDiv.textContent = `错误: ${message}`;
  
  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 4px;
    right: 8px;
    background: transparent;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  `;
  
  closeButton.addEventListener('click', () => {
    document.body.removeChild(errorDiv);
  });
  
  errorDiv.appendChild(closeButton);
  document.body.appendChild(errorDiv);
  
  // 5秒后自动消失
  setTimeout(() => {
    if (document.body.contains(errorDiv)) {
      document.body.removeChild(errorDiv);
    }
  }, 5000);
};
