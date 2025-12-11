# 云同步设计 - 第一性原理

## 核心原则

### 数据真相之源（Source of Truth）

#### 已登录用户
- **云端是唯一真相之源**
- 本地存储 = 云端数据的缓存
- 目的：离线访问、快速响应

#### 未登录用户
- **本地存储是唯一真相之源**
- 云端无数据
- 登录后：本地数据上传到云端

---

## 数据流设计

### 场景1：首次启动（未登录）

```
启动 → 检查本地存储 → 有数据？
  ├─ 是 → 加载本地数据
  └─ 否 → 创建默认工作区
```

### 场景2：首次启动（已登录）

```
启动 → 初始化认证 → 已登录？
  └─ 是 → 从云端加载数据 → 覆盖本地存储
         ├─ 云端有数据 → 使用云端数据
         └─ 云端无数据 → 检查本地是否有旧数据
                        ├─ 有 → 迁移并上传到云端
                        └─ 无 → 创建默认工作区
```

### 场景3：用户登录

```
用户点击登录 → 登录成功 → 检查云端数据
  ├─ 云端有数据 → 下载并覆盖本地
  └─ 云端无数据 → 上传本地数据到云端
```

### 场景4：用户登出

```
用户点击登出 → 清除认证状态
  ├─ 保留本地数据（作为离线备份）
  └─ 停止云同步
```

### 场景5：数据修改（已登录）

```
用户修改数据 → 立即更新本地存储 → 异步同步到云端
  ├─ 同步成功 → 记录同步时间
  └─ 同步失败 → 加入同步队列，稍后重试
```

### 场景6：清除本地存储（已登录）

```
清除本地存储 → 刷新页面 → 检测到已登录但本地无数据
  └─ 从云端重新下载数据 → 恢复本地存储
```

---

## 实现逻辑

### App.vue 启动流程

```javascript
onMounted(async () => {
  // 1. 初始化认证（检查是否已登录）
  await authStore.initAuth()
  
  // 2. 根据登录状态决定数据来源
  if (authStore.isAuthenticated) {
    // 已登录：云端是真相之源
    console.log('[App] User is logged in, loading from cloud...')
    
    // 从云端加载数据
    const result = await cloudSyncStore.loadFromCloud()
    
    if (result.success) {
      // 云端数据已保存到本地，重新加载
      workspacesStore.loadWorkspaces()
      projectsStore.loadProjects()
      tracksStore.loadTracks()
    } else {
      // 云端加载失败，尝试使用本地数据
      console.warn('[App] Failed to load from cloud, using local data')
      workspacesStore.loadWorkspaces()
      projectsStore.loadProjects()
      tracksStore.loadTracks()
    }
  } else {
    // 未登录：本地是真相之源
    console.log('[App] User not logged in, loading from local storage...')
    
    // 检查并执行数据迁移
    if (needsMigration()) {
      migrateData()
    }
    
    // 加载本地数据
    workspacesStore.loadWorkspaces()
    projectsStore.loadProjects()
    tracksStore.loadTracks()
  }
  
  // 3. 如果没有工作区，创建默认工作区
  if (workspacesStore.workspaces.length === 0) {
    const workspace = workspacesStore.createWorkspace({
      name: '我的工作区',
      description: '默认工作区'
    })
    workspacesStore.setActiveWorkspace(workspace.id)
    
    // 如果已登录，同步到云端
    if (authStore.isAuthenticated) {
      await cloudSyncStore.syncToCloud()
    }
  }
})
```

### useSync.js 登录监听

```javascript
watch(
  () => authStore.isAuthenticated,
  async (isAuth, wasAuth) => {
    // 从未登录 → 已登录
    if (isAuth && !wasAuth) {
      console.log('[Sync] User just logged in')
      
      // 1. 检查云端是否有数据
      const hasCloudData = await cloudSyncStore.checkNewDataStructure(userId)
      
      if (hasCloudData) {
        // 云端有数据：下载并覆盖本地
        console.log('[Sync] Cloud has data, downloading...')
        await cloudSyncStore.loadFromCloud()
        
        // 重新加载本地数据（已被云端数据覆盖）
        workspacesStore.loadWorkspaces()
        projectsStore.loadProjects()
        tracksStore.loadTracks()
      } else {
        // 云端无数据：上传本地数据到云端
        console.log('[Sync] Cloud is empty, uploading local data...')
        await cloudSyncStore.syncToCloud()
      }
    }
    
    // 从已登录 → 未登录
    if (!isAuth && wasAuth) {
      console.log('[Sync] User logged out')
      // 保留本地数据，不做任何操作
    }
  }
)
```

### cloudSync.js 核心方法

