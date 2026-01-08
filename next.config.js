/** @type {import('next').NextConfig} */
const nextConfig = {
  // 配置兼容性，避免使用某些浏览器不支持的 ESM 特性
  // 优化构建输出，确保更好的兼容性
  webpack: (config) => {
    // 确保输出的代码兼容性更高
    config.output.environment = {
      ...config.output.environment,
      arrowFunction: true,
      bigIntLiteral: false,
      const: true,
      destructuring: true,
      dynamicImport: true,
      forOf: true,
      module: true,
    };
    
    return config;
  },
  // 确保所有资源使用 HTTPS
  images: {
    domains: ['geolog.example.com'],
  },
  // 配置构建目标
  swcMinify: true,
  // 优化依赖处理
  optimizeFonts: true,
  // 配置生产环境的基础路径
  basePath: '',
  // 配置生产环境的图像加载器
  images: {
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
