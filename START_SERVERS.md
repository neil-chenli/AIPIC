# 启动项目指南

## 方式一：使用两个终端窗口

### 终端1：启动后端服务器
```powershell
cd C:\NeilData\AIPIC\aipic-web\server
npm run dev
```

后端服务器将在 `http://localhost:3001` 启动

### 终端2：启动前端开发服务器
```powershell
cd C:\NeilData\AIPIC\aipic-web
npm run dev
```

前端开发服务器将在 `http://localhost:5173` 启动（或Vite自动分配的端口）

## 方式二：使用PowerShell后台任务

已在后台启动了服务器，可以通过以下命令检查状态：

```powershell
# 检查后端服务器
Invoke-WebRequest -Uri http://localhost:3001/health -UseBasicParsing

# 检查前端服务器
Invoke-WebRequest -Uri http://localhost:5173 -UseBasicParsing
```

## 访问应用

- 前端界面：http://localhost:5173
- 后端API：http://localhost:3001/api/v1
- 健康检查：http://localhost:3001/health

## 首次使用

1. 打开浏览器访问 http://localhost:5173
2. 首次运行需要初始化Owner账户：
   - 访问 `/api/v1/auth/init` 端点
   - 或在前端界面完成初始化

## 测试照片导入

使用picDATA目录测试照片导入功能：
```powershell
# 导入路径
C:\NeilData\AIPIC\picDATA
```

## 停止服务器

如果使用后台任务启动，可以通过以下命令停止：

```powershell
# 查找Node进程
Get-Process -Name node

# 停止特定进程
Stop-Process -Id <进程ID>
```

