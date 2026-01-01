# AIPIC - 智能照片管理系统

<div align="center">

![AIPIC Logo](https://img.shields.io/badge/AIPIC-Photo%20Management-0066FF?style=for-the-badge&logo=image&logoColor=white)
[![License](https://img.shields.io/badge/License-MIT-FF6B35?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)

**基于 React + TypeScript 开发的自托管照片管理系统**

支持照片导入、智能检索、相册管理、地图可视化和人脸识别

[功能特性](#功能特性) • [快速开始](#快速开始) • [技术架构](#技术架构) • [开发文档](#开发指南)

</div>

---

## 📋 项目简介

AIPIC 是一个面向家庭用户的本地照片管理解决方案，旨在解决照片分散存储、难以检索、隐私担忧等问题。

### 核心理念

- 🔒 **隐私优先**：本地存储，数据完全可控
- 🚀 **高性能**：支持约3万张照片的高效管理
- 🎯 **多维检索**：按时间、地点、人物、标签智能搜索
- 🌐 **局域网访问**：Windows主机服务 + 手机/PC浏览器访问
- 📦 **可扩展**：模块化设计，支持功能扩展

### 目标场景

- 家庭照片集中管理与归档
- 旅行照片按地理位置整理
- 人物照片自动分类与检索
- 多设备照片同步与备份

---

## ✨ 功能特性

### 已实现
- ✅ 简约科技感UI设计（蓝色+橙色主题）
- ✅ 深浅主题切换
- ✅ 响应式布局（适配手机/平板/桌面）
- ✅ 完整的数据库Schema设计
- ✅ TypeScript类型系统

### 开发中
- 🔄 批量照片导入与管理
- 🔄 EXIF元数据解析
- 🔄 智能去重（Hash + Size）
- 🔄 缩略图自动生成
- 🔄 HEIC格式支持

### 规划中
- 📅 多维度智能检索
- 📅 相册树形组织
- 📅 地理位置可视化（Leaflet地图）
- 📅 人脸检测与聚类
- 📅 标签系统
- 📅 回收站与审计日志

---

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **操作系统**: Windows 10/11（主要支持）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/neil-chenli/AIPIC.git
   cd AIPIC/aipic-web
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **初始化UI组件库**
   ```bash
   npx shadcn@latest init
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   
   打开浏览器访问 http://localhost:5173

### 常见问题

#### PowerShell执行策略错误

如果遇到 `无法加载文件...禁止运行脚本` 错误，请使用 **CMD（命令提示符）** 而非PowerShell。

#### npm命令未找到

确保Node.js已添加到系统PATH：
```cmd
set PATH=%PATH%;C:\Program Files\nodejs
```

#### 依赖安装失败

某些依赖（`better-sqlite3`、`sharp`）需要本地编译工具：
- 安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- 或使用预编译版本：`npm install --prefer-binary`

详细安装指南请查看 [INSTALL_GUIDE.md](./INSTALL_GUIDE.md)

---

## 🛠️ 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint

# TypeScript类型检查
npm run type-check
```

### 添加shadcn/ui组件

```bash
# 添加单个组件
npx shadcn@latest add button

# 添加多个组件
npx shadcn@latest add button input dialog dropdown-menu tabs switch toast

# 查看所有可用组件
npx shadcn@latest add
```

---

## 🏗️ 技术架构

### 技术栈

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| **前端框架** | React 18 + TypeScript | 类型安全的组件化开发 |
| **构建工具** | Vite 5 | 快速的开发服务器和构建 |
| **样式方案** | Tailwind CSS + shadcn/ui | 原子化CSS + 高质量组件库 |
| **路由** | React Router v6 | 客户端路由管理 |
| **数据库** | SQLite (better-sqlite3) | 轻量级本地数据库 |
| **图片处理** | Sharp | 高性能图片缩略图生成 |
| **地图** | Leaflet | 开源地图可视化库 |
| **人脸识别** | face-api.js | 浏览器端轻量级人脸检测 |

### 数据库设计

```
photos          # 照片主表（含EXIF、GPS、原始文件名）
├── thumbnails  # 缩略图（多尺寸）
├── albums      # 相册（树形结构）
├── tags        # 标签（树形结构）
├── faces       # 人脸检测结果
├── persons     # 人物聚类
└── import_tasks # 导入任务状态
```

---

## 🎨 设计系统

### 色彩方案

```css
/* 主色调 */
--primary-blue: #0066FF;
--accent-orange: #FF6B35;

/* 浅色模式 */
--bg-light: #FFFFFF;
--surface-light: #F7F8FA;

/* 深色模式 */
--bg-dark: #0F172A;
--surface-dark: #1E293B;
```

### 视觉风格

- **简约科技感**：扁平化设计 + 玻璃态效果
- **流畅动画**：微交互动画提升体验
- **响应式布局**：自适应不同屏幕尺寸

---

## 📁 项目结构

```
aipic-web/
├── src/
│   ├── components/              # React组件
│   │   ├── ui/                 # shadcn/ui基础组件
│   │   ├── Layout.tsx          # 整体布局
│   │   ├── Sidebar.tsx         # 侧边导航栏
│   │   └── Header.tsx          # 顶部栏
│   ├── pages/                  # 页面组件
│   │   ├── PhotosPage.tsx      # 照片库（网格/列表视图）
│   │   ├── AlbumsPage.tsx      # 相册管理
│   │   ├── MapPage.tsx         # 地图视图
│   │   └── FacesPage.tsx       # 人物管理
│   ├── contexts/               # React Context
│   │   └── ThemeContext.tsx    # 主题切换
│   ├── lib/                    # 核心逻辑
│   │   ├── db/                # 数据库层
│   │   │   ├── connection.ts  # 数据库连接
│   │   │   ├── schema.sql     # 数据库Schema
│   │   │   └── repositories/  # Repository层
│   │   └── utils.ts           # 工具函数
│   ├── types/                  # TypeScript类型定义
│   │   ├── photo.ts
│   │   ├── album.ts
│   │   ├── tag.ts
│   │   ├── face.ts
│   │   └── import.ts
│   ├── App.tsx                 # 应用根组件
│   ├── main.tsx                # React入口
│   └── index.css               # 全局样式
├── public/                     # 静态资源
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 👨‍💻 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（热重载）
npm run dev

# TypeScript类型检查
npm run build

# 代码检查
npm run lint
```

### 项目规范

#### 目录结构约定

```
src/
├── components/          # 可复用组件
│   ├── ui/             # shadcn/ui基础组件（不要手动修改）
│   └── [Feature]/      # 功能组件（按功能分组）
├── pages/              # 页面组件（一个文件一个页面）
├── lib/                # 核心逻辑
│   ├── db/            # 数据库相关
│   ├── utils.ts       # 工具函数
│   └── constants.ts   # 常量定义
├── types/              # TypeScript类型定义
├── contexts/           # React Context
├── hooks/              # 自定义Hooks
└── styles/             # 全局样式
```

#### 命名规范

- **组件文件**：PascalCase（如 `PhotoCard.tsx`）
- **工具文件**：camelCase（如 `formatDate.ts`）
- **常量**：UPPER_SNAKE_CASE（如 `MAX_FILE_SIZE`）
- **接口/类型**：PascalCase（如 `Photo`, `Album`）
- **函数**：camelCase（如 `getPhotoById`）

#### 组件开发

**✅ 推荐：函数式组件 + Hooks**

```tsx
import { useState, useEffect } from 'react';

interface PhotoCardProps {
  photo: Photo;
  onSelect?: (id: number) => void;
}

export function PhotoCard({ photo, onSelect }: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(photo.id)}
    >
      {/* ... */}
    </div>
  );
}
```

**❌ 避免：类组件**

```tsx
// 不推荐使用类组件
class PhotoCard extends React.Component { ... }
```

#### 样式规范

**✅ 推荐：Tailwind CSS**

```tsx
<div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
  {/* ... */}
</div>
```

**❌ 避免：自定义CSS**

```css
/* 避免创建 .css 文件 */
.photo-card {
  display: flex;
  padding: 1rem;
  /* ... */
}
```

#### 状态管理

- **简单状态**：使用 `useState`
- **复杂状态**：使用 `useReducer`
- **全局状态**：使用 React Context
- **服务端状态**：考虑使用 React Query（可选）

```tsx
// 简单状态
const [count, setCount] = useState(0);

// 复杂状态
const [state, dispatch] = useReducer(reducer, initialState);

// 全局状态
const { theme, setTheme } = useTheme();
```

### 数据库操作

#### Repository模式

```typescript
// lib/db/repositories/PhotoRepository.ts
export class PhotoRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  findById(id: number): Photo | null {
    const stmt = this.db.prepare('SELECT * FROM photos WHERE id = ?');
    return stmt.get(id) as Photo | null;
  }

  findAll(limit = 100, offset = 0): Photo[] {
    const stmt = this.db.prepare('SELECT * FROM photos LIMIT ? OFFSET ?');
    return stmt.all(limit, offset) as Photo[];
  }

  create(photo: Omit<Photo, 'id'>): Photo {
    const stmt = this.db.prepare(`
      INSERT INTO photos (hash, original_filename, file_path, ...)
      VALUES (?, ?, ?, ...)
    `);
    const result = stmt.run(...Object.values(photo));
    return { ...photo, id: result.lastInsertRowid as number };
  }
}
```

#### 使用Repository

```typescript
import { getDatabase } from '@/lib/db/connection';
import { PhotoRepository } from '@/lib/db/repositories/PhotoRepository';

const db = getDatabase();
const photoRepo = new PhotoRepository(db);

// 查询
const photo = photoRepo.findById(1);
const photos = photoRepo.findAll(20, 0);

// 创建
const newPhoto = photoRepo.create({
  hash: 'abc123...',
  original_filename: 'IMG_001.jpg',
  // ...
});
```

### TypeScript类型

#### 定义类型

```typescript
// types/photo.ts
export interface Photo {
  id: number;
  hash: string;
  original_filename: string;
  file_path: string;
  size: number;
  mime_type: string;
  width?: number;
  height?: number;
  taken_at?: string;
  latitude?: number;
  longitude?: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export type PhotoCreateInput = Omit<Photo, 'id' | 'created_at' | 'updated_at'>;
export type PhotoUpdateInput = Partial<PhotoCreateInput>;
```

#### 使用类型

```typescript
import type { Photo, PhotoCreateInput } from '@/types/photo';

function createPhoto(input: PhotoCreateInput): Photo {
  // ...
}

const photos: Photo[] = [];
```

### 性能优化

#### 虚拟滚动

对于大量照片，使用虚拟滚动：

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function PhotoGrid({ photos }: { photos: Photo[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: photos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250, // 每项高度
    overscan: 5, // 预渲染项数
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((item) => (
          <PhotoCard key={item.key} photo={photos[item.index]} />
        ))}
      </div>
    </div>
  );
}
```

#### 懒加载图片

```tsx
import { useState, useEffect, useRef } from 'react';

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsLoaded(true);
        observer.disconnect();
      }
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : '/placeholder.jpg'}
      alt={alt}
      loading="lazy"
    />
  );
}
```

### 测试（规划中）

```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage

