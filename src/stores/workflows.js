import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { WORKFLOW_TEMPLATES } from '@/utils/constants'

const STORAGE_KEY = 'pattr_workflows'

export const useWorkflowsStore = defineStore('workflows', () => {
  // 状态
  const customWorkflows = ref([])

  // 计算属性
  const allWorkflows = computed(() => {
    // 合并默认模板和自定义工作流
    return [...WORKFLOW_TEMPLATES, ...customWorkflows.value]
  })

  const defaultWorkflows = computed(() => {
    return WORKFLOW_TEMPLATES
  })

  // 从 localStorage 加载自定义工作流
  function loadWorkflows() {
    const saved = loadFromStorage(STORAGE_KEY, [])
    customWorkflows.value = saved
  }

  // 保存自定义工作流到 localStorage
  function saveWorkflows() {
    saveToStorage(STORAGE_KEY, customWorkflows.value)
  }

  // 创建自定义工作流
  function createWorkflow(data) {
    const workflow = {
      id: uuidv4(),
      name: data.name || '自定义工作流',
      description: data.description || '',
      isDefault: false,
      isCustom: true,
      steps: data.steps || [],
      applicableTypes: data.applicableTypes || ['song'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    customWorkflows.value.push(workflow)
    saveWorkflows()
    return workflow
  }

  // 更新自定义工作流
  function updateWorkflow(id, data) {
    const index = customWorkflows.value.findIndex(w => w.id === id)
    if (index === -1) return false

    customWorkflows.value[index] = {
      ...customWorkflows.value[index],
      ...data,
      updatedAt: new Date().toISOString()
    }

    saveWorkflows()
    return true
  }

  // 删除自定义工作流
  function deleteWorkflow(id) {
    const index = customWorkflows.value.findIndex(w => w.id === id)
    if (index === -1) return false

    customWorkflows.value.splice(index, 1)
    saveWorkflows()
    return true
  }

  // 获取工作流
  function getWorkflowById(id) {
    return allWorkflows.value.find(w => w.id === id) || null
  }

  // 从现有步骤创建工作流
  function createWorkflowFromSteps(name, steps) {
    const workflowSteps = steps.map((step, index) => ({
      name: step.name || step,
      estimatedHours: step.estimatedHours || 0,
      description: step.description || '',
      order: index
    }))

    return createWorkflow({
      name,
      steps: workflowSteps
    })
  }

  // 根据项目类型获取推荐的工作流
  function getWorkflowsForProjectType(projectType) {
    if (!projectType) {
      return allWorkflows.value
    }
    
    // 优先返回专门为该项目类型设计的工作流
    const specificWorkflows = allWorkflows.value.filter(w => 
      w.projectTypes && w.projectTypes.includes(projectType)
    )
    
    if (specificWorkflows.length > 0) {
      return specificWorkflows
    }
    
    // 如果没有专门的工作流，返回通用工作流
    return allWorkflows.value.filter(w => 
      !w.projectTypes || w.projectTypes.length === 0
    )
  }

  // 根据项目类型获取默认工作流
  function getDefaultWorkflowForProjectType(projectType) {
    const workflows = getWorkflowsForProjectType(projectType)
    
    // 优先返回专门为该项目类型设计的工作流
    const specificWorkflow = workflows.find(w => 
      w.projectTypes && w.projectTypes.includes(projectType)
    )
    
    if (specificWorkflow) {
      return specificWorkflow
    }
    
    // 否则返回第一个通用工作流
    return workflows[0] || WORKFLOW_TEMPLATES[0]
  }

  return {
    // 状态
    customWorkflows,
    // 计算属性
    allWorkflows,
    defaultWorkflows,
    // 方法
    loadWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    getWorkflowById,
    createWorkflowFromSteps,
    getWorkflowsForProjectType,
    getDefaultWorkflowForProjectType,
    saveWorkflows
  }
})

