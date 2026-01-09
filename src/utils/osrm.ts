// OSRM API调用工具函数，用于获取真实的步行路径数据

/**
 * 调用OSRM API获取真实步行路径
 * @param coordinates 坐标数组，格式为 [[纬度, 经度], [纬度, 经度], ...]
 * @returns 包含路径、距离和时间的对象，失败时返回null
 */
export const getOSRMWalkingRoute = async (coordinates: [number, number][]): Promise<{
  path: [number, number][];
  distance: number;
  duration: number;
} | null> => {
  try {
    if (coordinates.length < 2) {
      return null;
    }
    
    // OSRM API需要的格式是 lon,lat;lon,lat
    const coordinatesStr = coordinates
      .map(coord => `${coord[1]},${coord[0]}`) // 转换为 lon,lat 格式
      .join(';');
    
    // 简化URL，使用正确的格式
    const url = `https://router.project-osrm.org/route/v1/walking/${coordinatesStr}?overview=full&geometries=geojson&steps=false`;
    
    // 设置超时时间为5秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 检查API响应是否成功
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM API returned invalid response:', data.code);
      return null;
    }
    
    const route = data.routes[0];
    
    // 将OSRM返回的坐标转换为 [纬度, 经度] 格式
    const path = route.geometry.coordinates.map((coord: [number, number]) => 
      [coord[1], coord[0]] as [number, number]
    );
    
    return {
      path: path,
      distance: route.distance,
      duration: route.duration
    };
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    return null;
  }
};

/**
 * 调用OSRM trip接口获取优化的最短路径（解决旅行商问题）
 * @param coordinates 坐标数组，格式为 [[纬度, 经度], [纬度, 经度], ...]
 * @returns 包含优化后的路径、距离、时间和优化顺序的对象，失败时返回null
 */
export const getOSRMTripRoute = async (coordinates: [number, number][]): Promise<{
  path: [number, number][];
  distance: number;
  duration: number;
  optimizedOrder: number[];
} | null> => {
  try {
    if (coordinates.length < 2) {
      return null;
    }
    
    // OSRM API需要的格式是 lon,lat;lon,lat
    const coordinatesStr = coordinates
      .map(coord => `${coord[1]},${coord[0]}`) // 转换为 lon,lat 格式
      .join(';');
    
    // 使用OSRM trip接口，专门用于解决旅行商问题
    const url = `https://router.project-osrm.org/trip/v1/walking/${coordinatesStr}?overview=full&geometries=geojson&source=first&destination=last`;
    
    // 设置超时时间为10秒，防止大规模计算时被误杀
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OSRM trip API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 检查API响应是否成功
    if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
      console.warn('OSRM trip API returned invalid response:', data.code);
      return null;
    }
    
    const trip = data.trips[0];
    
    // 将OSRM返回的坐标转换为 [纬度, 经度] 格式
    const path = trip.geometry.coordinates.map((coord: [number, number]) => 
      [coord[1], coord[0]] as [number, number]
    );
    
    // 获取优化后的顺序，data.waypoints包含原始索引
    const optimizedOrder = data.waypoints
      .map((wp: any) => wp.waypoint_index)
      .filter((idx: number) => idx >= 0); // 过滤掉-1（如果有的话）
    
    return {
      path: path,
      distance: trip.distance,
      duration: trip.duration,
      optimizedOrder: optimizedOrder
    };
  } catch (error) {
    console.error('Error fetching OSRM trip route:', error);
    return null;
  }
};

/**
 * 格式化距离，转换为合适的单位（米或公里）
 * @param distance 距离（米）
 * @returns 格式化后的距离字符串
 */
export const formatOSRMDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}米`;
  }
  return `${(distance / 1000).toFixed(1)}公里`;
};

/**
 * 格式化时间，转换为小时和分钟
 * @param seconds 时间（秒）
 * @returns 格式化后的时间字符串，格式为'X小时X分钟'或'X分钟'
 */
export const formatTime = (seconds: number): string => {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${hours}小时`;
  }
  return `${minutes}分钟`;
};

/**
 * 计算两点之间的直线距离（单位：米）
 * @param start 起点坐标 [纬度, 经度]
 * @param end 终点坐标 [纬度, 经度]
 * @returns 直线距离（米）
 */
export const calculateStraightDistance = (start: [number, number], end: [number, number]): number => {
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
 * 使用贪心算法（最近邻算法）优化路线顺序
 * @param footprints 足迹数组
 * @returns 优化后的足迹数组
 */
export const optimizeRouteOrder = <T extends { coordinates: [number, number] }>(footprints: T[]): T[] => {
  if (footprints.length <= 2) {
    return footprints;
  }
  
  // 复制足迹数组，避免修改原数组
  const unvisited = [...footprints];
  const optimized: T[] = [];
  
  // 从第一个足迹开始
  optimized.push(unvisited.shift()!);
  
  // 贪心选择最近的下一个足迹
  while (unvisited.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIndex = 0;
    let nearestDistance = calculateStraightDistance(current.coordinates, unvisited[0].coordinates);
    
    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateStraightDistance(current.coordinates, unvisited[i].coordinates);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    
    optimized.push(unvisited.splice(nearestIndex, 1)[0]);
  }
  
  return optimized;
};