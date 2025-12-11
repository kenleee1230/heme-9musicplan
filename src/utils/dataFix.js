/**
 * 数据修复工具
 * 用于修复数据不一致问题
 */

const PATTR_WORKSPACES_KEY = 'pattr_workspaces'
const PATTR_PROJECTS_KEY = 'pattr_projects'
const PATTR_TRACKS_KEY = 'pattr_tracks'
const PATTR_ACTIVE_WORKSPACE_KEY = 'pattr_active_workspace'
const PATTR_ACTIVE_PROJECT_KEY = 'pattr_active_project'

/**
 * 从 localStorage 加载数据
 */
function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`[DataFix] Error loading ${key}:`, error)
    return defaultValue
  }
}

/**
 * 保存数据到 localStorage
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`[DataFix] Error saving ${key}:`, error)
  }
}

/**
 * 修复数据不一致问题
 */
export function fixDataInconsistency() {
  console.log('[DataFix] Starting data consistency check...')
  
  const workspaces = loadFromStorage(PATTR_WORKSPACES_KEY, [])
  const projects = loadFromStorage(PATTR_PROJECTS_KEY, [])
  const tracks = loadFromStorage(PATTR_TRACKS_KEY, [])
  const activeWorkspaceId = loadFromStorage(PATTR_ACTIVE_WORKSPACE_KEY)
  const activeProjectId = loadFromStorage(PATTR_ACTIVE_PROJECT_KEY)
  
  let hasChanges = false
  
  // 1. 清理孤立的项目（没有对应工作区的项目）
  const validWorkspaceIds = new Set(workspaces.map(w => w.id))
  const validProjects = projects.filter(p => {
    if (!validWorkspaceIds.has(p.workspaceId)) {
      console.log(`[DataFix] Removing orphaned project: ${p.name} (workspace ${p.workspaceId} not found)`)
      hasChanges = true
      return false
    }
    return true
  })
  
  // 2. 清理孤立的作品（没有对应项目的作品）
  const validProjectIds = new Set(validProjects.map(p => p.id))
  const validTracks = tracks.filter(t => {
    if (!validProjectIds.has(t.projectId)) {
      console.log(`[DataFix] Removing orphaned track: ${t.name} (project ${t.projectId} not found)`)
      hasChanges = true
      return false
    }
    return true
  })
  
  // 3. 修复活跃工作区
  if (activeWorkspaceId && !validWorkspaceIds.has(activeWorkspaceId)) {
    console.log(`[DataFix] Active workspace ${activeWorkspaceId} not found`)
    if (workspaces.length > 0) {
      const newActiveWorkspace = workspaces[0].id
      console.log(`[DataFix] Setting active workspace to ${newActiveWorkspace}`)
      saveToStorage(PATTR_ACTIVE_WORKSPACE_KEY, newActiveWorkspace)
      hasChanges = true
    } else {
      console.log('[DataFix] No workspaces available, clearing active workspace')
      localStorage.removeItem(PATTR_ACTIVE_WORKSPACE_KEY)
      hasChanges = true
    }
  }
  
  // 4. 修复活跃项目
  if (activeProjectId && !validProjectIds.has(activeProjectId)) {
    console.log(`[DataFix] Active project ${activeProjectId} not found`)
    const currentWorkspaceId = loadFromStorage(PATTR_ACTIVE_WORKSPACE_KEY)
    if (currentWorkspaceId) {
      const workspaceProjects = validProjects.filter(p => p.workspaceId === currentWorkspaceId)
      if (workspaceProjects.length > 0) {
        const newActiveProject = workspaceProjects[0].id
        console.log(`[DataFix] Setting active project to ${newActiveProject}`)
        saveToStorage(PATTR_ACTIVE_PROJECT_KEY, newActiveProject)
        hasChanges = true
      } else {
        console.log('[DataFix] No projects in active workspace, clearing active project')
        localStorage.removeItem(PATTR_ACTIVE_PROJECT_KEY)
        hasChanges = true
      }
    } else {
      console.log('[DataFix] No active workspace, clearing active project')
      localStorage.removeItem(PATTR_ACTIVE_PROJECT_KEY)
      hasChanges = true
    }
  }
  
  // 5. 如果没有活跃项目但有项目，自动设置第一个
  if (!loadFromStorage(PATTR_ACTIVE_PROJECT_KEY) && validProjects.length > 0) {
    const currentWorkspaceId = loadFromStorage(PATTR_ACTIVE_WORKSPACE_KEY)
    if (currentWorkspaceId) {
      const workspaceProjects = validProjects.filter(p => p.workspaceId === currentWorkspaceId)
      if (workspaceProjects.length > 0) {
        console.log(`[DataFix] Auto-setting active project to ${workspaceProjects[0].id}`)
        saveToStorage(PATTR_ACTIVE_PROJECT_KEY, workspaceProjects[0].id)
        hasChanges = true
      }
    }
  }
  
  // 6. 保存清理后的数据
  if (hasChanges) {
    if (validProjects.length !== projects.length) {
      saveToStorage(PATTR_PROJECTS_KEY, validProjects)
      console.log(`[DataFix] Saved ${validProjects.length} valid projects (removed ${projects.length - validProjects.length})`)
    }
    
    if (validTracks.length !== tracks.length) {
      saveToStorage(PATTR_TRACKS_KEY, validTracks)
      console.log(`[DataFix] Saved ${validTracks.length} valid tracks (removed ${tracks.length - validTracks.length})`)
    }
    
    console.log('[DataFix] Data consistency check completed with changes')
    return true
  } else {
    console.log('[DataFix] Data consistency check completed, no changes needed')
    return false
  }
}

