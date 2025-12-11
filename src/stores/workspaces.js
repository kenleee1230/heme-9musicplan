import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

const STORAGE_KEY = 'pattr_workspaces'
const ACTIVE_WORKSPACE_KEY = 'pattr_active_workspace'

export const useWorkspacesStore = defineStore('workspaces', () => {
  // 状态
  const workspaces = ref([])
  const activeWorkspaceId = ref(null)

  // 计算属性
  const activeWorkspace = computed(() => {
    return workspaces.value.find(w => w.id === activeWorkspaceId.value) || null
  })

  const sortedWorkspaces = computed(() => {
    return [...workspaces.value].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  })

  // 从 localStorage 加载工作区
  function loadWorkspaces() {
    const savedWorkspaces = loadFromStorage(STORAGE_KEY, [])
    workspaces.value = savedWorkspaces
    console.log('[WorkspacesStore] Loaded', workspaces.value.length, 'workspaces')

    // 加载活跃工作区
    const savedActiveId = loadFromStorage(ACTIVE_WORKSPACE_KEY)
    console.log('[WorkspacesStore] Saved active workspace ID:', savedActiveId)
    
    if (savedActiveId && workspaces.value.find(w => w.id === savedActiveId)) {
      activeWorkspaceId.value = savedActiveId
      console.log('[WorkspacesStore] Restored active workspace:', activeWorkspace.value?.name)
    } else if (workspaces.value.length > 0) {
      activeWorkspaceId.value = workspaces.value[0].id
      console.log('[WorkspacesStore] Set first workspace as active:', activeWorkspace.value?.name)
    } else {
      console.log('[WorkspacesStore] No workspaces available')
    }
  }

  // 保存工作区到 localStorage
  function saveWorkspaces() {
    saveToStorage(STORAGE_KEY, workspaces.value)
    
    // 如果用户已登录，同步到云端
    syncToCloudIfAuthenticated()
  }

  // 保存活跃工作区
  function saveActiveWorkspace() {
    saveToStorage(ACTIVE_WORKSPACE_KEY, activeWorkspaceId.value)
  }
  
  // 同步到云端（如果已登录）
  async function syncToCloudIfAuthenticated() {
    try {
      const { useAuthStore } = await import('./auth')
      const { useCloudSyncStore } = await import('./cloudSync')
      
      const authStore = useAuthStore()
      if (authStore.isAuthenticated && navigator.onLine) {
        const cloudSyncStore = useCloudSyncStore()
        // 异步同步，不阻塞UI
        cloudSyncStore.syncWorkspacesToCloud(authStore.user.uid, workspaces.value).catch(err => {
          console.error('[WorkspacesStore] 同步到云端失败:', err)
        })
      }
    } catch (error) {
      // 忽略导入错误
    }
  }

  // 创建工作区
  function createWorkspace(data) {
    const workspace = {
      id: uuidv4(),
      name: data.name || '新工作区',
      description: data.description || '',
      color: data.color || '#1a1a1a',
      settings: {
        timezone: data.settings?.timezone || 'Asia/Shanghai',
        defaultDailyHours: data.settings?.defaultDailyHours || 2
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    workspaces.value.push(workspace)
    saveWorkspaces()

    // 如果是第一个工作区，自动设为活跃
    if (workspaces.value.length === 1) {
      setActiveWorkspace(workspace.id)
    }

    return workspace
  }

  // 更新工作区
  function updateWorkspace(id, data) {
    const index = workspaces.value.findIndex(w => w.id === id)
    if (index === -1) return false

    workspaces.value[index] = {
      ...workspaces.value[index],
      ...data,
      updatedAt: new Date().toISOString()
    }

    saveWorkspaces()
    return true
  }

  // 删除工作区
  function deleteWorkspace(id) {
    const index = workspaces.value.findIndex(w => w.id === id)
    if (index === -1) return false

    // 如果删除的是活跃工作区，先切换到其他工作区
    if (activeWorkspaceId.value === id) {
      const remaining = workspaces.value.filter(w => w.id !== id)
      if (remaining.length > 0) {
        activeWorkspaceId.value = remaining[0].id
        saveActiveWorkspace()
      } else {
        activeWorkspaceId.value = null
        saveActiveWorkspace()
      }
    }

    // 使用 setTimeout 确保响应式更新完成后再删除
    setTimeout(() => {
      workspaces.value.splice(index, 1)
      saveWorkspaces()
    }, 0)

    return true
  }

  // 设置活跃工作区
  function setActiveWorkspace(id) {
    if (workspaces.value.find(w => w.id === id)) {
      activeWorkspaceId.value = id
      saveActiveWorkspace()
      
      // 切换工作区时，自动切换到该工作区下的第一个项目
      switchToWorkspaceFirstProject(id)
      
      return true
    }
    return false
  }
  
  // 切换到工作区的第一个项目
  async function switchToWorkspaceFirstProject(workspaceId) {
    try {
      const { useProjectsStore } = await import('./projects')
      const projectsStore = useProjectsStore()
      
      // 获取该工作区下的所有项目
      const workspaceProjects = projectsStore.getProjectsByWorkspace(workspaceId)
      
      if (workspaceProjects.length > 0) {
        // 切换到第一个项目
        projectsStore.setActiveProject(workspaceProjects[0].id)
        console.log('[WorkspacesStore] 切换到工作区的第一个项目:', workspaceProjects[0].name)
      } else {
        // 如果该工作区没有项目，清空活跃项目
        projectsStore.activeProjectId = null
        projectsStore.saveActiveProject()
        console.log('[WorkspacesStore] 该工作区没有项目，已清空活跃项目')
      }
    } catch (error) {
      console.error('[WorkspacesStore] 切换项目失败:', error)
    }
  }

  // 获取工作区
  function getWorkspaceById(id) {
    return workspaces.value.find(w => w.id === id) || null
  }

  return {
    // 状态
    workspaces,
    activeWorkspaceId,
    // 计算属性
    activeWorkspace,
    sortedWorkspaces,
    // 方法
    loadWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setActiveWorkspace,
    getWorkspaceById,
    saveWorkspaces
  }
})

