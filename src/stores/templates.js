import { defineStore } from 'pinia'
import { computed } from 'vue'
import { PROJECT_TEMPLATES } from '@/utils/constants'
import { useProjectsStore } from './projects'
import { useWorkflowsStore } from './workflows'

export const useTemplatesStore = defineStore('templates', () => {
  // 计算属性
  const templates = computed(() => PROJECT_TEMPLATES)

  // 应用模板创建项目
  function applyTemplate(templateId, customData = {}) {
    const template = templates.value.find(t => t.id === templateId)
    if (!template) {
      console.error('Template not found:', templateId)
      return null
    }

    const projectsStore = useProjectsStore()
    
    // 合并模板数据和自定义数据
    const projectData = {
      name: customData.name || template.defaultName,
      type: template.type,
      templateId: template.id,
      description: customData.description || template.description,
      startDate: customData.startDate || new Date().toISOString(),
      deadline: customData.deadline || calculateDeadline(template, customData.startDate),
      targetCount: customData.targetCount || template.defaultTargetCount,
      settings: {
        dailyHours: customData.dailyHours || template.defaultDailyHours,
        autoSchedule: customData.autoSchedule !== undefined ? customData.autoSchedule : template.autoSchedule
      },
      milestones: customData.milestones || generateDefaultMilestones(template),
      goals: customData.goals || []
    }

    return projectsStore.createProject(projectData)
  }

  // 计算截止日期
  function calculateDeadline(template, startDate) {
    if (!template.defaultDuration) return null
    
    const start = startDate ? new Date(startDate) : new Date()
    const deadline = new Date(start)
    deadline.setDate(deadline.getDate() + template.defaultDuration)
    return deadline.toISOString()
  }

  // 生成默认里程碑
  function generateDefaultMilestones(template) {
    if (!template.defaultMilestones) return []
    
    return template.defaultMilestones.map(m => ({
      name: m.name,
      targetDate: null,
      completed: false,
      description: m.description || ''
    }))
  }

  // 获取模板
  function getTemplateById(id) {
    return templates.value.find(t => t.id === id) || null
  }

  // 获取适用于特定类型的模板
  function getTemplatesByType(type) {
    return templates.value.filter(t => !type || t.type === type)
  }

  return {
    // 计算属性
    templates,
    // 方法
    applyTemplate,
    getTemplateById,
    getTemplatesByType
  }
})

