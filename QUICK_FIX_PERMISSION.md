# 🔥 快速修复 Firestore 权限错误

## 错误信息
```
FirebaseError: Missing or insufficient permissions.
```

## 🚀 快速修复（3 步）

### 方法 1：使用部署脚本（推荐）

```bash
# 在项目根目录运行
./deploy-firestore-rules.sh
```

### 方法 2：手动部署

```bash
# 1. 登录 Firebase（如果还没登录）
firebase login

# 2. 部署规则
firebase deploy --only firestore:rules

# 3. 等待几秒，然后刷新页面
```

### 方法 3：Firebase 控制台（最简单）

1. 打开 https://console.firebase.google.com/
2. 选择你的项目
3. 点击左侧 **Firestore Database**
4. 点击顶部 **规则** 标签
5. 复制以下规则并粘贴：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 向后兼容：旧的 songs 和 settings 集合
    match /users/{userId}/songs/{songId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/settings/{settingId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 新的数据结构
    match /users/{userId}/workspaces/{workspaceId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/projects/{projectId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/tracks/{trackId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/workflows/{workflowId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. 点击 **发布** 按钮
7. 刷新应用页面并重新登录

## ✅ 验证修复

### 方法 1：使用测试工具

1. 在浏览器中打开 `test-firestore-permission.html`
2. 点击各个测试按钮
3. 确认所有测试通过

### 方法 2：在应用中测试

1. 刷新页面
2. 登录账号
3. 尝试创建工作区或项目
4. 检查控制台是否还有错误

## 📋 检查清单

- [ ] Firebase CLI 已安装（`npm install -g firebase-tools`）
- [ ] 已登录 Firebase（`firebase login`）
- [ ] 规则已部署（`firebase deploy --only firestore:rules`）
- [ ] 浏览器已刷新
- [ ] 已重新登录应用
- [ ] 控制台无权限错误

## 🔍 仍然有问题？

### 1. 检查认证状态

在浏览器控制台运行：

```javascript
// 检查用户是否登录
console.log('用户:', firebase.auth().currentUser)
```

### 2. 检查规则是否生效

1. 打开 Firebase Console
2. 进入 Firestore Database → 规则
3. 查看 **已发布** 时间是否是最近的

### 3. 清除缓存

1. 打开 DevTools (F12)
2. 右键点击刷新按钮
3. 选择 **清空缓存并硬性重新加载**

### 4. 查看详细错误

在 `src/stores/cloudSync.js` 的第 77 行添加：

```javascript
console.error('[CloudSync] 详细错误:', {
  code: error.code,
  message: error.message,
  userId: authStore.user?.uid,
  isAuth: authStore.isAuthenticated
})
```

## 📚 相关文档

- [FIRESTORE_PERMISSION_FIX.md](./FIRESTORE_PERMISSION_FIX.md) - 详细修复指南
- [test-firestore-permission.html](./test-firestore-permission.html) - 权限测试工具
- [Firebase Security Rules 文档](https://firebase.google.com/docs/firestore/security/get-started)

## 💡 常见问题

**Q: 规则已部署但仍报错？**
A: 等待 10-30 秒让规则生效，清除浏览器缓存并重新登录。

**Q: 本地开发时一直报错？**
A: 确保 `.env` 文件中的 Firebase 配置正确，特别是 `VITE_FIREBASE_PROJECT_ID`。

**Q: 能读取但不能写入？**
A: 检查规则中的 `allow write` 部分，确保 `request.auth.uid == userId`。

**Q: 测试模式下可以，生产模式不行？**
A: 生产模式需要正确的安全规则，不能使用测试模式规则。

---

**需要帮助？** 打开 `test-firestore-permission.html` 进行诊断！

