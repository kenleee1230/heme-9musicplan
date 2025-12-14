# 工作区和项目选择逻辑说明

## 功能概述

应用会**自动记住**用户上次选择的工作区和项目，下次打开时自动恢复到上次的状态。

## 实现原理

### 1. 数据持久化

使用 `localStorage` 存储用户的选择：

```javascript
// 存储键名
'pattr_active_workspace' // 活跃工作区ID
'pattr_active_project'   // 活跃项目ID
```

### 2. 工作区选择逻辑

#### 保存选择

当用户选择工作区时：

```javascript
// src/components/Workspace/WorkspaceSelector.vue
function selectWorkspace(id) {
  workspacesStore.setActiveWorkspace(id)  // 调用 store 方法
  showDropdown.value = false
}

// src/stores/workspaces.js
function setActiveWorkspace(id) {
  if (workspaces.value.find(w => w.id === id)) {
    activeWorkspaceId.value = id
    saveActiveWorkspace()  // 保存到 localStorage
    return true
  }
  return false
}

function saveActiveWorkspace() {
  saveToStorage(ACTIVE_WORKSPACE_KEY, activeWorkspaceId.value)
}
```

#### 加载选择

应用启动时自动加载：

```javascript
// src/stores/workspaces.js
function loadWorkspaces() {
  const savedWorkspaces = loadFromStorage(STORAGE_KEY, [])
  workspaces.value = savedWorkspaces

  // 加载上次选择的工作区
  const savedActiveId = loadFromStorage(ACTIVE_WORKSPACE_KEY)
  if (savedActiveId && workspaces.value.find(w => w.id === savedActiveId)) {
    activeWorkspaceId.value = savedActiveId  // 恢复上次的选择
  } else if (workspaces.value.length > 0) {
    activeWorkspaceId.value = workspaces.value[0].id  // 默认选第一个
  }
}
```

### 3. 项目选择逻辑

#### 保存选择

当用户选择项目时：

```javascript
// src/components/Project/ProjectSelector.vue
function selectProject(id) {
  projectsStore.setActiveProject(id)  // 调用 store 方法
  showDropdown.value = false
}

// src/stores/projects.js
function setActiveProject(id) {
  if (projects.value.find(p => p.id === id)) {
    activeProjectId.value = id
    saveActiveProject()  // 保存到 localStorage
    return true
  }
  return false
}

function saveActiveProject() {
  saveToStorage(ACTIVE_PROJECT_KEY, activeProjectId.value)
}
```

#### 加载选择

应用启动时自动加载：

```javascript
// src/stores/projects.js
function loadProjects() {
  const savedProjects = loadFromStorage(STORAGE_KEY, [])
  projects.value = savedProjects

  // 加载上次选择的项目
  const savedActiveId = loadFromStorage(ACTIVE_PROJECT_KEY)
  if (savedActiveId && projects.value.find(p => p.id === savedActiveId)) {
    activeProjectId.value = savedActiveId  // 恢复上次的选择
  } else if (projects.value.length > 0) {
    activeProjectId.value = projects.value[0].id  // 默认选第一个
  }
}
```

## 应用启动流程

```javascript
// src/App.vue - onMounted
onMounted(async () => {
  // 1. 数据迁移（如果需要）
  if (needsMigration()) {
    migrateData()
  }
  
  // 2. 修复数据不一致
  fixDataInconsistency()
  
  // 3. 初始化认证
  await authStore.initAuth()
  
  // 4. 加载数据（会自动恢复上次的选择）
  workspacesStore.loadWorkspaces()  // 加载工作区 + 恢复活跃工作区
  projectsStore.loadProjects()      // 加载项目 + 恢复活跃项目
  tracksStore.loadTracks()          // 加载作品
  workflowsStore.loadWorkflows()    // 加载工作流
  
  // 5. 如果没有工作区，创建默认工作区
  if (workspacesStore.workspaces.length === 0) {
    const workspace = workspacesStore.createWorkspace({
      name: '我的工作区',
      description: '默认工作区'
    })
    workspacesStore.setActiveWorkspace(workspace.id)
  }
})
```

## 数据修复机制

如果用户上次选择的工作区/项目已被删除，系统会自动修复：

```javascript
// src/utils/dataFix.js
function fixDataInconsistency() {
  // 1. 检查活跃工作区是否存在
  if (activeWorkspaceId && !validWorkspaceIds.has(activeWorkspaceId)) {
    // 如果不存在，选择第一个工作区
    if (workspaces.length > 0) {
      localStorage.setItem('pattr_active_workspace', workspaces[0].id)
    } else {
      localStorage.removeItem('pattr_active_workspace')
    }
  }
  
  // 2. 检查活跃项目是否存在
  if (activeProjectId && !validProjectIds.has(activeProjectId)) {
    // 如果不存在，选择当前工作区的第一个项目
    const workspaceProjects = projects.filter(p => p.workspaceId === activeWorkspaceId)
    if (workspaceProjects.length > 0) {
      localStorage.setItem('pattr_active_project', workspaceProjects[0].id)
    } else {
      localStorage.removeItem('pattr_active_project')
    }
  }
}
```

