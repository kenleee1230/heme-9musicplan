# 工作流步骤列表完整修复

## 问题根源

之前的修复只是部分完成，存在以下问题：

1. **`constants.js` 不完整**：只添加了3个项目模板和3个工作流模板，缺少 EP制作、专辑制作、混音项目等
2. **`SongModal.vue` 硬编码**：虽然修改了动态加载逻辑，但由于 `constants.js` 缺失模板，实际上还是回退到硬编码的 `TASKS`

## 完整解决方案

### 1. 补全所有项目模板

在 `src/utils/constants.js` 中添加了完整的 6 个项目模板：

- ✅ `beginner-180`: 新手音乐人计划（180天9首歌）
- ✅ `professional-custom`: 专业音乐人（自定义）
- ✅ `single-track`: 单曲制作（30-60天1首歌）
- ✅ `ep-production`: EP制作（90天4首歌）
- ✅ `album-production`: 专辑制作（180天10首歌）
- ✅ `mixing-project`: 混音项目（30天5首混音）

### 2. 补全所有工作流模板

为每个项目类型创建了专属工作流：

#### beginner-180-workflow (180天计划)
- 13个步骤，总计约40小时
- 包含完整的新曲风研究流程
- 适合新手学习

#### professional-workflow (专业音乐人)
- 9个步骤，总计约35小时
- 针对熟悉曲风，跳过研究阶段
- 效率更高

#### single-production-workflow (单曲制作)
- 11个步骤，总计约40小时
- 注重单曲质量和完整性
- 包含详细的混音母带流程

#### ep-production-workflow (EP制作)
- 9个步骤，总计约34小时
- 强调风格统一和整体性
- 平衡效率和质量

#### album-production-workflow (专辑制作)
- 10个步骤，总计约38小时
- 注重专辑概念和主题一致性
- 最专业的制作流程

#### mixing-project-workflow (混音项目)
- 11个步骤，总计约17小时
- 专注于混音和母带处理
- 适合接单或为他人混音

### 3. 验证完整性

所有项目模板都正确引用了对应的工作流：

```
✓ beginner-180 -> beginner-180-workflow
✓ professional-custom -> professional-workflow
✓ single-track -> single-production-workflow
✓ ep-production -> ep-production-workflow
✓ album-production -> album-production-workflow
✓ mixing-project -> mixing-project-workflow
```

## 测试验证

### 测试步骤

1. **创建不同类型的项目**
   ```
   - 新手音乐人计划
   - 专业音乐人
   - 单曲制作
   - EP制作
   - 专辑制作
   - 混音项目
   ```

2. **在每个项目中添加新歌**
   - 点击"添加新歌"按钮
   - 查看步骤列表

3. **验证步骤列表**
   - 新手音乐人计划：应该看到13个步骤，第一步是"新曲风前期准备"
   - 专业音乐人：应该看到9个步骤，第一步是"概念和灵感开发"
   - 单曲制作：应该看到11个步骤，第一步是"概念和灵感开发"
   - EP制作：应该看到9个步骤，第一步是"EP主题和风格定位"
   - 专辑制作：应该看到10个步骤，第一步是"专辑概念和主题开发"
   - 混音项目：应该看到11个步骤，第一步是"接收和整理素材"

### 预期结果

每个项目类型都应该显示其专属的工作流步骤列表，而不是统一的180天计划步骤。

## 技术细节

### 数据流

```
用户创建项目（选择模板）
    ↓
项目保存 templateId
    ↓
用户点击"添加新歌"
    ↓
SongModal.vue 加载
    ↓
getDefaultSteps() 函数
    ↓
读取 activeProject.templateId
    ↓
从 workflowsStore 获取对应工作流
    ↓
提取 steps 和 estimatedHours
    ↓
显示在表单中
```

### 关键代码

**SongModal.vue**
```javascript
function getDefaultSteps() {
  const activeProject = projectsStore.activeProject
  
  if (activeProject?.templateId) {
    const workflow = workflowsStore.getDefaultWorkflowForProjectType(activeProject.templateId)
    if (workflow && workflow.steps) {
      return {
        steps: workflow.steps.map(s => s.name),
        hours: workflow.steps.map(s => s.estimatedHours || 0)
      }
    }
  }
  
  // Fallback
  return {
    steps: [...TASKS],
    hours: calculateTaskHours(40, false)
  }
}
```

**workflows.js**
```javascript
function getDefaultWorkflowForProjectType(projectType) {
  const workflows = getWorkflowsForProjectType(projectType)
  
  const specificWorkflow = workflows.find(w => 
    w.projectTypes && w.projectTypes.includes(projectType)
  )
  
  if (specificWorkflow) {
    return specificWorkflow
  }
  
  return workflows[0] || WORKFLOW_TEMPLATES[0]
}
```

## 构建验证

```bash
npm run build
# ✓ built in 3.01s
# 构建成功，无错误
```

## 用户体验改进

1. **更贴合实际需求**：不同经验水平和项目类型有不同的工作流
2. **灵活可定制**：用户仍然可以自定义步骤列表
3. **专业度提升**：混音项目、专辑制作等专业场景有专门的流程
4. **学习曲线友好**：新手有详细的研究流程，专业人士有精简的流程

## 后续优化建议

1. **工作流模板库**：允许用户保存和分享自定义工作流
2. **智能推荐**：根据用户历史数据推荐合适的工作流
3. **步骤模板**：提供常用步骤的预设（如"混音"、"母带"等）
4. **时间估算优化**：根据用户实际完成时间动态调整估算

---

**修复完成时间**: 2025-12-11
**影响范围**: 所有项目类型的歌曲创建流程
**向后兼容**: ✅ 完全兼容，旧数据不受影响

