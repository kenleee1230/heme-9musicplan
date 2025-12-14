# Calculations.js 修复总结

## 错误描述

```
calculations.js:241 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading '0')
at generateDailyPlan
```

## 错误原因

`calculations.js` 中的 `generateDailyPlan` 和 `getStageFromLastCompletedTask` 函数还在使用旧的数据结构字段名：

### 旧字段（musicplan）
- `song.tasks` - 任务完成状态
- `song.customTasks` - 自定义任务列表
- `song.taskHours` - 每个任务的预计时长

### 新字段（Pattr）
- `song.stepsCompleted` - 步骤完成状态
- `song.customSteps` - 自定义步骤列表
- `song.taskHours` - 保持不变（但可能不存在）

## 修复内容

### 1. generateDailyPlan 函数

**修改前**:
```javascript
const customTasks = Array.isArray(song.customTasks) && song.customTasks.length > 0
  ? song.customTasks
  : TASKS

song.taskHours.forEach((hours, taskIndex) => {
  if (!song.tasks[taskIndex] && hours > 0) {
    // ...
  }
})
```

**问题**:
- `song.customTasks` 在新数据中是 `undefined`
- `song.tasks` 在新数据中是 `undefined`
- `song.taskHours` 可能不存在，导致 `forEach` 报错

**修改后**:
```javascript
// 获取 customSteps（新）或 customTasks（旧）
const customSteps = song.customSteps || song.customTasks
const customTasks = Array.isArray(customSteps) && customSteps.length > 0
  ? customSteps
  : TASKS

// 获取 stepsCompleted（新）或 tasks（旧）
const stepsCompleted = song.stepsCompleted || song.tasks || []
const taskHours = song.taskHours || []

// 如果有 taskHours，使用它
if (taskHours.length > 0) {
  taskHours.forEach((hours, taskIndex) => {
    if (!stepsCompleted[taskIndex] && hours > 0) {
      // ...
    }
  })
} else {
  // 如果没有 taskHours，为每个未完成的步骤分配默认时长
  const defaultHoursPerTask = (song.estimatedHours || 40) / customTasks.length
  customTasks.forEach((taskName, taskIndex) => {
    if (!stepsCompleted[taskIndex]) {
      queue.push({
        songId: song.id,
        songName: song.name,
        taskIndex: taskIndex,
        taskName: taskName,
        hours: defaultHoursPerTask,
        remainingHours: defaultHoursPerTask,
        isNewGenre: song.isNewGenre || song.metadata?.isNewGenre
      })
    }
  })
}
```

**改进点**:
- ✅ 向后兼容旧字段
- ✅ 处理 `taskHours` 不存在的情况
- ✅ 自动分配默认时长
- ✅ 支持新的 `metadata.isNewGenre` 结构

### 2. getStageFromLastCompletedTask 函数

**修改前**:
```javascript
export function getStageFromLastCompletedTask(song) {
  if (!song || !song.tasks || !Array.isArray(song.tasks)) {
    return '曲风研究'
  }

  const customTasks = (Array.isArray(song.customTasks) && song.customTasks.length > 0)
    ? song.customTasks
    : TASKS

  song.tasks.forEach((completed, index) => {
    // ...
  })
}
```

**修改后**:
```javascript
export function getStageFromLastCompletedTask(song) {
  // 获取 stepsCompleted（新）或 tasks（旧）
  const stepsCompleted = song?.stepsCompleted || song?.tasks
  if (!song || !stepsCompleted || !Array.isArray(stepsCompleted)) {
    return '曲风研究'
  }

  // 获取 customSteps（新）或 customTasks（旧）
  const customSteps = song.customSteps || song.customTasks
  const customTasks = (Array.isArray(customSteps) && customSteps.length > 0)
    ? customSteps
    : TASKS

  stepsCompleted.forEach((completed, index) => {
    // ...
  })
}
```

**改进点**:
- ✅ 使用可选链 `?.` 防止错误
- ✅ 向后兼容旧字段
- ✅ 正确处理新数据结构

## 数据字段映射

| 功能 | 旧字段 | 新字段 | 备注 |
|------|--------|--------|------|
| 步骤列表 | `song.customTasks` | `song.customSteps` | 自定义步骤名称数组 |
| 完成状态 | `song.tasks` | `song.stepsCompleted` | 布尔值数组 |
| 步骤时长 | `song.taskHours` | `song.taskHours` | 保持不变，但可能不存在 |
| 是否新曲风 | `song.isNewGenre` | `song.metadata.isNewGenre` | 移到 metadata 中 |

## 向后兼容策略

所有修改都使用了 `||` 运算符来提供向后兼容：

```javascript
// 优先使用新字段，如果不存在则使用旧字段
const customSteps = song.customSteps || song.customTasks
const stepsCompleted = song.stepsCompleted || song.tasks || []
const isNewGenre = song.isNewGenre || song.metadata?.isNewGenre
```

这确保了：
- ✅ 新迁移的数据可以正常工作
- ✅ 如果有遗留的旧数据格式，也能正常处理
- ✅ 不会因为缺少字段而报错

## 测试验证

### 测试场景

1. **有 taskHours 的歌曲**:
   - 应该正确生成每日计划
   - 使用实际的 taskHours 数据

2. **没有 taskHours 的歌曲**:
   - 应该自动分配默认时长
   - 默认时长 = estimatedHours / 步骤数

3. **混合数据**:
   - 部分歌曲有旧字段，部分有新字段
   - 都应该正常工作

### 测试步骤

1. 刷新页面
2. 切换到"每日任务"视图
3. 检查是否有错误
4. 查看日历上的任务分配是否正确

### 预期结果

- ✅ 不再出现 `Cannot read properties of undefined` 错误
- ✅ 每日计划正确生成
- ✅ 日历视图正常显示
- ✅ 任务分配合理

## 相关文件

- `src/utils/calculations.js` - 主要修复文件
- `src/components/Schedule/DailyPlanView.vue` - 使用 `generateDailyPlan` 的组件
- `src/components/Schedule/SongCard.vue` - 使用 `getStageFromLastCompletedTask` 的组件
- `src/utils/migration.js` - 数据迁移逻辑

## 未来改进建议

1. **统一数据结构**: 在数据迁移时确保所有字段都存在
2. **添加数据验证**: 在加载数据时验证必需字段
3. **类型定义**: 使用 TypeScript 或 JSDoc 定义数据类型
4. **单元测试**: 为 calculations 函数添加单元测试

## 总结

这次修复解决了 `calculations.js` 中因数据结构重构导致的错误。通过添加向后兼容性支持和处理缺失字段的情况，确保了应用在新旧数据混合的环境下都能正常工作。

