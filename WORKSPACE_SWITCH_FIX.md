# 工作区切换时项目选择修复

## 问题描述

**场景**: 
- 工作区 A 有项目
- 工作区 B 没有项目
- 从工作区 A 切换到工作区 B
- **问题**: 项目选择器仍然显示工作区 A 的项目，而不是"选择项目"状态

## 根本原因

1. **`activeProjectId` 没有被清空**: 切换工作区时，虽然调用了清空逻辑，但由于异步导入的问题，可能没有立即生效

2. **`activeProject` 计算属性不检查工作区**: 即使 `activeProjectId` 指向工作区 A 的项目，`activeProject` 计算属性仍然返回该项目，没有验证项目是否属于当前工作区

## 解决方案

### 修复 1: 改进 `activeProject` 计算属性

**文件**: `src/stores/projects.js`

**修改前**:
```javascript
const activeProject = computed(() => {
  return projects.value.find(p => p.id === activeProjectId.value) || null
})
```

**问题**: 只要项目存在就返回，不管是否属于当前工作区

**修改后**:
```javascript
const activeProject = computed(() => {
  const workspacesStore = useWorkspacesStore()
  const project = projects.value.find(p => p.id === activeProjectId.value)
  
  // 检查项目是否属于当前活跃的工作区
  if (project && workspacesStore.activeWorkspaceId) {
    if (project.workspaceId === workspacesStore.activeWorkspaceId) {
      return project  // ✅ 项目属于当前工作区
    } else {
      return null     // ❌ 项目不属于当前工作区，返回 null
    }
  }
  
  return project || null
})
```

**改进点**:
- ✅ 验证项目是否属于当前工作区
- ✅ 如果项目不属于当前工作区，返回 `null`
- ✅ 项目选择器会显示"选择项目"

### 修复 2: 切换工作区时自动切换项目

**文件**: `src/stores/workspaces.js`

**功能**: 切换工作区时，自动切换到该工作区的第一个项目

```javascript
function setActiveWorkspace(id) {
  if (workspaces.value.find(w => w.id === id)) {
    activeWorkspaceId.value = id
    saveActiveWorkspace()
    
    // 切换工作区时，自动切换到该工作区下的第一个项目
    switchToWorkspaceFirstProject(id)
    
    return true
  }
  return false
}

async function switchToWorkspaceFirstProject(workspaceId) {
  const projectsStore = useProjectsStore()
  const workspaceProjects = projectsStore.getProjectsByWorkspace(workspaceId)
  
  if (workspaceProjects.length > 0) {
    // 有项目：切换到第一个项目
    projectsStore.setActiveProject(workspaceProjects[0].id)
  } else {
    // 没有项目：清空活跃项目
    projectsStore.activeProjectId = null
    projectsStore.saveActiveProject()
  }
}
```

## 工作流程

### 场景 1: 切换到有项目的工作区

```
用户操作: 从工作区 A 切换到工作区 B（有项目）
    ↓
setActiveWorkspace(B.id)
    ↓
switchToWorkspaceFirstProject(B.id)
    ↓
获取工作区 B 的项目列表
    ↓
setActiveProject(B的第一个项目.id)
    ↓
✅ 项目选择器显示: "工作区 B 的项目 1"
```

### 场景 2: 切换到没有项目的工作区

```
用户操作: 从工作区 A 切换到工作区 B（无项目）
    ↓
setActiveWorkspace(B.id)
    ↓
switchToWorkspaceFirstProject(B.id)
    ↓
获取工作区 B 的项目列表 → 空数组
    ↓
activeProjectId = null
    ↓
activeProject 计算属性 → null
    ↓
✅ 项目选择器显示: "选择项目"
```

### 场景 3: activeProjectId 指向其他工作区的项目

```
状态: activeProjectId = A的项目1.id
用户操作: 切换到工作区 B
    ↓
activeProject 计算属性重新计算
    ↓
找到项目: A的项目1
    ↓
检查: A的项目1.workspaceId === B.id?
    ↓
❌ 不相等
    ↓
返回 null
    ↓
✅ 项目选择器显示: "选择项目"
```

