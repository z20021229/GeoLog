// 模拟真实后端的 API

export interface ConnectionTestResult {
  success: boolean;
  message?: string;
}

// 测试主机连接
export const testHostConnection = async (ip: string, username: string, password: string): Promise<ConnectionTestResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟连接成功
      resolve({
        success: true,
        message: '主机连接成功'
      });
    }, 1500);
  });
};

// 测试数据库连接
export const testDatabaseConnection = async (
  ip: string,
  username: string,
  password: string,
  dbDriver: string,
  dbUser: string,
  dbPassword: string
): Promise<ConnectionTestResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟连接成功
      resolve({
        success: true,
        message: '数据库连接成功'
      });
    }, 1500);
  });
};