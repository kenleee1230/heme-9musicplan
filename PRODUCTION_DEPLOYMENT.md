# 生产环境部署指南

## 🚀 已修复的关键问题

### ✅ 1. projectsStore.saveActiveProject 未导出
- **文件**: `src/stores/projects.js`
- **修复**: 在 return 语句中添加 `saveActiveProject`

### ✅ 2. 迁移逻辑完善
- **文件**: `src/utils/migration.js`
- **修复**: 
  - 使用现有工作区/项目时，正确保存 `workspace` 和 `project` 变量
  - 更新里程碑时，正确更新项目数组
  - 添加详细日志输出

### ✅ 3. 强制执行迁移
- **文件**: `src/stores/cloudSync.js`
- **修复**: 从云端加载旧数据后，强制执行 `migrateData()`

---

## 📋 部署步骤

### 步骤1：构建生产版本

```bash
cd /data/workspace/musicplan
npm run build
```

### 步骤2：部署到 Firebase Hosting

```bash
firebase deploy --only hosting
```

### 步骤3：更新 Firestore 规则

**方法A：命令行部署**
```bash
firebase deploy --only firestore:rules
```

**方法B：Firebase Console（推荐，如果命令行失败）**
1. 访问：https://console.firebase.google.com/project/heme9music/firestore/rules
2. 粘贴 `firestore.rules` 的内容
3. 点击"发布"

---

## 🧪 生产环境测试

### 测试场景1：新用户首次使用

**预期行为**：
- 创建默认工作区和项目
- 无迁移日志

### 测试场景2：老用户有云端旧数据

**预期行为**：
```
[CloudSync] 从云端加载了 X 首旧歌曲
[Migration V1] Found X songs to migrate
[Migration V1] Using existing workspace and project (或 Creating new)
[Migration V1] Successfully migrated:
  - Workspace: xxx 工作区名称
  - Project: xxx 项目名称
  - X tracks
```

**验证点**：
- ✅ 页面显示所有旧歌曲
- ✅ 歌曲数据完整（名称、进度、计时记录等）
- ✅ 工作区和项目正确关联

### 测试场景3：老用户清除本地数据后重新登录

**预期行为**：
- 从云端重新加载数据
- 如果云端有旧数据，自动迁移
- 数据完整恢复

---

## 🔍 监控和调试

### 关键日志

**成功迁移的日志**：
```
[CloudSync] 开始从云端加载数据...
[CloudSync] 检测到旧数据，开始迁移...
[CloudSync] 从云端加载了 6 首旧歌曲
[Migration V1] Found 6 songs to migrate
[Migration V1] Using existing workspace and project
[Migration V1] Migrating 6 songs to project: xxx
[Migration V1] Successfully migrated:
  - Workspace: xxx 我的工作区
  - Project: xxx 180天音乐计划
  - 6 tracks
[CloudSync] 迁移后数据:
  - 工作区: 1
  - 项目: 1
  - 作品: 6
```

**权限错误**：
```
[CloudSync] 检查新数据结构失败: FirebaseError: Missing or insufficient permissions.
```
→ 需要更新 Firestore 规则

**迁移跳过**：
```
[Migration V1] Tracks already exist, skipping migration
```
→ 正常，说明已经迁移过

---

## ⚠️ 常见问题

### 问题1：用户看不到旧数据

**排查步骤**：
1. 检查 Firebase Console 是否有 `users/{userId}/songs` 数据
2. 检查浏览器控制台是否有权限错误
3. 检查是否有迁移日志

**解决方案**：
- 如果有权限错误 → 更新 Firestore 规则
- 如果没有迁移日志 → 检查 `musicplan_songs` 是否存在
- 如果迁移后作品为0 → 检查 `migrateSongToTrack` 函数

### 问题2：迁移后数据不完整

**排查步骤**：
1. 检查控制台日志中的 tracks 数量
2. 检查 localStorage 中的 `pattr_tracks`
3. 检查 `migrateSongToTrack` 函数的字段映射

**解决方案**：
- 确保 `customTasks` → `customSteps` 映射正确
- 确保 `tasks` → `stepsCompleted` 映射正确
- 确保 `timerRecords` 正确复制

### 问题3：多次迁移导致重复数据

**原因**：迁移逻辑会检查 `existingTracks.length > 0`，如果有作品就跳过。

**预防**：
- 第65行的检查确保不会重复迁移
- 如果需要重新迁移，清除 `pattr_tracks`

---

## 📊 数据迁移映射

### 旧数据结构 → 新数据结构

```javascript
// 旧 Song
{
  id: string,
  name: string,
  genre: string,
  customTasks: string[],      // → customSteps
  tasks: boolean[],            // → stepsCompleted
  taskHours: number[],
  estimatedHours: number,
  timeSpent: number,
  timerRecords: array,
  startDate: string,
  currentStage: string,
  notes: string,
  isNewGenre: boolean
}

// 新 Track
{
  id: string,
  projectId: string,           // 新增：关联项目
  name: string,
  type: 'song',
  workflowId: null,
  customSteps: string[],       // 从 customTasks
  stepsCompleted: boolean[],   // 从 tasks
  taskHours: number[],
  startDate: string,
  deadline: null,
  estimatedHours: number,
  timeSpent: number,
  timerRecords: array,
  metadata: {                  // 新增：元数据对象
    genre: string,
    isNewGenre: boolean,
    notes: string,
    bpm: null,
    key: null
  },
  createdAt: string,
  updatedAt: string
}
```

---

## 🎯 回滚计划

如果部署后出现严重问题：

### 快速回滚

```bash
# 回滚到上一个版本
firebase hosting:rollback

# 或部署之前的构建
firebase deploy --only hosting
```

### 数据恢复

如果用户数据出现问题：

1. **从云端恢复**：旧数据仍在 `users/{userId}/songs`
2. **导出功能**：用户可以使用"导出数据"功能备份
3. **手动迁移**：提供迁移脚本给用户

---

## ✅ 部署检查清单

部署前：
- [ ] 代码已构建成功 (`npm run build`)
- [ ] 所有测试通过
- [ ] Firestore 规则已更新
- [ ] 迁移逻辑已测试

部署后：
- [ ] 新用户可以正常注册和使用
- [ ] 老用户可以看到旧数据
- [ ] 迁移日志正常
- [ ] 无控制台错误
- [ ] 数据完整性验证

---

## 📞 紧急联系

如果出现严重问题：
1. 立即回滚部署
2. 检查 Firebase Console 的错误日志
3. 检查用户反馈
4. 必要时提供手动迁移工具

---

**最后更新**: 2025-12-11
**版本**: 2.0.0
**状态**: ✅ 准备部署

