// 自动地址识别工具 - 使用 OpenStreetMap Nominatim API

// 坐标类型
export type Coordinates = [number, number];

// 地址数据结构
export interface AddressData {
  name: string;        // 地点名称
  address: string;     // 详细地址
  city: string;         // 城市
  country: string;      // 国家
  postalCode: string;   // 邮政编码
}

/**
 * 通过经纬度获取地址信息（反向地理编码）
 * @param coordinates 经纬度坐标 [纬度, 经度]
 * @returns 地址数据
 */
export const getAddressFromCoordinates = async (coordinates: Coordinates): Promise<AddressData | null> => {
  try {
    const [latitude, longitude] = coordinates;
    
    // 构建 OpenStreetMap Nominatim API 请求 URL
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=zh-CN`;
    
    // 发送请求
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoLogApp/1.0',
      },
    });
    
    // 检查响应状态
    if (!response.ok) {
      console.error('获取地址信息失败:', response.status);
      return null;
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 提取地址信息
    const address = data.address || {};
    
    // 构建完整地址
    const fullAddress = [
      address.road || '',
      address.house_number || '',
      address.suburb || '',
      address.city || address.town || address.village || '',
      address.state || '',
      address.country || '',
    ].filter(Boolean).join(', ');
    
    // 构建地址数据对象
    const addressData: AddressData = {
      name: data.display_name || '未知地点',
      address: fullAddress,
      city: address.city || address.town || address.village || '',
      country: address.country || '',
      postalCode: address.postcode || '',
    };
    
    return addressData;
  } catch (error) {
    console.error('获取地址信息时发生错误:', error);
    return null;
  }
};

/**
 * 格式化地址，提取主要部分
 * @param addressData 地址数据
 * @returns 格式化后的地址字符串
 */
export const formatAddress = (addressData: AddressData): string => {
  // 优先使用详细地址，如果没有则使用城市和国家
  if (addressData.address) {
    return addressData.address;
  }
  
  return [
    addressData.city,
    addressData.country,
  ].filter(Boolean).join(', ');
};
