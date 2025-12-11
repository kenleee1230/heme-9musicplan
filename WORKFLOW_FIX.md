# 🔧 工作流步骤自动应用修复

## 问题
之前虽然创建了不同的工作流模板，但创建作品时没有自动应用，仍然使用旧的 TASKS 步骤列表。

## 原因
`createTrack` 函数没有根据项目类型自动选择合适的工作流。

## 修复内容

### 修改文件
- `src/stores/tracks.js` - 更新 `createTrack` 函数

### 修复逻辑

```javascript
// 创建作品时的步骤选择逻辑（优先级从高到低）

1. 如果用户指定了 customSteps
   → 使用用户指定的步骤

2. 如果项目有 templateId
   → 根据项目模板类型获取默认工作流
   → 使用工作流的步骤和预估时长

3. 如果指定了 workflowId
   → 从工作流加载步骤和预估时长

4. 如果以上都没有
   → 使用默认的 TASKS 步骤列表（向后兼容）
```

### 代码变更

#### Before (旧代码)
```javascript
// 如果指定了工作流，从工作流加载步骤
let customSteps = data.customSteps || []
if (data.workflowId && customSteps.length === 0) {
  const workflowsStore = useWorkflowsStore()
  const workflow = workflowsStore.getWorkflowById(data.workflowId)
  if (workflow) {
    customSteps = workflow.steps.map(s => s.name)
  }
}

// 如果还是没有步骤，使用默认的
if (customSteps.length === 0) {
  customSteps = [...TASKS]
}
```

#### After (新代码)
```javascript
// 获取当前项目
const project = projectsStore.getProjectById(projectId)

let customSteps = data.customSteps || []
let workflowId = data.workflowId
let taskHours = data.taskHours

if (customSteps.length === 0) {
  // 1. 如果没有指定工作流，尝试从项目模板获取默认工作流
  if (!workflowId && project?.templateId) {
    const workflow = workflowsStore.getDefaultWorkflowForProjectType(project.templateId)
    if (workflow) {
      workflowId = workflow.id
      customSteps = workflow.steps.map(s => s.name)
      taskHours = workflow.steps.map(s => s.estimatedHours || 0)
    }
  }
  
  // 2. 如果指定了工作流ID，从工作流加载步骤
  if (workflowId && customSteps.length === 0) {
    const workflow = workflowsStore.getWorkflowById(workflowId)
    if (workflow) {
      customSteps = workflow.steps.map(s => s.name)
      taskHours = workflow.steps.map(s => s.estimatedHours || 0)
    }
  }
  
  // 3. 如果还是没有步骤，使用默认的 TASKS
  if (customSteps.length === 0) {
    customSteps = [...TASKS]
  }
}
```

## 测试步骤

### 1. 测试 180天计划项目

```
1. 创建新的"180天音乐计划"项目
2. 在该项目下创建新作品
3. 查看作品的步骤列表

预期结果：
✅ 应该看到 10 个步骤
✅ 第一步：新曲风前期准备（7小时）
✅ 最后一步：校长OK，完成制作（1小时）
```

### 2. 测试专业音乐人项目

```
1. 创建新的"专业音乐人"项目
2. 在该项目下创建新作品
3. 查看作品的步骤列表

预期结果：
✅ 应该看到 7 个步骤
✅ 第一步：确定创作方向和参考（1.5小时）
✅ 没有"新曲风前期准备"步骤
```

### 3. 测试单曲制作项目

```
1. 创建新的"单曲制作"项目
2. 在该项目下创建新作品
3. 查看作品的步骤列表

预期结果：
✅ 应该看到 11 个步骤
✅ 第一步：概念和灵感开发（3小时）
✅ 包含"多设备试听和调整"步骤
```

### 4. 测试 EP 制作项目

```
1. 创建新的"EP制作"项目
2. 在该项目下创建新作品
3. 查看作品的步骤列表

预期结果：
✅ 应该看到 9 个步骤
✅ 第一步：EP主题和风格定位（2小时）
✅ 包含"编曲审核和调整"步骤（强调风格统一）
```

### 5. 测试专辑制作项目

```
1. 创建新的"专辑制作"项目
2. 在该项目下创建新作品
3. 查看作品的步骤列表

预期结果：
✅ 应该看到 10 个步骤
✅ 第一步：专辑概念和主题开发（3小时）
✅ 包含"专辑整体审核"步骤
```

### 6. 测试混音项目

```
1. 创建新的"混音项目"
2. 在该项目下创建新作品
3. 查看作品的步骤列表

预期结果：
✅ 应该看到 11 个步骤
✅ 第一步：接收和整理素材（0.5小时）
✅ 包含"EQ处理"、"压缩和动态处理"等专业混音步骤
```

