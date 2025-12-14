# 版本更新机制说明

## 📋 概述

为了解决用户不清缓存或不用无痕模式导致无法获取最新版本的问题，我们实现了完整的版本检查和强制更新机制。

## 🔧 实现的功能

### 1. 版本号管理
- 从 `package.json` 自动读取版本号
- 构建时注入到应用中
- 存储在 localStorage 中用于版本比较

### 2. 自动版本检查
- **应用启动时检查**：检测版本变化，如有新版本自动提示
- **定期检查**：每5分钟检查一次更新
- **页面可见时检查**：当用户切换回页面时检查更新
- **网络连接时检查**：网络恢复时自动检查

### 3. Service Worker 更新
- 配置为 `prompt` 模式，更积极地提示更新
- `skipWaiting: true` - 新版本立即激活
- `clientsClaim: true` - 立即控制所有客户端
- 缓存名称包含版本号，确保版本更新时清除旧缓存

### 4. 更新提示组件
- 友好的更新提示界面
- 显示当前版本和新版本
- 支持立即更新或稍后提醒

### 5. 强制更新机制
- 检测到新版本时，清除所有缓存
- 自动刷新页面加载新版本
- 无需用户手动清除缓存

## 📁 相关文件

### 核心文件
- `src/utils/version.js` - 版本检查和管理逻辑
- `src/components/Common/UpdatePrompt.vue` - 更新提示组件
- `vite.config.js` - 构建配置，注入版本号
- `src/main.js` - 应用入口，初始化版本检查

### 配置说明

#### vite.config.js
```javascript
define: {
  __APP_VERSION__: JSON.stringify(appVersion) // 注入版本号
}
```

#### PWA 配置
```javascript
VitePWA({
  registerType: 'prompt', // 积极提示更新
  workbox: {
    skipWaiting: true,    // 新版本立即激活
    clientsClaim: true,   // 立即控制所有客户端
    cacheId: `pattr-v${appVersion}` // 版本化缓存名称
  }
})
```

## 🚀 使用方式

### 更新版本号
1. 修改 `package.json` 中的 `version` 字段
2. 构建应用：`npm run build`
3. 部署到服务器

### 版本检查流程
1. 用户打开应用
2. 系统检查 localStorage 中的版本号
3. 如果版本号不同，显示更新提示
4. 用户点击"立即更新"或5秒后自动更新
5. 清除缓存并刷新页面

## 🔍 调试

### 查看版本信息
打开浏览器控制台，可以看到：
```
[Version] 当前应用版本: 3.0.0
[Version] 检测到版本变化: { stored: '2.9.0', current: '3.0.0' }
```

### 手动触发更新检查
在浏览器控制台执行：
```javascript
// 清除版本号，模拟首次运行
localStorage.removeItem('pattr_app_version')
// 刷新页面
location.reload()
```

### 测试更新机制
1. 修改 `package.json` 中的版本号（如从 3.0.0 改为 3.0.1）
2. 构建应用
3. 部署到服务器
4. 在浏览器中清除版本号：`localStorage.removeItem('pattr_app_version')`
5. 刷新页面，应该看到更新提示

## ⚠️ 注意事项

1. **版本号格式**：使用语义化版本号（如 3.0.0）
2. **缓存策略**：每次版本更新都会清除旧缓存
3. **用户体验**：更新提示不会打断用户操作，5秒后才自动更新
4. **兼容性**：需要支持 Service Worker 的现代浏览器

## 🐛 常见问题

### Q: 用户仍然看到旧版本？
A: 检查以下几点：
1. 确认 `package.json` 中的版本号已更新
2. 确认已重新构建并部署
3. 检查 Service Worker 是否正常工作
4. 尝试手动清除浏览器缓存

### Q: 更新提示不显示？
A: 检查：
1. 浏览器控制台是否有错误
2. localStorage 中是否有 `pattr_app_version` 键
3. 版本号是否正确注入

### Q: 如何强制所有用户更新？
A: 可以：
1. 修改版本号并部署
2. 在服务器端设置适当的缓存头（no-cache）
3. 使用 CDN 的缓存清除功能

## 📝 更新日志

- **2025-01-XX**: 初始实现版本检查和强制更新机制
- 支持自动版本检测
- 支持 Service Worker 更新
- 添加友好的更新提示界面