## 测试场景

### 测试 1: 有项目 → 有项目

```
1. 工作区 A 有项目 A1, A2
2. 工作区 B 有项目 B1, B2
3. 在工作区 A 选择项目 A2
4. 切换到工作区 B
5. ✅ 应该显示项目 B1（工作区 B 的第一个项目）
```

### 测试 2: 有项目 → 无项目

```
1. 工作区 A 有项目 A1, A2
2. 工作区 B 没有项目
3. 在工作区 A 选择项目 A1
4. 切换到工作区 B
5. ✅ 应该显示"选择项目"
```

### 测试 3: 无项目 → 有项目

```
1. 工作区 A 没有项目
2. 工作区 B 有项目 B1, B2
3. 在工作区 A（项目选择器显示"选择项目"）
4. 切换到工作区 B
5. ✅ 应该显示项目 B1
```

### 测试 4: 无项目 → 无项目

```
1. 工作区 A 没有项目
2. 工作区 B 没有项目
3. 在工作区 A（项目选择器显示"选择项目"）
4. 切换到工作区 B
5. ✅ 应该显示"选择项目"
```

## 验证方法

### 在浏览器控制台检查

```javascript
// 检查当前状态
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()

console.log('活跃工作区:', workspacesStore.activeWorkspace?.name)
console.log('活跃项目ID:', projectsStore.activeProjectId)
console.log('活跃项目:', projectsStore.activeProject?.name)
console.log('工作区的项目:', projectsStore.workspaceProjects.map(p => p.name))

// 如果活跃项目为 null，但 activeProjectId 不为 null
// 说明 activeProjectId 指向了其他工作区的项目
if (!projectsStore.activeProject && projectsStore.activeProjectId) {
  const project = projectsStore.projects.find(p => p.id === projectsStore.activeProjectId)
  console.log('activeProjectId 指向的项目:', project?.name)
  console.log('该项目的工作区ID:', project?.workspaceId)
  console.log('当前工作区ID:', workspacesStore.activeWorkspaceId)
  console.log('是否匹配:', project?.workspaceId === workspacesStore.activeWorkspaceId)
}
```

## 相关文件

- `src/stores/projects.js` - 修复 `activeProject` 计算属性
- `src/stores/workspaces.js` - 添加 `switchToWorkspaceFirstProject` 方法

## 技术细节

### 为什么使用计算属性而不是直接清空 activeProjectId？

**方案 A（当前方案）**: 在计算属性中验证
```javascript
// 优点：
// 1. activeProjectId 保持不变，不需要频繁修改
// 2. 计算属性自动响应工作区变化
// 3. 不需要在多处清空 activeProjectId
// 4. 更符合 Vue 的响应式设计

const activeProject = computed(() => {
  // 验证项目是否属于当前工作区
  if (project.workspaceId === currentWorkspaceId) {
    return project
  }
  return null
})
```

**方案 B（备选方案）**: 切换时清空
```javascript
// 缺点：
// 1. 需要在多处清空 activeProjectId
// 2. 可能遗漏某些切换场景
// 3. 异步导入可能导致时序问题

function setActiveWorkspace(id) {
  activeWorkspaceId.value = id
  // 需要手动清空
  projectsStore.activeProjectId = null
}
```

**结论**: 方案 A 更可靠，因为它在数据层面保证了一致性。

## 总结

✅ **已修复**:
- 切换工作区时，项目选择器正确显示当前工作区的项目或"选择项目"状态
- `activeProject` 计算属性验证项目是否属于当前工作区
- 自动切换到新工作区的第一个项目

✅ **测试建议**:
1. 创建多个工作区，有的有项目，有的没有项目
2. 在不同工作区之间切换
3. 验证项目选择器始终显示正确的状态

现在切换工作区时，项目选择会正确更新了！🎉