# 端到端测试
npm run test:e2e
```

---

## 🎨 设计系统

### 色彩方案

```css
/* Tailwind配置 */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066FF',
          50: '#E6F0FF',
          100: '#CCE0FF',
          500: '#0066FF',
          600: '#0052CC',
          700: '#003D99',
        },
        accent: {
          DEFAULT: '#FF6B35',
          50: '#FFE8E0',
          100: '#FFD1C1',
          500: '#FF6B35',
          600: '#E65528',
          700: '#CC3F1B',
        },
      },
    },
  },
};
```

### 组件样式

#### 按钮

```tsx
import { Button } from '@/components/ui/button';

// 主按钮
<Button variant="default">上传照片</Button>

// 次要按钮
<Button variant="secondary">取消</Button>

// 危险按钮
<Button variant="destructive">删除</Button>

// 图标按钮
<Button variant="ghost" size="icon">
  <IconTrash />
</Button>
```

#### 卡片

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold mb-2">标题</h3>
  <p className="text-gray-600 dark:text-gray-300">内容</p>
</div>
```

#### 输入框

```tsx
import { Input } from '@/components/ui/input';

<Input 
  type="text" 
  placeholder="搜索照片..." 
  className="w-full"
/>
```

### 图标使用

```tsx
import { 
  Search, 
  Upload, 
  Trash2, 
  Download,
  Settings 
} from 'lucide-react';

<Search className="w-5 h-5 text-gray-500" />
<Upload className="w-6 h-6 text-primary" />
```

