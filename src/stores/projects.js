import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { useWorkspacesStore } from './workspaces'
import { useTracksStore } from './tracks'

const STORAGE_KEY = 'pattr_projects'
const ACTIVE_PROJECT_KEY = 'pattr_active_project'

export const useProjectsStore = defineStore('projects', () => {
  // 状态
  const projects = ref([])
  const activeProjectId = ref(null)

  // 计算属性
  const activeProject = computed(() => {
    const workspacesStore = useWorkspacesStore()
    const project = projects.value.find(p => p.id === activeProjectId.value)
    
    // 检查项目是否属于当前活跃的工作区
    if (project && workspacesStore.activeWorkspaceId) {
      if (project.workspaceId === workspacesStore.activeWorkspaceId) {
        return project
      } else {
        // 项目不属于当前工作区，返回 null
        return null
      }
    }
    
    return project || null
  })

  const workspaceProjects = computed(() => {
    const workspacesStore = useWorkspacesStore()
    const workspaceId = workspacesStore.activeWorkspaceId
    if (!workspaceId) return []
    
    return projects.value.filter(p => p.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  })

  // 从 localStorage 加载项目
  function loadProjects() {
    const savedProjects = loadFromStorage(STORAGE_KEY, [])
    projects.value = savedProjects
    console.log('[ProjectsStore] Loaded', projects.value.length, 'projects')

    // 加载活跃项目
    const savedActiveId = loadFromStorage(ACTIVE_PROJECT_KEY)
    console.log('[ProjectsStore] Saved active project ID:', savedActiveId)
    
    if (savedActiveId && projects.value.find(p => p.id === savedActiveId)) {
      activeProjectId.value = savedActiveId
      console.log('[ProjectsStore] Restored active project:', activeProject.value?.name)
    } else if (projects.value.length > 0) {
      activeProjectId.value = projects.value[0].id
      console.log('[ProjectsStore] Set first project as active:', activeProject.value?.name)
    } else {
      console.log('[ProjectsStore] No projects available')
    }
  }

  // 保存项目到 localStorage
  function saveProjects() {
    saveToStorage(STORAGE_KEY, projects.value)
  }

  // 保存活跃项目
  function saveActiveProject() {
    saveToStorage(ACTIVE_PROJECT_KEY, activeProjectId.value)
  }

  // 创建项目
  function createProject(data) {
    const workspacesStore = useWorkspacesStore()
    const workspaceId = data.workspaceId || workspacesStore.activeWorkspaceId

    if (!workspaceId) {
      console.error('No workspace selected')
      return null
    }

    const project = {
      id: uuidv4(),
      workspaceId,
      name: data.name || '新项目',
      type: data.type || 'album', // album, ep, single, custom
      templateId: data.templateId || null,
      description: data.description || '',
      startDate: data.startDate || new Date().toISOString(),
      deadline: data.deadline || null,
      targetCount: data.targetCount || null,
      settings: {
        dailyHours: data.settings?.dailyHours || 2,
        autoSchedule: data.settings?.autoSchedule !== false
      },
      milestones: data.milestones || [],
      goals: data.goals || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    projects.value.push(project)
    saveProjects()

    // 如果是当前工作区的第一个项目，自动设为活跃
    if (workspaceProjects.value.length === 1) {
      setActiveProject(project.id)
    }

    return project
  }

  // 更新项目
  function updateProject(id, data) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index === -1) return false

    projects.value[index] = {
      ...projects.value[index],
      ...data,
      updatedAt: new Date().toISOString()
    }

    saveProjects()
    return true
  }

  // 删除项目
  function deleteProject(id) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index === -1) return false

    const deletingProject = projects.value[index]
    
    // 如果删除的是活跃项目，先切换到其他项目
    if (activeProjectId.value === id) {
      const remaining = projects.value.filter(p => p.id !== id && p.workspaceId === deletingProject.workspaceId)
      if (remaining.length > 0) {
        // 先切换到其他项目
        activeProjectId.value = remaining[0].id
        saveActiveProject()
      } else {
        // 没有其他项目，清空活跃项目
        activeProjectId.value = null
        saveActiveProject()
      }
    }

    // 使用 nextTick 确保响应式更新完成后再删除
    // 这样可以避免 Vue 在更新组件时访问到 null 引用
    setTimeout(() => {
      // 删除项目
      projects.value.splice(index, 1)
      saveProjects()
    }, 0)

    return true
  }

  // 设置活跃项目
  function setActiveProject(id) {
    if (projects.value.find(p => p.id === id)) {
      activeProjectId.value = id
      saveActiveProject()
      return true
    }
    return false
  }

  // 获取项目
  function getProjectById(id) {
    return projects.value.find(p => p.id === id) || null
  }

  // 获取工作区的项目
  function getProjectsByWorkspace(workspaceId) {
    return projects.value.filter(p => p.workspaceId === workspaceId)
  }

  // 删除工作区下的所有项目（级联删除）
  function deleteProjectsByWorkspaceId(workspaceId) {
    const tracksStore = useTracksStore()
    const workspaceProjects = getProjectsByWorkspace(workspaceId)
    
    // 先删除每个项目下的所有作品
    workspaceProjects.forEach(project => {
      tracksStore.deleteTracksByProject(project.id)
    })
    
    // 再删除所有项目
    projects.value = projects.value.filter(p => p.workspaceId !== workspaceId)
    saveProjects()
    
    // 如果删除的项目中包含活跃项目，清除活跃项目
    if (workspaceProjects.some(p => p.id === activeProjectId.value)) {
      activeProjectId.value = null
      saveActiveProject()
    }
    
    return true
  }

  // 添加里程碑
  function addMilestone(projectId, milestone) {
    const project = getProjectById(projectId)
    if (!project) return false

    const newMilestone = {
      id: uuidv4(),
      name: milestone.name,
      targetDate: milestone.targetDate || null,
      completed: false,
      completedAt: null,
      description: milestone.description || ''
    }

    project.milestones.push(newMilestone)
    project.updatedAt = new Date().toISOString()
    saveProjects()
    return true
  }

  // 更新里程碑
  function updateMilestone(projectId, milestoneId, data) {
    const project = getProjectById(projectId)
    if (!project) return false

    const milestone = project.milestones.find(m => m.id === milestoneId)
    if (!milestone) return false

    Object.assign(milestone, data)
    project.updatedAt = new Date().toISOString()
    saveProjects()
    return true
  }

  // 删除里程碑
  function deleteMilestone(projectId, milestoneId) {
    const project = getProjectById(projectId)
    if (!project) return false

    const index = project.milestones.findIndex(m => m.id === milestoneId)
    if (index === -1) return false

    project.milestones.splice(index, 1)
    project.updatedAt = new Date().toISOString()
    saveProjects()
    return true
  }

  return {
    // 状态
    projects,
    activeProjectId,
    // 计算属性
    activeProject,
    workspaceProjects,
    // 方法
    loadProjects,
    saveActiveProject,
    createProject,
    updateProject,
    deleteProject,
    deleteProjectsByWorkspaceId,
    setActiveProject,
    getProjectById,
    getProjectsByWorkspace,
    saveProjects,
    addMilestone,
    updateMilestone,
    deleteMilestone
  }
})

