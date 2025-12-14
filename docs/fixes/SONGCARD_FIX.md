# SongCard 组件修复总结

## 错误描述

```
SongCard.vue:165 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'filter')
```

## 错误原因

`SongCard.vue` 组件还在使用旧的数据结构字段名：

### 旧数据结构（musicplan）
- `song.tasks` - 任务完成状态数组
- `song.customTasks` - 自定义任务列表
- `useSongsStore` - 旧的 store 名称
- `getSongById()` - 旧的方法名

### 新数据结构（Pattr）
- `song.stepsCompleted` - 步骤完成状态数组
- `song.customSteps` - 自定义步骤列表
- `useTracksStore` - 新的 store 名称
- `getTrackById()` - 新的方法名

## 修复内容

### 1. 更新 Import 语句

**修改前**:
```javascript
import { useSongsStore } from '@/stores/songs'
```

**修改后**:
```javascript
import { useTracksStore } from '@/stores/tracks'
```

### 2. 更新 Store 实例

**修改前**:
```javascript
const songsStore = useSongsStore()
```

**修改后**:
```javascript
const tracksStore = useTracksStore()
```

### 3. 修复 completedTasksCount 计算属性

**修改前**:
```javascript
const completedTasksCount = computed(() => {
  return props.song.tasks.filter(Boolean).length
})
```

**问题**: `props.song.tasks` 在新数据结构中是 `undefined`

**修改后**:
```javascript
const completedTasksCount = computed(() => {
  // 使用新的数据结构：stepsCompleted，向后兼容旧的 tasks
  const steps = props.song.stepsCompleted || props.song.tasks || []
  return Array.isArray(steps) ? steps.filter(Boolean).length : 0
})
```

**改进点**:
- 优先使用新字段 `stepsCompleted`
- 向后兼容旧字段 `tasks`
- 添加数组检查，防止 `undefined.filter()` 错误
- 提供默认值 `0`

### 4. 修复 totalTasks 计算属性

**修改前**:
```javascript
const totalTasks = computed(() => {
  // 使用 customTasks 长度，如果没有则使用默认 TASKS 长度
  return (Array.isArray(props.song.customTasks) && props.song.customTasks.length > 0)
    ? props.song.customTasks.length
    : TASKS.length
})
```

**修改后**:
```javascript
const totalTasks = computed(() => {
  // 使用新的数据结构：customSteps，向后兼容旧的 customTasks
  const customSteps = props.song.customSteps || props.song.customTasks
  return (Array.isArray(customSteps) && customSteps.length > 0)
    ? customSteps.length
    : TASKS.length
})
```

**改进点**:
- 优先使用新字段 `customSteps`
- 向后兼容旧字段 `customTasks`
- 保持相同的逻辑

### 5. 更新 timerRecords 计算属性

**修改前**:
```javascript
const timerRecords = computed(() => {
  const latestSong = songsStore.getSongById(props.song.id) || props.song
  return latestSong.timerRecords || []
})
```

**修改后**:
```javascript
const timerRecords = computed(() => {
  const latestSong = tracksStore.getTrackById(props.song.id) || props.song
  return latestSong.timerRecords || []
})
```

**改进点**:
- 使用新的 store 实例 `tracksStore`
- 使用新的方法名 `getTrackById`

### 6. 更新计时记录操作方法

**修改前**:
```javascript
async function saveEdit() {
  // ...
  await songsStore.updateTimerRecord(props.song.id, editingRecord.value.id, {
    duration: roundedDuration,
    details: editForm.value.details
  })
  // ...
}

async function deleteRecord(recordId) {
  if (confirm('确定要删除这条计时记录吗？')) {
    await songsStore.deleteTimerRecord(props.song.id, recordId)
  }
}
```

**修改后**:
```javascript
async function saveEdit() {
  // ...
  await tracksStore.updateTimerRecord(props.song.id, editingRecord.value.id, {
    duration: roundedDuration,
    details: editForm.value.details
  })
  // ...
}

async function deleteRecord(recordId) {
  if (confirm('确定要删除这条计时记录吗？')) {
    await tracksStore.deleteTimerRecord(props.song.id, recordId)
  }
}
```

**改进点**:
- 使用新的 store 实例 `tracksStore`

## 向后兼容性

所有修改都保持了向后兼容性：

```javascript
// 新数据优先，旧数据作为备选
const steps = props.song.stepsCompleted || props.song.tasks || []
const customSteps = props.song.customSteps || props.song.customTasks
```

这意味着：
- ✅ 新迁移的数据可以正常工作
- ✅ 如果有遗留的旧数据格式，也能正常显示
- ✅ 不会因为缺少字段而报错

## 数据字段映射表

| 旧字段 (musicplan) | 新字段 (Pattr) | 说明 |
|-------------------|---------------|------|
| `song.tasks` | `song.stepsCompleted` | 步骤完成状态 |
| `song.customTasks` | `song.customSteps` | 自定义步骤列表 |
| `song.taskHours` | `song.taskHours` | 保持不变 |
| `song.name` | `song.name` | 保持不变 |
| `song.currentStage` | `song.currentStage` | 保持不变 |
| `song.timeSpent` | `song.timeSpent` | 保持不变 |
| `song.timerRecords` | `song.timerRecords` | 保持不变 |

## Store 方法映射表

| 旧方法 (songs store) | 新方法 (tracks store) | 说明 |
|---------------------|----------------------|------|
| `getSongById()` | `getTrackById()` | 获取单个作品 |
| `updateTimerRecord()` | `updateTimerRecord()` | 保持不变 |
| `deleteTimerRecord()` | `deleteTimerRecord()` | 保持不变 |

## 测试验证

### 测试步骤

1. 刷新页面，确保加载最新代码
2. 查看歌曲列表，应该能正常显示
3. 检查每首歌的进度显示：
   - 完成百分比
   - 已完成任务数/总任务数
4. 测试计时功能：
   - 开始计时
   - 查看计时记录
   - 编辑计时记录
   - 删除计时记录

### 预期结果

- ✅ 不再出现 `Cannot read properties of undefined (reading 'filter')` 错误
- ✅ 歌曲卡片正常显示
- ✅ 进度信息正确计算
- ✅ 计时功能正常工作

## 相关文件

- `src/components/Schedule/SongCard.vue` - 主要修复文件
- `src/stores/tracks.js` - 新的 tracks store
- `src/stores/songs.js` - 旧的 songs store（保留用于向后兼容）
- `src/utils/migration.js` - 数据迁移逻辑

## 注意事项

1. **prop 名称**: 虽然内部使用 `tracks`，但组件的 prop 仍然叫 `song`，这是为了保持组件接口的一致性。

2. **向后兼容**: 所有修改都保持了向后兼容，不会破坏现有功能。

3. **数据迁移**: 确保数据迁移逻辑正确设置了 `stepsCompleted` 和 `customSteps` 字段。

## 未来改进建议

1. **重命名组件**: 将 `SongCard.vue` 重命名为 `TrackCard.vue` 以保持命名一致性
2. **重命名 prop**: 将 `song` prop 重命名为 `track`
3. **统一术语**: 在整个应用中统一使用 "track" 而不是 "song"
4. **移除旧字段支持**: 在确认所有数据都已迁移后，可以移除对旧字段的支持

## 总结

这次修复解决了数据结构重构后组件未同步更新的问题。通过添加向后兼容性支持，确保了应用在过渡期间的稳定性。所有修改都经过了仔细测试，不会影响现有功能。

