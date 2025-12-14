# 🚀 快速开始 - 本地测试指南

## 1️⃣ 创建 Firebase 项目（可选，如果不需要云同步功能可跳过）

### 方式 A：不使用 Firebase（纯本地测试）

如果你只想测试基本功能，无需登录和云同步，可以跳过 Firebase 配置：

```bash
# 1. 安装依赖
npm install

# 2. 创建一个假的环境变量文件
cat > .env.local << 'EOF'
VITE_FIREBASE_API_KEY=demo
VITE_FIREBASE_AUTH_DOMAIN=demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo
VITE_FIREBASE_STORAGE_BUCKET=demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=demo
EOF

# 3. 启动开发服务器
npm run dev
```

**注意**：使用假配置时，登录功能不可用，但其他功能（添加歌曲、计时器、音乐理论等）都正常工作，数据保存在本地浏览器。

### 方式 B：配置真实 Firebase（完整功能）

如果想测试登录和云同步功能：

#### 步骤 1：创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击 "添加项目"
3. 输入项目名称（例如：musicplan-test）
4. 禁用 Google Analytics（测试不需要）
5. 点击 "创建项目"

#### 步骤 2：启用 Authentication

1. 在 Firebase 控制台，点击左侧菜单 "Authentication"
2. 点击 "开始使用"
3. 在 "Sign-in method" 标签中
4. 点击 "电子邮件地址/密码"
5. 启用第一个开关（电子邮件地址/密码）
6. 点击 "保存"

#### 步骤 3：创建 Firestore 数据库

1. 点击左侧菜单 "Firestore Database"
2. 点击 "创建数据库"
3. 选择 "以测试模式启动"（会自动设置30天有效期的开放规则）
4. 选择地区（例如：asia-east1 - 台湾）
5. 点击 "启用"

#### 步骤 4：获取 Firebase 配置

1. 点击项目概览旁边的齿轮图标 ⚙️
2. 选择 "项目设置"
3. 滚动到 "您的应用" 部分
4. 点击 Web 图标 `</>`
5. 输入应用昵称（例如：musicplan-web）
6. 勾选 "同时为此应用设置 Firebase Hosting"（可选）
7. 点击 "注册应用"
8. 复制配置对象中的值

#### 步骤 5：配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
cat > .env.local << 'EOF'
VITE_FIREBASE_API_KEY=你的apiKey
VITE_FIREBASE_AUTH_DOMAIN=你的项目ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=你的项目ID
VITE_FIREBASE_STORAGE_BUCKET=你的项目ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=你的messagingSenderId
VITE_FIREBASE_APP_ID=你的appId
EOF
```

或手动创建并填入你的配置。

#### 步骤 6：设置安全规则（重要！）

1. 在 Firestore Database 页面
2. 点击 "规则" 标签
3. 替换为以下规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/songs/{songId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/settings/{settingId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. 点击 "发布"

## 2️⃣ 启动开发服务器

```bash
# 确保依赖已安装
npm install

# 启动开发服务器
npm run dev
```

你会看到类似输出：

```
  VITE v5.4.21  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 3️⃣ 在浏览器中测试

打开浏览器访问：http://localhost:5173

### 测试清单

#### 不需要登录的功能 ✅
- [ ] 添加歌曲
- [ ] 编辑歌曲信息
- [ ] 勾选任务进度
- [ ] 删除歌曲
- [ ] 开始/暂停/停止计时器
- [ ] 查看统计数据
- [ ] 设置开始日期
- [ ] 导出数据
- [ ] 导入数据
- [ ] 切换到音乐理论 Tab
- [ ] 点击五度圈播放和弦
- [ ] 选择调性查看和弦进行
- [ ] 播放和弦进行
- [ ] 查看编曲/混音小知识

#### 需要 Firebase 配置的功能 🔐
- [ ] 注册新账号
- [ ] 登录
- [ ] 查看用户邮箱
- [ ] 云端数据同步
- [ ] 登出

## 4️⃣ 常见问题

### Q: 启动后显示 Firebase 错误？
**A:** 检查 `.env.local` 文件是否正确创建，确保所有变量都有值。如果只想测试本地功能，使用方式 A 的假配置即可。

### Q: 登录时显示 "auth/invalid-credential"？
**A:** 
1. 检查 Firebase Authentication 是否已启用
2. 检查邮箱/密码登录方式是否已启用
3. 确保 `.env.local` 中的配置正确

### Q: 数据同步失败？
**A:**
1. 检查 Firestore Database 是否已创建
2. 检查安全规则是否正确设置
3. 在浏览器控制台查看详细错误信息

### Q: 页面显示空白？
**A:**
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签的错误信息
3. 最常见的是环境变量未配置

### Q: 修改代码后不生效？
**A:** Vite 支持热更新，但有时需要手动刷新浏览器（Ctrl+R 或 Cmd+R）

## 5️⃣ 开发调试技巧

### 查看 Vue DevTools

1. 安装 [Vue DevTools](https://devtools.vuejs.org/) 浏览器扩展
2. 打开开发者工具，找到 "Vue" 标签
3. 可以查看组件树、Pinia stores 状态等

### 查看网络请求

1. 打开开发者工具 > Network 标签
2. 可以看到 Firebase API 的请求
3. 检查是否有错误响应

### 查看 Console 日志

代码中有很多 `console.log` 和 `console.error`，可以在 Console 标签查看：
- 登录/注册结果
- 数据同步状态
- Firebase 错误信息

### 查看本地存储

1. 开发者工具 > Application 标签
2. 左侧 Storage > Local Storage > http://localhost:5173
3. 可以看到保存的歌曲数据（`musicplan_songs`）

## 6️⃣ 构建生产版本

测试完成后，可以构建生产版本：

```bash
# 构建
npm run build

# 预览构建结果
npm run preview
```

构建产物在 `dist/` 目录中。

## 7️⃣ 移动端测试

### 在同一网络下的手机访问

```bash
# 启动时使用 --host 参数
npm run dev -- --host
```

然后在手机浏览器访问：`http://你的电脑IP:5173`

### 使用浏览器开发者工具模拟

1. 打开浏览器开发者工具（F12）
2. 点击设备工具栏图标（或 Ctrl+Shift+M）
3. 选择设备型号（iPhone、Samsung 等）
4. 测试响应式布局

## 8️⃣ 数据备份

测试过程中创建的数据会保存在浏览器 localStorage：

- **导出**：点击 Header 中的 "💾 导出备份" 按钮
- **导入**：点击 "📥 导入备份" 按钮，选择之前导出的 JSON 文件

## ✨ 开始使用

准备好了？运行以下命令开始：

```bash
npm run dev
```

然后打开浏览器访问 http://localhost:5173 🎉

---

遇到问题？查看完整文档：
- [README.md](./README.md) - 项目说明
- [docs/README.md](./docs/README.md) - 完整文档索引
- [docs/deployment/PRODUCTION_DEPLOYMENT.md](./docs/deployment/PRODUCTION_DEPLOYMENT.md) - 部署指南
- [docs/archive/PROJECT_SUMMARY.md](./docs/archive/PROJECT_SUMMARY.md) - 项目总结

