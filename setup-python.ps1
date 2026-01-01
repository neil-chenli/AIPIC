# AIPIC 项目 Python 配置脚本
# 此脚本用于配置 Python 环境以编译 better-sqlite3

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AIPIC 项目 Python 配置" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Python 是否已安装
Write-Host "正在检查 Python 安装..." -ForegroundColor Yellow

$pythonFound = $false
$pythonPath = $null

# 检查常见安装位置
$searchPaths = @(
    "C:\Program Files\Python*",
    "C:\Program Files (x86)\Python*",
    "$env:LOCALAPPDATA\Programs\Python\Python*",
    "$env:USERPROFILE\AppData\Local\Programs\Python\Python*"
)

foreach ($path in $searchPaths) {
    $pythons = Get-ChildItem $path -Recurse -Filter "python.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pythons) {
        $pythonPath = $pythons.FullName
        $pythonFound = $true
        Write-Host "找到 Python: $pythonPath" -ForegroundColor Green
        
        # 验证 Python 版本
        try {
            $version = & $pythonPath --version 2>&1
            Write-Host "Python 版本: $version" -ForegroundColor Green
        } catch {
            Write-Host "无法验证 Python 版本" -ForegroundColor Yellow
        }
        break
    }
}

# 检查 PATH 中的 Python
if (-not $pythonFound) {
    try {
        $version = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonPath = "python"
            $pythonFound = $true
            Write-Host "找到 Python (在 PATH 中): $version" -ForegroundColor Green
        }
    } catch {
        # Python 不在 PATH 中
    }
}

if (-not $pythonFound) {
    Write-Host ""
    Write-Host "未找到 Python 安装！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请按照以下步骤安装 Python:" -ForegroundColor Yellow
    Write-Host "1. 访问: https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "2. 下载 Python 3.11 或 3.12" -ForegroundColor White
    Write-Host "3. 运行安装程序，**重要**: 勾选 'Add Python to PATH'" -ForegroundColor White
    Write-Host "4. 完成安装后，重新运行此脚本" -ForegroundColor White
    Write-Host ""
    Write-Host "或者，如果您知道 Python 的安装路径，可以手动设置:" -ForegroundColor Cyan
    Write-Host '  $env:PYTHON = "C:\Path\To\Python\python.exe"' -ForegroundColor Gray
    Write-Host "  npm config set python `$env:PYTHON" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# 配置 npm 使用 Python
Write-Host ""
Write-Host "正在配置 npm..." -ForegroundColor Yellow

if ($pythonPath -ne "python") {
    # 设置环境变量
    $env:PYTHON = $pythonPath
    Write-Host "设置环境变量 PYTHON = $pythonPath" -ForegroundColor Green
    
    # 配置 npm
    npm config set python $pythonPath
    Write-Host "已配置 npm 使用: $pythonPath" -ForegroundColor Green
} else {
    npm config set python python
    Write-Host "已配置 npm 使用系统 Python" -ForegroundColor Green
}

# 验证配置
Write-Host ""
Write-Host "验证配置..." -ForegroundColor Yellow
$configuredPython = npm config get python
Write-Host "npm 配置的 Python: $configuredPython" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  配置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "1. 进入服务器目录: cd aipic-web\server" -ForegroundColor White
Write-Host "2. 安装依赖: npm install" -ForegroundColor White
Write-Host "3. 启动服务器: npm run dev" -ForegroundColor White
Write-Host ""

