# AIPIC 安装指南

## 前置要求

### 1. 安装 Node.js

**Windows 系统安装步骤：**

#### 方法一：官方安装包（推荐）

1. 访问 Node.js 官网：https://nodejs.org/
2. 下载 **LTS 版本**（推荐 20.x）
3. 运行 `.msi` 安装程序
4. 安装过程中保持默认选项，确保勾选：
   - ✅ Add to PATH
   - ✅ Install npm package manager
5. 安装完成后，**重启 PowerShell** 或命令提示符

#### 方法二：使用 Winget

如果您的 Windows 11 已安装 winget：

\`\`\`powershell
winget install OpenJS.NodeJS.LTS
\`\`\`

#### 方法三：使用 Chocolatey

如果您已安装 Chocolatey 包管理器：

\`\`\`powershell
choco install nodejs-lts
\`\`\`

### 2. 验证安装

安装完成后，打开**新的** PowerShell 窗口，运行：

\`\`\`powershell
node --version
# 应输出：v20.x.x

npm --version
# 应输出：10.x.x
\`\`\`

如果显示版本号，说明安装成功！

---

## 项目安装

### 1. 进入项目目录

\`\`\`powershell
cd c:\\NeilData\\AIPIC\\aipic-web
\`\`\`

### 2. 安装依赖

\`\`\`powershell
npm install
\`\`\`

这个过程可能需要 3-5 分钟，请耐心等待。

### 3. 初始化 shadcn/ui 组件

\`\`\`powershell
npx shadcn@latest init
\`\`\`

安装向导会询问一些问题，请按以下选择：

- Would you like to use TypeScript? › **Yes**
- Which style would you like to use? › **New York**
- Which color would you like to use as base color? › **Zinc**
- Where is your global CSS file? › **src/index.css**
- Would you like to use CSS variables for colors? › **Yes**
- Are you using a custom tailwind prefix? › **No**
- Where is your tailwind.config.js located? › **tailwind.config.js**
- Configure the import alias for components? › **@/components**
- Configure the import alias for utils? › **@/lib/utils**

### 4. 添加必需的 shadcn/ui 组件

\`\`\`powershell
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add switch
npx shadcn@latest add toast
npx shadcn@latest add scroll-area
npx shadcn@latest add select
\`\`\`

### 5. 创建数据目录

\`\`\`powershell
mkdir data
\`\`\`

---

## 启动项目

### 开发模式

\`\`\`powershell
npm run dev
\`\`\`

启动成功后，访问：**http://localhost:3000**

您将看到 AIPIC 的照片管理界面！

### 生产构建

\`\`\`powershell
npm run build
npm run preview
\`\`\`

---

## 常见问题

### Q1: "npm"不是内部或外部命令

**原因**：Node.js 未安装或未添加到 PATH

**解决方案**：
1. 重新安装 Node.js，确保勾选 "Add to PATH"
2. 重启 PowerShell
3. 如果仍然不行，手动添加到 PATH：
   - 搜索"环境变量" → 编辑系统环境变量
   - 系统变量 → Path → 新建
   - 添加：`C:\\Program Files\\nodejs`

### Q2: npm install 报错

**解决方案**：
\`\`\`powershell
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -r -force node_modules
rm package-lock.json

# 重新安装
npm install
\`\`\`

### Q3: 端口被占用

**解决方案**：
修改 `vite.config.ts` 中的端口号：
\`\`\`typescript
server: {
  port: 3001, // 改为其他端口
}
\`\`\`

### Q4: 权限错误

**解决方案**：
以管理员身份运行 PowerShell：
\`\`\`powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
\`\`\`

---

## 下一步

项目启动后，您可以：

1. 📸 浏览照片库页面
2. 📁 创建和管理相册
3. 🌓 切换深浅主题
4. 🔍 使用搜索功能

后续开发将添加：
- ✨ 照片导入功能
- 🗺️ 地图可视化
- 👤 人脸识别
- 🏷️ 智能标签

---

## 技术支持

如遇到其他问题，请检查：
- Node.js 版本是否 >= 18
- 网络连接是否正常
- 防火墙是否阻止了 npm

祝您使用愉快！🎉
