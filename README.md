# let'sgetpattern - 音乐制作人日程规划助手 (Vue 3版)

专为音乐制作人设计的日程规划和进度跟踪工具，帮助制作人高效管理音乐制作项目。

## 🚀 技术栈

- **Vue 3** - 使用 Composition API
- **Vite** - 极速构建工具
- **Pinia** - 状态管理
- **Firebase** - 认证和云端存储
  - Authentication (邮箱/密码登录)
  - Firestore (云端数据库)
- **PWA** - 渐进式 Web 应用，可安装到桌面
- **Netlify** - 前端部署

## ✨ 功能特点

### 📅 日程规划模块
- 🎵 歌曲管理：添加、编辑、删除歌曲
- 📊 进度跟踪：实时显示任务完成情况
- ⏱️ 计时器：跟踪每首歌的实际工作时长
- 📈 统计信息：剩余天数、已完成、进行中、总进度
- 💡 编曲/混音小知识：随机展示制作技巧
- 💾 数据备份：支持导入导出

### 🎵 音乐理论模块
- 🎼 五度圈：可视化五度圈，支持和弦播放
- 🎹 常见和弦进行：12个调性的常用和弦进行
- 📚 和弦知识速查

### 🔐 账号系统
- 邮箱/密码登录注册
- 云端数据同步
- 离线优先，登录后自动合并本地和云端数据

## 🛠️ 本地开发

### 前置条件
- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置 Firebase

1. 在 [Firebase Console](https://console.firebase.google.com/) 创建项目
2. 启用 Authentication (Email/Password)
3. 创建 Firestore 数据库
4. 复制 Firebase 配置

创建 `.env.local` 文件：

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firestore 安全规则

在 Firebase Console 的 Firestore 规则中配置：

```
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

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 🌐 部署到 Netlify

### 方式一：通过 Git 连接

1. 将代码推送到 GitHub/GitLab
2. 在 [Netlify](https://netlify.com) 创建新站点
3. 连接你的 Git 仓库
4. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 添加环境变量（所有 `VITE_FIREBASE_*` 变量）
6. 部署！

### 方式二：手动部署

```bash
npm run build
# 将 dist 目录拖拽到 Netlify 的部署区域
```

## 📱 PWA 安装

在支持的浏览器中（Chrome, Edge, Safari），你可以将应用安装到：
- 桌面（Windows, macOS, Linux）
- 手机主屏幕（iOS, Android）

安装后即可离线使用，数据在有网络时自动同步。

## 🎯 使用说明

### 基本操作

1. 首次使用建议先设置项目开始日期
2. 点击"添加新歌"创建第一首歌
3. 填写歌曲信息，包括名称、曲风、预计时长等
4. 勾选已完成的任务，记录进度
5. 使用计时器跟踪实际工作时长

### 账号和同步

- **未登录**：数据仅保存在本地浏览器
- **登录后**：数据自动同步到云端，可在多设备访问
- **首次登录**：会自动合并本地和云端数据（以最新时间为准）

### 数据备份

建议定期使用"导出备份"功能保存数据到本地文件，以防万一。

## 📂 项目结构

```
musicplan/
├── src/
│   ├── components/       # Vue 组件
│   │   ├── Auth/        # 认证相关组件
│   │   ├── Common/      # 通用组件
│   │   ├── Schedule/    # 日程规划组件
│   │   └── Theory/      # 音乐理论组件
│   ├── composables/     # 组合式函数
│   ├── config/          # 配置文件
│   ├── stores/          # Pinia 状态管理
│   ├── styles/          # 全局样式
│   ├── utils/           # 工具函数
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── public/              # 静态资源
├── .env.example         # 环境变量模板
├── index.html           # HTML 入口
├── vite.config.js       # Vite 配置
├── netlify.toml         # Netlify 部署配置
└── package.json         # 项目依赖
```

## 🐛 常见问题

### Firebase 连接失败
检查 `.env.local` 文件中的 Firebase 配置是否正确。

### PWA 无法安装
确保应用已通过 HTTPS 部署（Netlify 自动提供）。

### 数据同步失败
检查 Firestore 安全规则是否正确配置。

## 📝 设计理念

> To HEMe Records 未来制作人：
> 我们制作的是有其命运轨迹的东西，我们无法保证它「好运」，但我们可以保证它「是当下我能做到的最好」，且「品质越来越好」。它们的任何进步，源于我们自己的进步。

## 📄 License

MIT

## 🙏 致谢

感谢所有为音乐创作努力的制作人们。
