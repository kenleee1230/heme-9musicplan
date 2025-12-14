# Vue 错误修复：Cannot read properties of null (reading 'emitsOptions')

## 错误描述

```
Uncaught (in promise) TypeError: Cannot read properties of null (reading 'emitsOptions')
at shouldUpdateComponent (chunk-3AID4HRN.js?v=a12400ab:8896:27)
```

## 错误原因

这是一个 Vue 3 内部错误，通常发生在以下情况：

1. **组件引用丢失**: 当一个组件正在更新时，它所依赖的响应式数据突然变为 `null` 或 `undefined`
2. **删除操作时序问题**: 删除项目/工作区时，活跃引用立即变为 `null`，但组件还在尝试访问旧数据
3. **响应式更新冲突**: 多个响应式数据同时更新，导致 Vue 的 diff 算法遇到不一致的状态

### 具体场景

在我们的应用中，当用户删除一个项目时：

1. `deleteProject(id)` 被调用
2. 项目从数组中移除
3. `activeProjectId` 被设置为其他项目或 `null`
4. `projectTracks` 计算属性立即重新计算，返回空数组或新项目的作品
5. 但此时，`TimelineView`、`GanttChart` 等组件还在使用旧的 `activeProject` 引用
6. Vue 尝试更新这些组件时，发现组件实例的内部状态不一致，导致错误

## 解决方案

### 1. 添加组件 Key 强制重新渲染

在 `src/App.vue` 中，为依赖 `activeProject` 的组件添加 `key` 属性：

```vue
<TimelineView 
  v-show="timelineView === 'timeline'" 
  :key="`timeline-${activeProject?.id || 'none'}`" 
/>
<ProjectView 
  v-show="timelineView === 'project'" 
  :key="`project-${activeProject?.id || 'none'}`" 
/>
<DailyPlanView 
  v-show="timelineView === 'daily'" 
  :key="`daily-${activeProject?.id || 'none'}`" 
/>
<GanttChart 
  :key="`gantt-${activeProject?.id || 'none'}`" 
/>
```

**原理**:
- 当 `activeProject.id` 变化时，`key` 也会变化
- Vue 会销毁旧组件实例并创建新的实例
- 避免了更新过程中的状态不一致

### 2. 优化删除逻辑的时序

#### `src/stores/projects.js`

```javascript
function deleteProject(id) {
  const index = projects.value.findIndex(p => p.id === id)
  if (index === -1) return false

  const deletingProject = projects.value[index]
  
  // 先切换活跃项目
  if (activeProjectId.value === id) {
    const remaining = projects.value.filter(
      p => p.id !== id && p.workspaceId === deletingProject.workspaceId
    )
    if (remaining.length > 0) {
      activeProjectId.value = remaining[0].id
      saveActiveProject()
    } else {
      activeProjectId.value = null
      saveActiveProject()
    }
  }

  // 使用 setTimeout 确保响应式更新完成后再删除
  setTimeout(() => {
    projects.value.splice(index, 1)
    saveProjects()
  }, 0)

  return true
}
```

**关键改进**:
1. 先保存要删除的项目引用
2. 立即切换活跃项目（触发组件更新）
3. 使用 `setTimeout(..., 0)` 延迟删除操作
4. 确保组件先用新的活跃项目更新，再删除旧项目

#### `src/stores/workspaces.js`

```javascript
function deleteWorkspace(id) {
  const index = workspaces.value.findIndex(w => w.id === id)
  if (index === -1) return false

  // 先切换活跃工作区
  if (activeWorkspaceId.value === id) {
    const remaining = workspaces.value.filter(w => w.id !== id)
    if (remaining.length > 0) {
      activeWorkspaceId.value = remaining[0].id
      saveActiveWorkspace()
    } else {
      activeWorkspaceId.value = null
      saveActiveWorkspace()
    }
  }

  // 使用 setTimeout 确保响应式更新完成后再删除
  setTimeout(() => {
    workspaces.value.splice(index, 1)
    saveWorkspaces()
  }, 0)

  return true
}
```

### 3. 添加安全的默认值

在 `src/App.vue` 中：

```javascript
// 计算属性 - 向后兼容
const songs = computed(() => tracks.value || [])
```

确保即使 `tracks.value` 为 `null` 或 `undefined`，也返回空数组。

## 技术原理

### Vue 3 响应式系统

Vue 3 使用 Proxy 来实现响应式：

