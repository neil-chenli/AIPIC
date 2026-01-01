# 解决 PowerShell 执行策略问题

## 问题说明

PowerShell 默认的执行策略阻止了 npm 脚本的运行，导致无法执行 npm 命令。

## 解决方案

### 方案1：临时绕过执行策略（快速）

在当前 PowerShell 会话中运行：

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

然后正常使用 npm 命令。

### 方案2：使用 cmd 命令提示符（推荐）

不使用 PowerShell，改用 Windows 命令提示符（cmd）：

1. 打开命令提示符（cmd）
2. 运行：
   ```cmd
   cd C:\NeilData\AIPIC\aipic-web\server
   npm install
   ```

### 方案3：修改执行策略（需要管理员权限）

以管理员身份运行 PowerShell，然后：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

这将允许运行本地脚本，但需要管理员权限。

### 方案4：使用 npx 或直接调用 node

```powershell
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
```

## 推荐方案

**最简单的方法**：使用 Windows 命令提示符（cmd）而不是 PowerShell。

1. 按 `Win + R`
2. 输入 `cmd` 并按回车
3. 运行：
   ```cmd
   cd C:\NeilData\AIPIC\aipic-web\server
   npm install
   ```

## 验证

执行策略修改后，验证：

```powershell
Get-ExecutionPolicy
```

如果显示 `Bypass` 或 `RemoteSigned`，说明已修改成功。