## 用户体验流程

### 正常使用流程

1. **首次使用**
   - 系统创建默认工作区"我的工作区"
   - 自动选中该工作区
   - 用户创建第一个项目
   - 自动选中该项目

2. **切换工作区**
   - 用户点击工作区选择器
   - 选择其他工作区
   - 系统保存选择到 localStorage
   - 下次打开应用时，自动恢复到该工作区

3. **切换项目**
   - 用户点击项目选择器
   - 选择其他项目
   - 系统保存选择到 localStorage
   - 下次打开应用时，自动恢复到该项目

4. **关闭并重新打开应用**
   - 系统自动加载上次选择的工作区
   - 系统自动加载上次选择的项目
   - 显示该项目下的所有作品

### 异常处理流程

1. **删除了当前工作区**
   - 系统自动切换到其他工作区（如果有）
   - 保存新的选择
   - 如果没有其他工作区，清空选择

2. **删除了当前项目**
   - 系统自动切换到同工作区的其他项目（如果有）
   - 保存新的选择
   - 如果没有其他项目，清空选择

3. **数据损坏或不一致**
   - `fixDataInconsistency()` 自动修复
   - 选择有效的工作区和项目
   - 清理孤立数据

## 测试场景

### 场景 1: 正常使用

```
1. 打开应用
2. 选择工作区 A
3. 选择项目 1
4. 添加几首歌
5. 关闭应用
6. 重新打开应用
✅ 预期：自动显示工作区 A 的项目 1 和其歌曲
```

### 场景 2: 切换工作区

```
1. 当前在工作区 A 的项目 1
2. 切换到工作区 B
3. 选择项目 2
4. 关闭应用
5. 重新打开应用
✅ 预期：自动显示工作区 B 的项目 2
```

### 场景 3: 删除当前项目

```
1. 当前在工作区 A 的项目 1
2. 删除项目 1
✅ 预期：自动切换到工作区 A 的其他项目
3. 关闭应用
4. 重新打开应用
✅ 预期：显示上一步自动切换到的项目
```

### 场景 4: 删除当前工作区

```
1. 当前在工作区 A
2. 删除工作区 A
✅ 预期：自动切换到其他工作区
3. 关闭应用
4. 重新打开应用
✅ 预期：显示上一步自动切换到的工作区
```

## 调试方法

### 查看当前选择

在浏览器控制台执行：

```javascript
console.log('活跃工作区ID:', localStorage.getItem('pattr_active_workspace'))
console.log('活跃项目ID:', localStorage.getItem('pattr_active_project'))

// 查看完整信息
const workspaces = JSON.parse(localStorage.getItem('pattr_workspaces') || '[]')
const projects = JSON.parse(localStorage.getItem('pattr_projects') || '[]')
const activeWorkspaceId = localStorage.getItem('pattr_active_workspace')
const activeProjectId = localStorage.getItem('pattr_active_project')

const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
const activeProject = projects.find(p => p.id === activeProjectId)

console.log('活跃工作区:', activeWorkspace)
console.log('活跃项目:', activeProject)
```

### 手动设置选择

```javascript
// 设置活跃工作区
const workspaces = JSON.parse(localStorage.getItem('pattr_workspaces') || '[]')
if (workspaces.length > 0) {
  localStorage.setItem('pattr_active_workspace', workspaces[0].id)
  console.log('已设置活跃工作区为:', workspaces[0].name)
}

// 设置活跃项目
const projects = JSON.parse(localStorage.getItem('pattr_projects') || '[]')
if (projects.length > 0) {
  localStorage.setItem('pattr_active_project', projects[0].id)
  console.log('已设置活跃项目为:', projects[0].name)
}

// 刷新页面
location.reload()
```

### 清除选择

```javascript
localStorage.removeItem('pattr_active_workspace')
localStorage.removeItem('pattr_active_project')
console.log('已清除选择，刷新页面')
location.reload()
```

## 相关文件

- `src/stores/workspaces.js` - 工作区状态管理
- `src/stores/projects.js` - 项目状态管理
- `src/components/Workspace/WorkspaceSelector.vue` - 工作区选择器
- `src/components/Project/ProjectSelector.vue` - 项目选择器
- `src/utils/dataFix.js` - 数据修复工具
- `src/App.vue` - 应用启动逻辑

## 总结

✅ **已实现**: 应用会自动记住用户上次选择的工作区和项目

✅ **自动恢复**: 下次打开应用时，自动恢复到上次的状态

✅ **异常处理**: 如果上次选择的工作区/项目被删除，自动切换到其他有效的选项

✅ **数据持久化**: 使用 localStorage 存储，即使关闭浏览器也能保持

这个功能已经完全实现并正常工作！

