// OSRM API调用工具函数，用于获取真实的步行路径数据

export interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    geometry: {
      coordinates: Array<[number, number]>;
      type: string;
    };
    legs: Array<{
      distance: number;
      duration: number;
    }>;
    distance: number;
    duration: number;
  }>;
  waypoints: Array<{
    name: string;
    location: [number, number];
  }>;
}

/**
 * 调用OSRM API获取两点之间的步行路径
 * @param start 起点坐标 [纬度, 经度]
 * @param end 终点坐标 [纬度, 经度]
 * @returns 包含路径、距离和时间的对象
 */
export const getWalkingRoute = async (start: [number, number], end: [number, number]): Promise<OSRMRouteResponse | null> => {
  try {
    // OSRM API需要的格式是 lon,lat
    const startCoord = `${start[1]},${start[0]}`;
    const endCoord = `${end[1]},${end[0]}`;
    
    const url = `https://router.project-osrm.org/route/v1/walking/${startCoord};${endCoord}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data: OSRMRouteResponse = await response.json();
    
    // 检查API响应是否成功
    if (data.code !== 'Ok') {
      console.warn('OSRM API returned non-Ok status:', data.code);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    return null;
  }
};

/**
 * 调用OSRM API获取多个点之间的步行路径
 * @param coordinates 坐标数组，格式为 [[纬度, 经度], [纬度, 经度], ...]
 * @returns 包含完整路径、总距离和总时间的对象
 */
export const getMultiPointWalkingRoute = async (coordinates: [number, number][]): Promise<{
  path: [number, number][];
  distance: number;
  duration: number;
} | null> => {
  if (coordinates.length < 2) {
    return null;
  }
  
  let totalPath: [number, number][] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  
  // 计算每两个相邻点之间的路径
  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];
    
    const routeResponse = await getWalkingRoute(start, end);
    
    if (!routeResponse || routeResponse.routes.length === 0) {
      console.warn(`无法计算从点${i}到点${i+1}的步行路径，降级为直线`);
      // 降级为直线
      totalPath.push(start, end);
      
      // 使用直线距离估算
      const straightDistance = calculateStraightDistance(start, end);
      totalDistance += straightDistance;
      // 按成人平均步行速度5km/h计算时间（秒）
      totalDuration += (straightDistance / 5) * 3600;
    } else {
      const route = routeResponse.routes[0];
      
      // 将OSRM返回的坐标转换为 [纬度, 经度] 格式
      const path = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      
      // 如果是第一个路径段，直接添加整个路径
      if (i === 0) {
        totalPath = [...path];
      } else {
        // 否则，跳过重复的起点（与上一段的终点相同）
        totalPath = [...totalPath, ...path.slice(1)];
      }
      
      totalDistance += route.distance;
      totalDuration += route.duration;
    }
  }
  
  return {
    path: totalPath,
    distance: totalDistance,
    duration: totalDuration
  };
};

/**
 * 计算两点之间的直线距离（单位：米）
 * @param start 起点坐标 [纬度, 经度]
 * @param end 终点坐标 [纬度, 经度]
 * @returns 直线距离（米）
 */
const calculateStraightDistance = (start: [number, number], end: [number, number]): number => {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (start[0] * Math.PI) / 180;
  const φ2 = (end[0] * Math.PI) / 180;
  const Δφ = ((end[0] - start[0]) * Math.PI) / 180;
  const Δλ = ((end[1] - start[1]) * Math.PI) / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * 格式化距离，转换为合适的单位（米或公里）
 * @param distance 距离（米）
 * @returns 格式化后的距离字符串
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}米`;
  }
  return `${(distance / 1000).toFixed(1)}公里`;
};

/**
 * 格式化时间，转换为分钟
 * @param seconds 时间（秒）
 * @returns 格式化后的时间字符串
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  return `${minutes}分钟`;
};