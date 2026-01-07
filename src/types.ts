// 足迹分类类型
export type FootprintCategory = '探店' | '户外' | '城市' | '打卡';

// 足迹数据结构
export interface Footprint {
  id: string;
  name: string;          // 地点名称
  location: string;      // 详细位置
  date: string;          // 日期，格式：YYYY-MM-DD
  description: string;   // 感受/描述
  category: FootprintCategory;  // 分类
  coordinates: [number, number];  // 坐标：[纬度, 经度]
  createdAt: number;     // 创建时间戳
}

// 足迹表单数据
export interface FootprintFormData {
  name: string;
  location: string;
  date: string;
  description: string;
  category: FootprintCategory;
}