### 动画

```tsx
// 淡入
<div className="animate-in fade-in duration-300">...</div>

// 滑入
<div className="animate-in slide-in-from-bottom duration-500">...</div>

// 自定义过渡
<div className="transition-all duration-300 hover:scale-105 hover:shadow-xl">
  ...
</div>
```

---

## 🗺️ 开发路线图

### Sprint 1：基础设施（已完成）
- [x] 项目初始化
- [x] UI设计系统
- [x] 数据库Schema设计
- [x] TypeScript类型定义

### Sprint 2：照片导入（进行中）
- [ ] 文件扫描与导入
- [ ] EXIF元数据解析
- [ ] 智能去重（Hash + Size）
- [ ] 缩略图生成（多尺寸）
- [ ] HEIC格式支持
- [ ] 导入过滤机制（黑名单）

### Sprint 3：浏览与检索
- [ ] 照片网格/列表视图
- [ ] 瀑布流布局
- [ ] 时间轴视图
- [ ] 多维度筛选器
- [ ] 全文搜索

### Sprint 4：相册与标签
- [ ] 相册CRUD
- [ ] 树形相册结构
- [ ] 标签管理
- [ ] 批量操作

### Sprint 5：地图与可视化
- [ ] Leaflet地图集成
- [ ] GPS点位展示
- [ ] 热力图
- [ ] 地理聚类

### Sprint 6：人脸识别
- [ ] 人脸检测
- [ ] 人脸聚类
- [ ] 人物命名
- [ ] 关系图谱

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

### 开发流程

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 创建Pull Request

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 📮 联系方式

- **GitHub Issues**: [提交问题](https://github.com/neil-chenli/AIPIC/issues)
- **项目主页**: [AIPIC on GitHub](https://github.com/neil-chenli/AIPIC)

---

## 🙏 致谢

- [React](https://reactjs.org/) - UI框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [Leaflet](https://leafletjs.com/) - 地图库
- [Sharp](https://sharp.pixelplumbing.com/) - 图片处理

---

<div align="center">
  <sub>Built with ❤️ by Neil Chen</sub>
</div>
