# 数据调试指南

## 问题：歌曲列表为空

### 检查步骤

#### 1. 打开浏览器控制台
按 F12 或右键 → 检查 → Console

#### 2. 检查 localStorage 数据

```javascript
// 检查旧数据
console.log('旧歌曲数据:', localStorage.getItem('musicplan_songs'))

// 检查新数据
console.log('工作区:', localStorage.getItem('pattr_workspaces'))
console.log('项目:', localStorage.getItem('pattr_projects'))
console.log('作品:', localStorage.getItem('pattr_tracks'))

// 检查活跃项目
console.log('活跃项目ID:', localStorage.getItem('pattr_active_project'))
console.log('活跃工作区ID:', localStorage.getItem('pattr_active_workspace'))
```

#### 3. 检查迁移状态

```javascript
console.log('迁移版本:', localStorage.getItem('pattr_migration_version'))
```

### 常见问题和解决方案

#### 问题 1: 数据已迁移但列表为空

**原因**: 活跃项目ID可能不正确

**解决方案**:
```javascript
// 在控制台执行
const projects = JSON.parse(localStorage.getItem('pattr_projects') || '[]')
const tracks = JSON.parse(localStorage.getItem('pattr_tracks') || '[]')

console.log('所有项目:', projects)
console.log('所有作品:', tracks)

// 如果有数据但列表为空，手动设置活跃项目
if (projects.length > 0) {
  localStorage.setItem('pattr_active_project', projects[0].id)
  console.log('已设置活跃项目:', projects[0].id)
  location.reload()
}
```

#### 问题 2: 迁移未执行

**原因**: 迁移版本已设置但数据未正确迁移

**解决方案**:
```javascript
// 重置迁移状态
localStorage.removeItem('pattr_migration_version')
console.log('已重置迁移状态，刷新页面将重新迁移')
location.reload()
```

#### 问题 3: 数据格式错误

**原因**: customSteps 或 stepsCompleted 数据不正确

**解决方案**:
```javascript
// 检查作品数据格式
const tracks = JSON.parse(localStorage.getItem('pattr_tracks') || '[]')
tracks.forEach((track, index) => {
  console.log(`作品 ${index + 1}:`, {
    name: track.name,
    projectId: track.projectId,
    customSteps: track.customSteps?.length || 0,
    stepsCompleted: track.stepsCompleted?.length || 0
  })
})
```

### 完全重置数据

**警告**: 这将删除所有数据！

```javascript
// 删除所有 Pattr 数据
localStorage.removeItem('pattr_workspaces')
localStorage.removeItem('pattr_projects')
localStorage.removeItem('pattr_tracks')
localStorage.removeItem('pattr_workflows')
localStorage.removeItem('pattr_active_workspace')
localStorage.removeItem('pattr_active_project')
localStorage.removeItem('pattr_migration_version')

console.log('已清除所有 Pattr 数据')
location.reload()
```

### 手动创建测试数据

```javascript
// 创建测试工作区
const workspace = {
  id: 'test-workspace-1',
  name: '测试工作区',
  description: '测试用',
  color: '#1a1a1a',
  settings: { timezone: 'Asia/Shanghai', defaultDailyHours: 2 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 创建测试项目
const project = {
  id: 'test-project-1',
  workspaceId: 'test-workspace-1',
  name: '测试项目',
  type: 'album',
  templateId: 'beginner-180',
  startDate: new Date().toISOString(),
  deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  targetCount: 3,
  settings: { dailyHours: 2, autoSchedule: true },
  milestones: [],
  goals: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 创建测试作品
const track = {
  id: 'test-track-1',
  projectId: 'test-project-1',
  name: '测试歌曲',
  type: 'song',
  workflowId: null,
  customSteps: ['步骤1', '步骤2', '步骤3'],
  stepsCompleted: [true, false, false],
  taskHours: [10, 10, 10],
  startDate: new Date().toISOString(),
  deadline: null,
  estimatedHours: 30,
  timeSpent: 5,
  timerRecords: [],
  currentStage: 'Demo制作',
  metadata: { genre: 'Pop', bpm: null, key: null, notes: '', isNewGenre: false },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 保存数据
localStorage.setItem('pattr_workspaces', JSON.stringify([workspace]))
localStorage.setItem('pattr_projects', JSON.stringify([project]))
localStorage.setItem('pattr_tracks', JSON.stringify([track]))
localStorage.setItem('pattr_active_workspace', 'test-workspace-1')
localStorage.setItem('pattr_active_project', 'test-project-1')

console.log('已创建测试数据')
location.reload()
```

### 查看 Vue DevTools

如果安装了 Vue DevTools:
1. 打开 DevTools
2. 切换到 Vue 标签
3. 查看 Pinia stores:
   - workspaces
   - projects
   - tracks
4. 检查 activeWorkspaceId 和 activeProjectId

### 检查数据流

```javascript
// 在控制台监听数据变化
const originalSetItem = localStorage.setItem
localStorage.setItem = function(key, value) {
  if (key.startsWith('pattr_')) {
    console.log('localStorage 更新:', key, value)
  }
  originalSetItem.apply(this, arguments)
}
```

## 快速修复脚本

复制以下代码到控制台执行：

```javascript
(function() {
  console.log('=== Pattr 数据诊断 ===')
  
  // 检查旧数据
  const oldSongs = localStorage.getItem('musicplan_songs')
  console.log('旧歌曲数据存在:', !!oldSongs)
  if (oldSongs) {
    const songs = JSON.parse(oldSongs)
    console.log('旧歌曲数量:', songs.length)
  }
  
  // 检查新数据
  const workspaces = JSON.parse(localStorage.getItem('pattr_workspaces') || '[]')
  const projects = JSON.parse(localStorage.getItem('pattr_projects') || '[]')
  const tracks = JSON.parse(localStorage.getItem('pattr_tracks') || '[]')
  
  console.log('工作区数量:', workspaces.length)
  console.log('项目数量:', projects.length)
  console.log('作品数量:', tracks.length)
  
  // 检查活跃状态
  const activeWorkspaceId = localStorage.getItem('pattr_active_workspace')
  const activeProjectId = localStorage.getItem('pattr_active_project')
  
  console.log('活跃工作区ID:', activeWorkspaceId)
  console.log('活跃项目ID:', activeProjectId)
  
  // 验证活跃项目是否存在
  if (activeProjectId) {
    const activeProject = projects.find(p => p.id === activeProjectId)
    console.log('活跃项目存在:', !!activeProject)
    if (activeProject) {
      const projectTracks = tracks.filter(t => t.projectId === activeProjectId)
      console.log('活跃项目的作品数量:', projectTracks.length)
    }
  }
  
  // 修复建议
  if (tracks.length > 0 && !activeProjectId) {
    console.warn('⚠️ 有作品但没有活跃项目，尝试自动修复...')
    if (projects.length > 0) {
      localStorage.setItem('pattr_active_project', projects[0].id)
      console.log('✅ 已设置活跃项目，请刷新页面')
    }
  }
  
  if (projects.length > 0 && !activeWorkspaceId) {
    console.warn('⚠️ 有项目但没有活跃工作区，尝试自动修复...')
    if (workspaces.length > 0) {
      localStorage.setItem('pattr_active_workspace', workspaces[0].id)
      console.log('✅ 已设置活跃工作区，请刷新页面')
    }
  }
  
  console.log('=== 诊断完成 ===')
})()
```

