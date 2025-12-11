/**
 * 数据导入导出功能
 * 支持完整的工作区、项目和作品数据
 */

import { useWorkspacesStore } from '@/stores/workspaces'
import { useProjectsStore } from '@/stores/projects'
import { useTracksStore } from '@/stores/tracks'

export function useDataExport() {
  /**
   * 导出完整数据
   */
  function exportAllData() {
    const workspacesStore = useWorkspacesStore()
    const projectsStore = useProjectsStore()
    const tracksStore = useTracksStore()

    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      workspaces: workspacesStore.workspaces,
      projects: projectsStore.projects,
      tracks: tracksStore.tracks,
      activeWorkspaceId: workspacesStore.activeWorkspaceId,
      activeProjectId: projectsStore.activeProjectId
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * 导入完整数据
   */
  function importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString)

      // 验证数据格式
      if (!data.version) {
        return { success: false, error: '无效的数据格式：缺少版本信息' }
      }

      const workspacesStore = useWorkspacesStore()
      const projectsStore = useProjectsStore()
      const tracksStore = useTracksStore()

      let importedWorkspaces = 0
      let importedProjects = 0
      let importedTracks = 0

      // 导入工作区
      if (data.workspaces && Array.isArray(data.workspaces)) {
        data.workspaces.forEach(workspace => {
          const existing = workspacesStore.workspaces.find(w => w.id === workspace.id)
          
          if (existing) {
            // 如果已存在，根据更新时间决定是否覆盖
            if (new Date(workspace.updatedAt) > new Date(existing.updatedAt)) {
              Object.assign(existing, workspace)
              importedWorkspaces++
            }
          } else {
            workspacesStore.workspaces.push(workspace)
            importedWorkspaces++
          }
        })
        workspacesStore.saveWorkspaces()
      }

      // 导入项目
      if (data.projects && Array.isArray(data.projects)) {
        data.projects.forEach(project => {
          const existing = projectsStore.projects.find(p => p.id === project.id)
          
          if (existing) {
            if (new Date(project.updatedAt) > new Date(existing.updatedAt)) {
              Object.assign(existing, project)
              importedProjects++
            }
          } else {
            projectsStore.projects.push(project)
            importedProjects++
          }
        })
        projectsStore.saveProjects()
      }

      // 导入作品
      if (data.tracks && Array.isArray(data.tracks)) {
        data.tracks.forEach(track => {
          const existing = tracksStore.tracks.find(t => t.id === track.id)
          
          if (existing) {
            if (new Date(track.updatedAt) > new Date(existing.updatedAt)) {
              Object.assign(existing, track)
              importedTracks++
            }
          } else {
            tracksStore.tracks.push(track)
            importedTracks++
          }
        })
        tracksStore.saveTracks()
      }

      // 恢复活跃状态（如果当前没有选中）
      if (!workspacesStore.activeWorkspaceId && data.activeWorkspaceId) {
        workspacesStore.setActiveWorkspace(data.activeWorkspaceId)
      }
      
      if (!projectsStore.activeProjectId && data.activeProjectId) {
        projectsStore.setActiveProject(data.activeProjectId)
      }

      return {
        success: true,
        workspaces: importedWorkspaces,
        projects: importedProjects,
        tracks: importedTracks
      }
    } catch (error) {
      console.error('导入数据失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 下载导出文件
   */
  function downloadExport() {
    const data = exportAllData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pattr-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 上传导入文件
   */
  function uploadImport(callback) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = importAllData(event.target.result)
          callback(result)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  /**
   * 导出当前项目的数据
   */
  function exportCurrentProject() {
    const projectsStore = useProjectsStore()
    const tracksStore = useTracksStore()

    const currentProject = projectsStore.activeProject
    if (!currentProject) {
      return null
    }

    const projectTracks = tracksStore.tracks.filter(t => t.projectId === currentProject.id)

    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportType: 'project',
      project: currentProject,
      tracks: projectTracks
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * 下载当前项目
   */
  function downloadCurrentProject() {
    const data = exportCurrentProject()
    if (!data) {
      alert('请先选择一个项目')
      return
    }

    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const projectsStore = useProjectsStore()
    const projectName = projectsStore.activeProject?.name || 'project'
    a.download = `pattr-${projectName}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    exportAllData,
    importAllData,
    downloadExport,
    uploadImport,
    exportCurrentProject,
    downloadCurrentProject
  }
}