1. 当响应式数据变化时，Vue 标记相关组件为"需要更新"
2. 在下一个微任务（microtask）中，Vue 批量更新所有标记的组件
3. 更新过程中，Vue 使用 diff 算法比较新旧虚拟 DOM
4. `shouldUpdateComponent` 函数决定组件是否需要更新

### 错误发生的时机

```
用户点击删除
    ↓
deleteProject() 被调用
    ↓
projects.value.splice() - 删除项目
    ↓
activeProjectId.value = null - 清空活跃项目
    ↓
projectTracks 计算属性重新计算 - 返回 []
    ↓
Vue 标记 TimelineView、GanttChart 等组件需要更新
    ↓
Vue 开始更新组件（下一个 microtask）
    ↓
shouldUpdateComponent() 检查组件是否需要更新
    ↓
❌ 错误：组件实例的 emitsOptions 为 null
```

### 修复后的流程

```
用户点击删除
    ↓
deleteProject() 被调用
    ↓
activeProjectId.value = newId - 先切换到其他项目
    ↓
projectTracks 计算属性重新计算 - 返回新项目的作品
    ↓
Vue 标记组件需要更新
    ↓
Vue 开始更新组件（使用新的 key）
    ↓
✅ 组件被销毁并重新创建，状态一致
    ↓
setTimeout() 触发（下一个 event loop）
    ↓
projects.value.splice() - 删除旧项目
    ↓
不影响已更新的组件
```

## 为什么使用 setTimeout 而不是 nextTick

Vue 的 `nextTick` 在同一个微任务队列中执行，而 `setTimeout(..., 0)` 会在下一个宏任务中执行。

```javascript
// 时间线：
console.log('1. 同步代码')

Promise.resolve().then(() => {
  console.log('2. 微任务 (microtask)')
})

setTimeout(() => {
  console.log('4. 宏任务 (macrotask)')
}, 0)

console.log('3. 同步代码')

// 输出顺序：1 -> 3 -> 2 -> 4
```

在我们的场景中：
- 切换活跃项目（同步）
- Vue 在下一个微任务中更新组件
- setTimeout 在下一个宏任务中删除项目
- 确保组件更新完成后才删除数据

## 测试验证

### 测试步骤

1. 创建多个项目，每个项目添加作品
2. 在不同视图间切换（时间线、甘特图、项目进度）
3. 删除当前活跃的项目
4. 观察是否有错误，UI 是否正确更新

### 预期结果

- ✅ 删除操作顺利完成
- ✅ UI 立即切换到其他项目
- ✅ 所有视图正确显示新项目的数据
- ✅ 控制台没有错误

## 其他可能的解决方案

### 方案 A: 使用 v-if 而不是 v-show

```vue
<!-- 不推荐：会导致频繁的组件创建/销毁 -->
<TimelineView v-if="timelineView === 'timeline'" />
<ProjectView v-if="timelineView === 'project'" />
```

**缺点**: 切换视图时会重新创建组件，性能较差

### 方案 B: 使用 Suspense

```vue
<Suspense>
  <template #default>
    <TimelineView />
  </template>
  <template #fallback>
    <div>加载中...</div>
  </template>
</Suspense>
```

**缺点**: 过于复杂，不适合这个场景

### 方案 C: 手动管理组件生命周期

```javascript
// 在删除前先卸载组件
onBeforeUnmount(() => {
  // 清理逻辑
})
```

**缺点**: 需要在每个组件中添加，维护成本高

## 最佳实践总结

1. **使用 key 属性**: 当组件依赖的数据可能完全改变时，使用 `key` 强制重新渲染
2. **优化删除时序**: 先切换引用，再删除数据
3. **使用异步删除**: 使用 `setTimeout` 确保响应式更新完成
4. **添加空值保护**: 使用 `?.` 和 `|| []` 等方式防止 `null`/`undefined`
5. **在组件中检查数据**: 在模板中使用 `v-if` 检查数据是否存在

## 相关文件

- `src/App.vue` - 添加组件 key
- `src/stores/projects.js` - 优化删除逻辑
- `src/stores/workspaces.js` - 优化删除逻辑
- `src/components/Schedule/TimelineView.vue` - 已有空状态检查
- `src/components/Schedule/GanttChart.vue` - 已有空状态检查
- `src/components/Schedule/ProjectView.vue` - 已有空状态检查
- `src/components/Schedule/DailyPlanView.vue` - 已有空状态检查

## 参考资料

- [Vue 3 Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Vue 3 Key Attribute](https://vuejs.org/api/built-in-special-attributes.html#key)
- [JavaScript Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)

