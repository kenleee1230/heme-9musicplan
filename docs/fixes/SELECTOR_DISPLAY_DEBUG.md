# 选择器显示问题调试指南

## 问题描述

工作区和项目选择器显示"选择工作区"和"选择项目"，但实际上后台已经选好了。

## 可能的原因

1. **响应式数据未更新**: `activeWorkspace` 或 `activeProject` 计算属性返回 `null`
2. **数据加载时序问题**: 组件渲染时数据还未加载完成
3. **localStorage 数据不一致**: 活跃ID存在但对应的数据不存在

## 调试步骤

### 步骤 1: 检查控制台日志

刷新页面后，在浏览器控制台（F12）查看以下日志：

```
[App] Loading data from localStorage...
[WorkspacesStore] Loaded X workspaces
[WorkspacesStore] Saved active workspace ID: xxx
[WorkspacesStore] Restored active workspace: 工作区名称
[ProjectsStore] Loaded X projects
[ProjectsStore] Saved active project ID: xxx
[ProjectsStore] Restored active project: 项目名称
[App] Active workspace: xxx 工作区名称
[App] Active project: xxx 项目名称
```

**如果看到**:
- `Saved active workspace ID: null` → 说明没有保存活跃工作区
- `Restored active workspace: undefined` → 说明ID存在但找不到对应的工作区
- `No workspaces available` → 说明没有工作区数据

### 步骤 2: 手动检查 localStorage

在控制台执行：

```javascript
// 检查数据
console.log('=== localStorage 数据 ===')
console.log('工作区:', JSON.parse(localStorage.getItem('pattr_workspaces') || '[]'))
console.log('项目:', JSON.parse(localStorage.getItem('pattr_projects') || '[]'))
console.log('活跃工作区ID:', localStorage.getItem('pattr_active_workspace'))
console.log('活跃项目ID:', localStorage.getItem('pattr_active_project'))

// 检查 Pinia stores
console.log('=== Pinia Stores ===')
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
console.log('workspacesStore.activeWorkspaceId:', workspacesStore.activeWorkspaceId)
console.log('workspacesStore.activeWorkspace:', workspacesStore.activeWorkspace)
console.log('projectsStore.activeProjectId:', projectsStore.activeProjectId)
console.log('projectsStore.activeProject:', projectsStore.activeProject)
```

### 步骤 3: 检查响应式引用

在控制台执行：

```javascript
// 获取 stores
const { useWorkspacesStore } = await import('/src/stores/workspaces.js')
const { useProjectsStore } = await import('/src/stores/projects.js')
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()

// 检查计算属性
console.log('activeWorkspace computed:', workspacesStore.activeWorkspace)
console.log('activeProject computed:', projectsStore.activeProject)

// 检查原始数据
console.log('workspaces array:', workspacesStore.workspaces)
console.log('projects array:', projectsStore.projects)
console.log('activeWorkspaceId:', workspacesStore.activeWorkspaceId)
console.log('activeProjectId:', projectsStore.activeProjectId)
```

## 常见问题和解决方案

### 问题 1: activeWorkspaceId 存在但 activeWorkspace 为 null

**原因**: ID 指向的工作区不存在

**解决方案**:
```javascript
// 重新设置活跃工作区
const workspacesStore = useWorkspacesStore()
if (workspacesStore.workspaces.length > 0) {
  workspacesStore.setActiveWorkspace(workspacesStore.workspaces[0].id)
  console.log('已重新设置活跃工作区')
  location.reload()
}
```

### 问题 2: localStorage 有数据但 store 为空

**原因**: 数据加载失败或未触发

**解决方案**:
```javascript
// 手动重新加载
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
workspacesStore.loadWorkspaces()
projectsStore.loadProjects()
console.log('已重新加载数据')
```

### 问题 3: 选择器显示"选择工作区"但控制台显示有数据

**原因**: 组件的响应式引用未更新

**解决方案**:
```javascript
// 强制刷新页面
location.reload()
```

## 快速修复脚本

复制以下代码到控制台执行：

