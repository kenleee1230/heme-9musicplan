# 🚀 更新到线上环境 - 操作指南

## 快速部署步骤

### 方式一：Firebase Hosting（推荐，已配置）

项目已配置 Firebase Hosting，可以直接部署：

#### 1. 构建生产版本

```bash
npm run build
```

这会生成 `dist/` 目录，包含所有优化后的静态文件。

#### 2. 部署到 Firebase

```bash
# 如果还没登录，先登录
firebase login

# 部署（会自动部署 Hosting 和 Firestore 规则）
firebase deploy
```

或者使用部署脚本（Windows PowerShell）：

```powershell
# 检查登录状态并部署
firebase login
firebase deploy
```

#### 3. 访问线上地址

部署成功后，访问：
- **主域名**: https://heme9music.web.app
- **备用域名**: https://heme9music.firebaseapp.com

---

### 方式二：Netlify（如果使用 Netlify）

#### 1. 通过 Git 自动部署（推荐）

1. 提交代码到 Git：
   ```bash
   git add .
   git commit -m "更新：修复bug并优化移动端体验"
   git push origin main
   ```

2. Netlify 会自动检测到推送并开始构建部署
   - 构建命令：`npm run build`
   - 发布目录：`dist`

3. 在 Netlify Dashboard 查看部署状态

#### 2. 手动部署

```bash
# 构建
npm run build

# 将 dist 目录拖拽到 Netlify 的部署区域
```

---

## 📋 部署前检查清单

### ✅ 代码检查

- [ ] 所有功能已测试通过
- [ ] 没有控制台错误
- [ ] 移动端显示正常
- [ ] 登录功能正常

### ✅ 环境变量

确保线上环境已配置以下变量（Firebase 或 Netlify）：

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### ✅ Firebase 配置

在 [Firebase Console](https://console.firebase.google.com/project/heme9music) 确认：

- [ ] Authentication 已启用（Email/Password）
- [ ] Firestore Database 已创建
- [ ] Firestore 安全规则已配置
- [ ] Hosting 已启用

---

## 🔄 更新部署流程（日常更新）

### 步骤 1: 本地测试

```bash
# 启动开发服务器
npm run dev

# 测试所有功能
# - 登录/注册
# - 添加/编辑/删除歌曲
# - 查看甘特图、时间线、项目进度
# - 查看每日任务（移动端测试）
# - 音乐理论功能
```

### 步骤 2: 构建生产版本

```bash
npm run build
```

### 步骤 3: 预览构建结果（可选）

```bash
npm run preview
```

访问 http://localhost:4173 预览生产版本

### 步骤 4: 部署

**Firebase:**
```bash
firebase deploy
```

**Netlify (Git 方式):**
```bash
git add .
git commit -m "更新描述"
git push origin main
```

---

## 🎯 本次更新内容

本次更新包含以下修复和优化：

1. ✅ 修复登录按钮无反应问题
2. ✅ 添加时间线视图组件
3. ✅ 添加项目进度视图组件
4. ✅ 添加每日任务视图组件（移动端优化）
5. ✅ 添加甘特图组件
6. ✅ 添加和弦知识速查组件
7. ✅ 添加中古调式组件
8. ✅ 优化移动端每日任务显示（类似苹果日历）
9. ✅ 优化移动端适配（按钮大小、表单输入等）

---

## 📝 部署命令速查

### Firebase 部署

```bash
# 登录（首次或需要重新登录时）
firebase login

# 查看当前项目
firebase use

# 部署所有（Hosting + Firestore 规则）
firebase deploy

# 仅部署 Hosting
firebase deploy --only hosting

# 仅部署 Firestore 规则
firebase deploy --only firestore:rules
```

### Netlify 部署

```bash
# Git 方式（自动）
git push origin main

# 手动方式
npm run build
# 然后拖拽 dist 目录到 Netlify
```

---

## ⚠️ 注意事项

1. **环境变量**: 确保线上环境变量已正确配置
2. **Firestore 规则**: 如果修改了 `firestore.rules`，记得重新部署
3. **构建检查**: 部署前先本地构建测试，确保没有错误
4. **缓存清理**: 部署后如果看到旧版本，清除浏览器缓存或使用无痕模式

---

## 🐛 部署后测试

部署完成后，请测试：

- [ ] 页面正常加载
- [ ] 登录/注册功能
- [ ] 添加歌曲功能
- [ ] 查看时间线、项目进度、每日任务
- [ ] 查看甘特图
- [ ] 音乐理论功能（五度圈、和弦进行、和弦知识速查、中古调式）
- [ ] 移动端显示正常
- [ ] PWA 安装功能

---

## 📞 遇到问题？

1. 查看部署日志中的错误信息
2. 检查浏览器控制台的错误
3. 确认 Firebase/Netlify 环境变量配置
4. 参考 `DEPLOYMENT.md` 和 `FIREBASE_DEPLOY.md` 详细文档

