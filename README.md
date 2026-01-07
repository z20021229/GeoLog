# GeoLog

面向旅行者和地理爱好者的软件，基于 Next.js 构建，提供地图可视化和足迹管理功能。

## 核心功能

- 左侧可折叠的响应式侧边栏，包含搜索和足迹列表
- 右侧全屏 Leaflet 地图，使用 CartoDB Dark Matter 风格
- 深色模式适配，呈现专业、深邃的 GIS 软件感
- 足迹管理和搜索功能

## 技术栈

- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件库**: Shadcn UI
- **图标**: Lucide-React
- **地图**: Leaflet + react-leaflet

## 关键技术点

- 使用 `next/dynamic` 动态导入地图组件，避免 SSR 导致的 'window is not defined' 错误
- 配置 CartoDB Dark Matter 风格地图图层
- 实现响应式可折叠侧边栏
- 深色模式主题设计

## 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 全局布局
│   ├── page.tsx            # 主页面
│   └── globals.css         # 全局样式
├── components/
│   ├── Sidebar/            # 侧边栏组件
│   │   └── index.tsx
│   └── Map/                # 地图组件
│       └── index.tsx
└── utils/
```

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 地图配置

项目使用 CartoDB Dark Matter 风格的地图图层，配置如下：

```typescript
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  subdomains={['a', 'b', 'c', 'd']}
/>
```

## 深色模式

项目默认使用深色模式，在 `layout.tsx` 中配置：

```typescript
<html lang="zh-CN" className="dark">
```

## 注意事项

- 地图组件使用 `next/dynamic` 进行客户端渲染，确保在浏览器环境中加载
- 项目使用了 Tailwind CSS 的深色模式配置，需要在 `tailwind.config.ts` 中启用
- 确保在 `globals.css` 中正确导入 Leaflet CSS

## 许可证

MIT