```javascript
(async function() {
  console.log('=== 开始诊断选择器显示问题 ===\n')
  
  // 检查 localStorage
  const workspaces = JSON.parse(localStorage.getItem('pattr_workspaces') || '[]')
  const projects = JSON.parse(localStorage.getItem('pattr_projects') || '[]')
  const activeWorkspaceId = localStorage.getItem('pattr_active_workspace')
  const activeProjectId = localStorage.getItem('pattr_active_project')
  
  console.log('localStorage 数据:')
  console.log('  工作区数量:', workspaces.length)
  console.log('  项目数量:', projects.length)
  console.log('  活跃工作区ID:', activeWorkspaceId)
  console.log('  活跃项目ID:', activeProjectId)
  
  // 验证活跃ID是否有效
  let needsFix = false
  
  if (activeWorkspaceId) {
    const workspace = workspaces.find(w => w.id === activeWorkspaceId)
    if (workspace) {
      console.log('  ✅ 活跃工作区有效:', workspace.name)
    } else {
      console.log('  ❌ 活跃工作区ID无效')
      needsFix = true
    }
  } else {
    console.log('  ❌ 未设置活跃工作区')
    needsFix = true
  }
  
  if (activeProjectId) {
    const project = projects.find(p => p.id === activeProjectId)
    if (project) {
      console.log('  ✅ 活跃项目有效:', project.name)
    } else {
      console.log('  ❌ 活跃项目ID无效')
      needsFix = true
    }
  } else {
    console.log('  ❌ 未设置活跃项目')
    needsFix = true
  }
  
  // 如果需要修复
  if (needsFix) {
    console.log('\n正在修复...')
    
    if (!activeWorkspaceId && workspaces.length > 0) {
      localStorage.setItem('pattr_active_workspace', workspaces[0].id)
      console.log('  ✅ 已设置活跃工作区:', workspaces[0].name)
    }
    
    if (!activeProjectId && projects.length > 0) {
      const activeWsId = localStorage.getItem('pattr_active_workspace')
      const wsProjects = projects.filter(p => p.workspaceId === activeWsId)
      if (wsProjects.length > 0) {
        localStorage.setItem('pattr_active_project', wsProjects[0].id)
        console.log('  ✅ 已设置活跃项目:', wsProjects[0].name)
      }
    }
    
    console.log('\n=== 修复完成，刷新页面 ===')
    setTimeout(() => location.reload(), 1000)
  } else {
    console.log('\n=== 数据正常，检查 Pinia stores ===')
    
    // 尝试访问 stores（需要在 Vue 应用上下文中）
    try {
      const app = document.querySelector('#app').__vueParentComponent
      if (app) {
        console.log('Vue 应用已加载')
        console.log('请检查组件是否正确使用 storeToRefs')
      }
    } catch (e) {
      console.log('无法访问 Vue 实例，请刷新页面')
    }
    
    console.log('\n如果选择器仍显示"选择工作区/项目"，请刷新页面')
  }
})()
```

## 预期的正确行为

### 页面加载时

1. `App.vue` 的 `onMounted` 执行
2. 调用 `workspacesStore.loadWorkspaces()`
3. 从 localStorage 读取工作区数据和活跃ID
4. 设置 `activeWorkspaceId.value`
5. `activeWorkspace` 计算属性自动更新
6. 选择器组件通过 `storeToRefs` 获取响应式引用
7. 模板自动更新显示工作区名称

### 选择器显示逻辑

```vue
<!-- WorkspaceSelector.vue -->
<span class="workspace-name">
  {{ activeWorkspace?.name || '选择工作区' }}
</span>
```

- 如果 `activeWorkspace` 不为 `null`，显示 `activeWorkspace.name`
- 如果 `activeWorkspace` 为 `null`，显示"选择工作区"

## 检查清单

- [ ] localStorage 中有工作区和项目数据
- [ ] localStorage 中有活跃工作区和项目ID
- [ ] 活跃ID对应的数据存在
- [ ] 控制台日志显示"Restored active workspace/project"
- [ ] `workspacesStore.activeWorkspace` 不为 `null`
- [ ] `projectsStore.activeProject` 不为 `null`
- [ ] 选择器组件使用了 `storeToRefs`
- [ ] 模板使用了 `activeWorkspace?.name`

## 如果问题仍然存在

请提供以下信息：

1. 控制台的完整日志（从刷新页面开始）
2. 执行快速修复脚本的输出
3. localStorage 中的数据（执行步骤2的脚本）
4. 选择器按钮显示的文本
5. 点击选择器下拉菜单后，是否能看到工作区/项目列表

## 相关文件

- `src/components/Workspace/WorkspaceSelector.vue` - 工作区选择器
- `src/components/Project/ProjectSelector.vue` - 项目选择器
- `src/stores/workspaces.js` - 工作区 store
- `src/stores/projects.js` - 项目 store
- `src/App.vue` - 应用启动逻辑

