// 测试OSRM API调用的简单脚本

const fetch = require('node-fetch');

/**
 * 调用OSRM API获取两点之间的步行路径
 * @param start 起点坐标 [纬度, 经度]
 * @param end 终点坐标 [纬度, 经度]
 * @returns 包含路径、距离和时间的对象
 */
async function getWalkingRoute(start, end) {
  try {
    // OSRM API需要的格式是 lon,lat
    const startCoord = `${start[1]},${start[0]}`;
    const endCoord = `${end[1]},${end[0]}`;
    
    const url = `https://router.project-osrm.org/route/v1/walking/${startCoord};${endCoord}?overview=full&geometries=geojson`;
    
    console.log('Calling OSRM API with URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('OSRM API response:', JSON.stringify(data, null, 2));
    
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
}

// 测试北京的两个地点：天安门到故宫
const tiananmen = [39.9042, 116.4074];
const forbiddenCity = [39.9163, 116.3972];

// 运行测试
getWalkingRoute(tiananmen, forbiddenCity)
  .then(result => {
    if (result) {
      console.log('\n测试成功！OSRM API调用返回了有效数据：');
      console.log('总距离:', result.routes[0].distance, '米');
      console.log('总时长:', result.routes[0].duration, '秒');
      console.log('路径点数量:', result.routes[0].geometry.coordinates.length);
    } else {
      console.log('\n测试失败！OSRM API调用没有返回有效数据。');
    }
  })
  .catch(error => {
    console.error('测试过程中发生错误:', error);
  });
