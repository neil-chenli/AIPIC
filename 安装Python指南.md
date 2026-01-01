# Python 安装指南

## 当前状态

系统检测到 WindowsApps 中的 Python 存根，但未找到可用的 Python 安装。

## 安装步骤

### 1. 下载 Python

访问 Python 官网：https://www.python.org/downloads/

下载 Python 3.11 或 3.12 版本（推荐 3.11）

### 2. 安装 Python

1. 运行下载的安装程序
2. **重要**：勾选 "Add Python to PATH" 选项
3. 选择 "Install Now" 或 "Customize installation"
4. 完成安装

### 3. 验证安装

打开新的 PowerShell 窗口，运行：

```powershell
python --version
```

应该显示类似：`Python 3.11.x`

### 4. 配置 npm 使用 Python

```powershell
cd C:\NeilData\AIPIC\aipic-web\server
npm config set python python
```

### 5. 重新安装 better-sqlite3

```powershell
npm install better-sqlite3
```

### 6. 安装所有依赖

```powershell
npm install
```

### 7. 启动服务器

```powershell
npm run dev
```

## 快速安装命令（如果已安装但未配置PATH）

如果 Python 已安装但未添加到 PATH，可以手动指定：

```powershell
cd C:\NeilData\AIPIC\aipic-web\server

# 假设Python安装在默认位置
$pythonPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\python.exe"
# 或者
# $pythonPath = "C:\Program Files\Python311\python.exe"

# 设置环境变量
$env:PYTHON = $pythonPath

# 安装依赖
npm install
```

## 验证 Python 安装位置

运行以下命令查找 Python：

```powershell
# 查找所有可能的Python安装
Get-ChildItem "C:\Program Files\Python*" -Recurse -Filter "python.exe" -ErrorAction SilentlyContinue
Get-ChildItem "C:\Users\$env:USERNAME\AppData\Local\Programs\Python*" -Recurse -Filter "python.exe" -ErrorAction SilentlyContinue
```

## 替代方案

如果不想安装 Python，可以尝试：

1. 使用预编译的 better-sqlite3 二进制文件
2. 使用 Docker 容器运行项目
3. 使用 WSL (Windows Subsystem for Linux)