/**
 * 诊断数据状态
 */
export function diagnoseData() {
  console.log('=== Pattr 数据诊断 ===')
  
  const workspaces = loadFromStorage(PATTR_WORKSPACES_KEY, [])
  const projects = loadFromStorage(PATTR_PROJECTS_KEY, [])
  const tracks = loadFromStorage(PATTR_TRACKS_KEY, [])
  const activeWorkspaceId = loadFromStorage(PATTR_ACTIVE_WORKSPACE_KEY)
  const activeProjectId = loadFromStorage(PATTR_ACTIVE_PROJECT_KEY)
  
  console.log('工作区数量:', workspaces.length)
  console.log('项目数量:', projects.length)
  console.log('作品数量:', tracks.length)
  console.log('活跃工作区ID:', activeWorkspaceId)
  console.log('活跃项目ID:', activeProjectId)
  
  if (activeWorkspaceId) {
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
    console.log('活跃工作区存在:', !!activeWorkspace)
    if (activeWorkspace) {
      console.log('活跃工作区名称:', activeWorkspace.name)
      const workspaceProjects = projects.filter(p => p.workspaceId === activeWorkspaceId)
      console.log('活跃工作区的项目数:', workspaceProjects.length)
    }
  }
  
  if (activeProjectId) {
    const activeProject = projects.find(p => p.id === activeProjectId)
    console.log('活跃项目存在:', !!activeProject)
    if (activeProject) {
      console.log('活跃项目名称:', activeProject.name)
      const projectTracks = tracks.filter(t => t.projectId === activeProjectId)
      console.log('活跃项目的作品数:', projectTracks.length)
      
      if (projectTracks.length > 0) {
        console.log('作品列表:')
        projectTracks.forEach((track, index) => {
          console.log(`  ${index + 1}. ${track.name} (${track.currentStage})`)
        })
      }
    }
  }
  
  // 检查孤立数据
  const validWorkspaceIds = new Set(workspaces.map(w => w.id))
  const orphanedProjects = projects.filter(p => !validWorkspaceIds.has(p.workspaceId))
  if (orphanedProjects.length > 0) {
    console.warn('⚠️ 发现孤立项目:', orphanedProjects.length)
  }
  
  const validProjectIds = new Set(projects.map(p => p.id))
  const orphanedTracks = tracks.filter(t => !validProjectIds.has(t.projectId))
  if (orphanedTracks.length > 0) {
    console.warn('⚠️ 发现孤立作品:', orphanedTracks.length)
  }
  
  console.log('=== 诊断完成 ===')
}

// 在开发环境下暴露到全局
if (import.meta.env.DEV) {
  window.pattrDataFix = {
    fix: fixDataInconsistency,
    diagnose: diagnoseData
  }
  console.log('[DataFix] Debug tools available: window.pattrDataFix.fix() and window.pattrDataFix.diagnose()')
}

