// 工具函数

/**
 * 格式化日期为更易读的形式
 * @param dateString 日期字符串，格式：YYYY-MM-DD
 * @returns 格式化后的日期字符串，格式：YYYY年MM月DD日
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};
