# 组件更新说明 - 修复数据显示问题

## 问题描述
登录读取数据后，时间线规划和甘特图显示旧数据，但歌曲列表为空。

## 根本原因
Schedule 相关组件仍在使用旧的 `useSongsStore` 和 `useSettingsStore`，而新架构使用的是 `useTracksStore` 和 `useProjectsStore`。

## 已修复的组件

### 1. TimelineView.vue ✅
**变更**:
- 从 `useSongsStore` 迁移到 `useTracksStore`
- 从 `useSettingsStore` 迁移到 `useProjectsStore`
- 使用 `projectTracks` 获取当前项目的作品
- 从 `activeProject` 获取项目设置（开始日期、截止日期、每日工作时长）
- 添加项目检查：如果没有选中项目，显示提示

**新逻辑**:
```javascript
const { projectTracks: songs } = storeToRefs(tracksStore)
const { activeProject } = storeToRefs(projectsStore)

const startDate = computed(() => activeProject.value?.startDate || null)
const deadline = computed(() => activeProject.value?.deadline || null)
const dailyMakingHours = computed(() => activeProject.value?.settings?.dailyHours || 2)
```

### 2. GanttChart.vue ✅
**变更**:
- 从 `useSongsStore` 迁移到 `useTracksStore`
- 从 `useSettingsStore` 迁移到 `useProjectsStore`
- 使用项目的截止日期计算甘特图时间范围
- 添加项目检查

**新逻辑**:
- 如果项目有截止日期，使用截止日期作为项目结束日期
- 如果没有截止日期，默认使用开始日期 + 180天

### 3. ProjectView.vue ✅
**变更**:
- 从 `useSongsStore` 迁移到 `useTracksStore`
- 使用 `activeProject.targetCount` 作为目标数量
- 添加项目检查

**新逻辑**:
```javascript
const TARGET_SONGS = computed(() => activeProject.value?.targetCount || 9)
```

### 4. DailyPlanView.vue ✅
**变更**:
- 从 `useSongsStore` 迁移到 `useTracksStore`
- 从 `useSettingsStore` 迁移到 `useProjectsStore`
- 使用项目设置生成每日计划
- 添加项目检查

### 5. SongCard.vue (已兼容)
- 已经通过 `useSongsStore` 别名兼容
- 无需修改

### 6. SongModal.vue (已兼容)
- 已经通过 `useSongsStore` 别名兼容
- 无需修改

### 7. TimerRecordsModal.vue (已兼容)
- 已经通过 `useSongsStore` 别名兼容
- 无需修改

## 空状态提示

所有组件现在都会检查是否有活跃项目：

```vue
<div v-if="!hasProject" class="empty-state">
  <p>请先选择或创建一个项目</p>
</div>

<div v-else-if="songs.length === 0" class="empty-state">
  <p>还没有添加作品</p>
</div>
```

## 数据流

```
用户登录
  ↓
加载数据 (workspaces, projects, tracks)
  ↓
数据迁移 (如果需要)
  ↓
设置活跃工作区和项目
  ↓
组件通过 projectTracks 获取当前项目的作品
  ↓
显示正确的数据
```

## 测试建议

1. **新用户测试**:
   - 登录后应自动创建默认工作区
   - 如果有旧数据，应自动迁移并创建默认项目
   - 所有视图应显示迁移后的数据

2. **切换项目测试**:
   - 切换项目后，所有视图应更新显示新项目的数据
   - 时间线、甘特图、每日计划应使用新项目的设置

3. **空状态测试**:
   - 没有项目时，应显示"请先选择或创建一个项目"
   - 项目没有作品时，应显示"还没有添加作品"

## 注意事项

- 所有 Schedule 组件现在都依赖于 `activeProject`
- 如果没有活跃项目，组件会显示空状态提示
- 用户需要先选择或创建项目才能添加作品
- 数据迁移会自动创建默认项目，所以现有用户不会看到空状态

## 向后兼容

- `useTracksStore` 导出了 `useSongsStore` 别名
- 旧的组件可以继续使用 `useSongsStore`
- 但建议逐步迁移到新的 store 结构

