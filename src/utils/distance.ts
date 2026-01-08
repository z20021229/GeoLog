// 计算两点之间的直线距离（单位：公里）
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // 地球半径，单位公里
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// 计算多个点之间的总直线距离
export const calculateTotalDistance = (coordinates: [number, number][]): number => {
  if (coordinates.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lat1, lon1] = coordinates[i];
    const [lat2, lon2] = coordinates[i + 1];
    totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
  }
  
  return totalDistance;
};

// 格式化距离，保留一位小数
export const formatDistance = (distance: number): string => {
  return distance.toFixed(1);
};