### 7. 测试向后兼容

```
1. 查看旧的作品（迁移前创建的）
2. 查看它们的步骤列表

预期结果：
✅ 旧作品保持原有的 10 个步骤不变
✅ 不会被自动修改
```

### 8. 测试自定义步骤

```
1. 创建任意类型的项目
2. 创建作品时手动指定 customSteps
3. 查看作品的步骤列表

预期结果：
✅ 使用用户指定的步骤
✅ 不使用模板的默认步骤
```

## 验证方法

### 方法 1：在浏览器中测试

1. 刷新页面
2. 按照上面的测试步骤操作
3. 在作品详情中查看步骤列表

### 方法 2：使用浏览器控制台

```javascript
// 1. 创建一个 180天计划项目
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
const tracksStore = useTracksStore()

// 假设已经有一个 180天计划项目
const project = projectsStore.projects.find(p => p.templateId === 'beginner-180')

// 2. 创建作品
const track = tracksStore.createTrack({
  name: '测试作品',
  projectId: project.id
})

// 3. 查看步骤
console.log('步骤数量:', track.customSteps.length)
console.log('步骤列表:', track.customSteps)
console.log('预估时长:', track.taskHours)
console.log('总时长:', track.estimatedHours)

// 预期输出：
// 步骤数量: 10
// 步骤列表: ['新曲风前期准备...', '确定子曲风...', ...]
// 预估时长: [7, 2, 8, 1, 12, 1, 6, 1, 1, 1]
// 总时长: 40
```

### 方法 3：检查 localStorage

```javascript
// 在浏览器控制台运行
const tracks = JSON.parse(localStorage.getItem('pattr_tracks') || '[]')
const latestTrack = tracks[tracks.length - 1]

console.log('最新作品的步骤:', latestTrack.customSteps)
console.log('步骤数量:', latestTrack.customSteps.length)
console.log('预估时长:', latestTrack.taskHours)
```

## 预期结果对照表

| 项目类型 | 步骤数 | 第一步 | 总时长 | 特殊步骤 |
|---------|--------|--------|--------|---------|
| 180天计划 | 10 | 新曲风前期准备 | 40h | 队长审核、校长审核 |
| 专业音乐人 | 7 | 确定创作方向 | 26h | Demo自审 |
| 单曲制作 | 11 | 概念和灵感开发 | 52h | 多设备试听 |
| EP制作 | 9 | EP主题和风格定位 | 34h | 风格统一审核 |
| 专辑制作 | 10 | 专辑概念开发 | 38h | 专辑整体审核 |
| 混音项目 | 11 | 接收和整理素材 | 17h | EQ、压缩、空间效果 |

## 常见问题

### Q1: 为什么我的作品还是显示旧的步骤？

**A**: 可能的原因：
1. 浏览器缓存 - 清除缓存并刷新
2. 旧作品 - 这是正常的，旧作品保持原有步骤
3. 项目没有 templateId - 检查项目是否正确创建

### Q2: 如何修改已创建作品的步骤？

**A**: 
1. 打开作品详情
2. 点击"编辑步骤"
3. 修改、添加或删除步骤
4. 保存

### Q3: 能否为作品选择不同的工作流？

**A**: 
1. 创建作品时指定 `workflowId`
2. 或创建后手动修改步骤

### Q4: 新增的工作流会影响旧数据吗？

**A**: 
不会。旧作品保持原有步骤不变，只有新创建的作品才会使用新工作流。

## 调试技巧

### 如果步骤没有正确应用

1. **检查项目模板**
   ```javascript
   const project = projectsStore.getProjectById(projectId)
   console.log('项目模板ID:', project.templateId)
   ```

2. **检查工作流**
   ```javascript
   const workflow = workflowsStore.getDefaultWorkflowForProjectType(project.templateId)
   console.log('默认工作流:', workflow)
   console.log('步骤数量:', workflow.steps.length)
   ```

3. **检查创建过程**
   - 在 `createTrack` 函数中添加 `console.log`
   - 查看步骤选择的每个分支

## 总结

### 修复前
- ❌ 所有项目使用相同的 10 个步骤
- ❌ 不区分项目类型
- ❌ 步骤不适合专业用户

### 修复后
- ✅ 每个项目类型有专门的步骤
- ✅ 自动根据项目类型选择
- ✅ 步骤数量和内容更合理
- ✅ 预估时长更准确
- ✅ 保持向后兼容

---

**状态**: ✅ 已修复  
**测试**: ⏳ 待测试  
**影响**: 所有新创建的作品

