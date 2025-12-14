# 📚 Pattr 项目文档索引

欢迎查阅 Pattr 项目文档。本文档提供了所有文档的索引和说明。

## 📖 快速开始

- **[README.md](../README.md)** - 项目主文档，包含项目介绍、技术栈、功能特点和使用说明
- **[QUICK_START.md](../QUICK_START.md)** - 快速开始指南，帮助新用户快速搭建开发环境

## 📝 变更日志

位于 `changelog/` 目录：

- **[CHANGELOG.md](changelog/CHANGELOG.md)** - 完整的版本变更记录
- **[CHANGELOG_USER.md](changelog/CHANGELOG_USER.md)** - 面向用户的变更说明
- **[CHANGELOG_V2_FROM_V1.md](changelog/CHANGELOG_V2_FROM_V1.md)** - 从 v1.0 到 v2.0 的详细升级指南

## ✨ 功能文档

位于 `features/` 目录，包含各功能的详细说明和测试指南：

### 云同步功能
- **[CLOUD_SYNC_DESIGN.md](features/CLOUD_SYNC_DESIGN.md)** - 云同步设计文档
- **[CLOUD_SYNC_IMPLEMENTATION.md](features/CLOUD_SYNC_IMPLEMENTATION.md)** - 云同步实现细节
- **[CLOUD_SYNC_TEST.md](features/CLOUD_SYNC_TEST.md)** - 云同步测试指南

### 数据导入导出
- **[IMPORT_EXPORT_SUMMARY.md](features/IMPORT_EXPORT_SUMMARY.md)** - 导入导出功能说明
- **[IMPORT_EXPORT_TEST.md](features/IMPORT_EXPORT_TEST.md)** - 导入导出测试指南

### 工作流系统
- **[WORKFLOW_COMPLETE_FIX.md](features/WORKFLOW_COMPLETE_FIX.md)** - 工作流步骤完整修复说明
- **[WORKFLOW_FIX.md](features/WORKFLOW_FIX.md)** - 工作流自动应用修复
- **[WORKFLOW_OPTIMIZATION.md](features/WORKFLOW_OPTIMIZATION.md)** - 工作流步骤列表优化
- **[TEST_WORKFLOW_STEPS.md](features/TEST_WORKFLOW_STEPS.md)** - 工作流步骤测试指南

## 🔧 修复文档

位于 `fixes/` 目录，包含各种问题修复的详细记录：

- **[CALCULATIONS_FIX.md](fixes/CALCULATIONS_FIX.md)** - 计算功能修复
- **[COMPLETE_FIX.md](fixes/COMPLETE_FIX.md)** - 完整修复记录
- **[DATA_FIX_SUMMARY.md](fixes/DATA_FIX_SUMMARY.md)** - 数据修复总结
- **[DEBUG_DATA.md](fixes/DEBUG_DATA.md)** - 数据调试记录
- **[FIRESTORE_PERMISSION_FIX.md](fixes/FIRESTORE_PERMISSION_FIX.md)** - Firestore 权限修复指南
- **[QUICK_FIX_PERMISSION.md](fixes/QUICK_FIX_PERMISSION.md)** - 快速权限修复指南
- **[SELECTOR_DISPLAY_DEBUG.md](fixes/SELECTOR_DISPLAY_DEBUG.md)** - 选择器显示调试
- **[SELECTOR_IMPROVEMENTS.md](fixes/SELECTOR_IMPROVEMENTS.md)** - 选择器改进记录
- **[SONGCARD_FIX.md](fixes/SONGCARD_FIX.md)** - 歌曲卡片修复
- **[VUE_ERROR_FIX.md](fixes/VUE_ERROR_FIX.md)** - Vue 错误修复
- **[WORKSPACE_PROJECT_SELECTION.md](fixes/WORKSPACE_PROJECT_SELECTION.md)** - 工作区和项目选择逻辑说明
- **[WORKSPACE_SWITCH_FIX.md](fixes/WORKSPACE_SWITCH_FIX.md)** - 工作区切换修复

## 🚀 部署文档

位于 `deployment/` 目录，包含部署相关的详细指南：

- **[DEPLOY_SECURITY_UPDATE.md](deployment/DEPLOY_SECURITY_UPDATE.md)** - 安全更新部署指南
- **[PRODUCTION_DEPLOYMENT.md](deployment/PRODUCTION_DEPLOYMENT.md)** - 生产环境部署指南
- **[UPDATE_DEPLOY.md](deployment/UPDATE_DEPLOY.md)** - 更新部署操作指南
- **[UPDATE_STRATEGY.md](deployment/UPDATE_STRATEGY.md)** - 更新策略和用户影响评估

## 📦 历史文档

位于 `archive/` 目录，包含项目历史记录和已归档的文档：

- **[COMPONENT_UPDATES.md](archive/COMPONENT_UPDATES.md)** - 组件更新记录
- **[FINAL_MIGRATION_FIX.md](archive/FINAL_MIGRATION_FIX.md)** - 最终迁移修复
- **[PATTR_REFACTORING_SUMMARY.md](archive/PATTR_REFACTORING_SUMMARY.md)** - Pattr 重构总结
- **[PROJECT_SUMMARY.md](archive/PROJECT_SUMMARY.md)** - 项目总结（Vue 3 重构完成）
- **[RELEASE_SUMMARY.md](archive/RELEASE_SUMMARY.md)** - 发布总结
- **[SECURITY_UPDATE_2025.md](archive/SECURITY_UPDATE_2025.md)** - 2025 年安全更新详情
- **[USER_FIX_GUIDE.md](archive/USER_FIX_GUIDE.md)** - 用户修复指南
- **[VERSION_UPDATE_GUIDE.md](archive/VERSION_UPDATE_GUIDE.md)** - 版本更新机制说明

## 📂 文档结构

```
docs/
├── README.md              # 本文档（文档索引）
├── changelog/             # 变更日志
├── features/              # 功能文档
├── fixes/                 # 修复文档
├── deployment/            # 部署文档
└── archive/               # 历史文档
```

## 🔍 如何查找文档

1. **新用户**：从 [README.md](../README.md) 和 [QUICK_START.md](../QUICK_START.md) 开始
2. **了解功能**：查看 `features/` 目录下的相关文档
3. **遇到问题**：查看 `fixes/` 目录下的修复记录
4. **部署应用**：查看 `deployment/` 目录下的部署指南
5. **查看历史**：查看 `changelog/` 和 `archive/` 目录

## 📝 文档维护

- 所有文档使用 Markdown 格式
- 文档命名使用大写字母和下划线（如 `FEATURE_NAME.md`）
- 新增功能文档应放在 `features/` 目录
- 修复记录应放在 `fixes/` 目录
- 历史文档应归档到 `archive/` 目录

---

最后更新：2025-12-11