```javascript
/**
 * 从云端加载数据（覆盖本地）
 */
async function loadFromCloud() {
  const userId = authStore.user.uid
  
  // 1. 检查云端数据结构
  const hasNewData = await checkNewDataStructure(userId)
  
  if (hasNewData) {
    // 加载新数据结构
    const workspaces = await loadWorkspacesFromCloud(userId)
    const projects = await loadProjectsFromCloud(userId)
    const tracks = await loadTracksFromCloud(userId)
    
    // 直接覆盖本地存储
    localStorage.setItem(PATTR_WORKSPACES_KEY, JSON.stringify(workspaces))
    localStorage.setItem(PATTR_PROJECTS_KEY, JSON.stringify(projects))
    localStorage.setItem(PATTR_TRACKS_KEY, JSON.stringify(tracks))
    
    // 恢复活跃状态
    if (workspaces.length > 0) {
      localStorage.setItem(PATTR_ACTIVE_WORKSPACE_KEY, workspaces[0].id)
    }
    if (projects.length > 0) {
      localStorage.setItem(PATTR_ACTIVE_PROJECT_KEY, projects[0].id)
    }
    
    return { success: true }
  } else {
    // 检查旧数据
    const hasOldData = await checkOldDataStructure(userId)
    
    if (hasOldData) {
      // 迁移旧数据
      await migrateOldDataToNew(userId)
      return { success: true }
    }
    
    // 云端无数据
    return { success: true, empty: true }
  }
}

/**
 * 上传本地数据到云端
 */
async function syncToCloud() {
  const userId = authStore.user.uid
  
  // 从本地存储读取数据
  const workspaces = JSON.parse(localStorage.getItem(PATTR_WORKSPACES_KEY) || '[]')
  const projects = JSON.parse(localStorage.getItem(PATTR_PROJECTS_KEY) || '[]')
  const tracks = JSON.parse(localStorage.getItem(PATTR_TRACKS_KEY) || '[]')
  
  // 上传到云端
  await syncWorkspacesToCloud(userId, workspaces)
  await syncProjectsToCloud(userId, projects)
  await syncTracksToCloud(userId, tracks)
  
  return { success: true }
}
```

---

## 关键决策

### ✅ 已登录用户：云端优先

**原因**：
- 用户可能在多设备使用
- 云端数据是最新的、完整的
- 本地数据可能过期或损坏

**实现**：
- 启动时：直接从云端加载
- 修改时：先更新本地，再同步云端
- 清除本地后：从云端恢复

### ✅ 未登录用户：本地优先

**原因**：
- 无云端账号，数据只能在本地
- 登录后需要保留本地数据

**实现**：
- 启动时：从本地加载
- 登录时：上传本地数据到云端
- 修改时：只更新本地

### ✅ 数据冲突处理

**策略**：云端优先（Last Write Wins）

**原因**：
- 简单可靠
- 用户期望：登录后看到的是云端数据
- 避免复杂的合并逻辑

**实现**：
- 登录时：云端数据覆盖本地
- 同步时：本地数据覆盖云端
- 不做三方合并

---

## 测试场景

### ✅ 场景1：新用户首次使用（未登录）
1. 打开应用 → 创建默认工作区
2. 添加项目和歌曲
3. 数据保存在本地

### ✅ 场景2：新用户注册登录
1. 注册账号 → 登录
2. 本地数据上传到云端
3. 云端和本地数据一致

### ✅ 场景3：老用户登录（云端有数据）
1. 登录 → 从云端下载数据
2. 本地数据被云端数据覆盖
3. 看到云端的项目和歌曲

### ✅ 场景4：已登录用户清除本地存储
1. 清除本地存储 → 刷新页面
2. 检测到已登录但本地无数据
3. 自动从云端下载数据
4. 数据恢复完成

### ✅ 场景5：已登录用户离线使用
1. 断网 → 使用本地缓存数据
2. 修改数据 → 保存到本地
3. 联网后 → 自动同步到云端

### ✅ 场景6：多设备同步
1. 设备A：添加项目
2. 设备B：刷新页面 → 从云端加载
3. 设备B：看到设备A添加的项目

---

## 优势

1. **清晰的数据流**：始终知道数据从哪来，到哪去
2. **可预测的行为**：用户知道登录后会看到云端数据
3. **简单的实现**：不需要复杂的冲突解决
4. **可靠的恢复**：清除本地后可以从云端恢复
5. **离线支持**：本地缓存支持离线使用

---

## 后续优化

1. **增量同步**：只同步变更的数据，减少流量
2. **冲突检测**：检测多设备同时修改，提示用户
3. **版本控制**：记录数据版本，支持回滚
4. **实时同步**：使用 Firestore 实时监听，自动同步
5. **同步状态提示**：显示同步进度和状态

---

**设计原则**：简单、可靠、可预测
**核心思想**：云端是真相之源（已登录），本地是缓存

