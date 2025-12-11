# Firestore 权限问题修复指南

## 问题
`FirebaseError: Missing or insufficient permissions.`

## 原因分析

这个错误通常由以下原因引起：

1. **Firestore 规则未部署**：本地的 `firestore.rules` 文件已更新，但未部署到 Firebase 控制台
2. **用户未正确认证**：`request.auth.uid` 为空或不匹配
3. **规则语法错误**：规则文件有语法问题导致默认拒绝所有请求

## 解决方案

### 方案 1：部署 Firestore 规则（推荐）

#### 使用 Firebase CLI 部署

```bash
# 1. 确保已安装 Firebase CLI
npm install -g firebase-tools

# 2. 登录 Firebase
firebase login

# 3. 初始化项目（如果还没有 firebase.json）
firebase init firestore

# 4. 部署规则
firebase deploy --only firestore:rules
```

#### 手动在 Firebase 控制台部署

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目
3. 进入 **Firestore Database** → **规则** 标签
4. 复制以下规则并粘贴：

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

5. 点击 **发布**

### 方案 2：临时使用测试模式（仅用于开发）

⚠️ **警告**：此方案会允许所有人读写数据，仅用于测试！

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

### 方案 3：检查用户认证状态

在浏览器控制台运行以下代码检查认证状态：

```javascript
// 检查当前用户
import { auth } from '@/config/firebase'
console.log('当前用户:', auth.currentUser)
console.log('用户ID:', auth.currentUser?.uid)
console.log('是否已认证:', !!auth.currentUser)
```

或在 DevTools Console 中：

```javascript
// 获取 Firebase Auth 实例
const auth = firebase.auth()
console.log('当前用户:', auth.currentUser)
```

## 验证修复

### 1. 在浏览器控制台测试写入权限

```javascript
import { db } from '@/config/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { auth } from '@/config/firebase'

// 测试写入
const testWrite = async () => {
  const userId = auth.currentUser?.uid
  if (!userId) {
    console.error('用户未登录')
    return
  }
  
  try {
    const testRef = doc(db, 'users', userId, 'workspaces', 'test-workspace')
    await setDoc(testRef, {
      name: '测试工作区',
      createdAt: new Date().toISOString()
    })
    console.log('✅ 写入成功！权限正常')
  } catch (error) {
    console.error('❌ 写入失败:', error.message)
  }
}

testWrite()
```

### 2. 检查 Firestore 规则是否生效

1. 打开 Firebase Console
2. 进入 **Firestore Database** → **规则** 标签
3. 查看 **已发布** 的规则
4. 确认规则的 **发布时间** 是最新的

### 3. 查看详细错误信息

在 `cloudSync.js` 中添加更详细的日志：

```javascript
try {
  // ... 同步代码
} catch (error) {
  console.error('[CloudSync] 详细错误信息:', {
    message: error.message,
    code: error.code,
    details: error.details,
    userId: authStore.user?.uid,
    isAuthenticated: authStore.isAuthenticated
  })
}
```

## 常见问题

### Q1: 规则已部署但仍然报错
**A**: 清除浏览器缓存并重新登录，Firebase 可能缓存了旧的认证令牌。

### Q2: 本地开发时一直报权限错误
**A**: 确保 `.env` 文件中的 Firebase 配置正确，特别是 `VITE_FIREBASE_PROJECT_ID`。

### Q3: 部署规则后需要多久生效？
**A**: 通常立即生效，但可能需要等待几秒钟。如果超过 1 分钟仍未生效，检查规则语法。

## 下一步

1. ✅ 部署 Firestore 规则
2. ✅ 刷新页面并重新登录
3. ✅ 测试同步功能
4. ✅ 检查控制台是否还有错误

## 参考资料

- [Firebase Security Rules 文档](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI 文档](https://firebase.google.com/docs/cli)

