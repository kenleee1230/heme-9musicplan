/**
 * 云同步 Store - 支持新数据结构 (Workspaces, Projects, Tracks)
 * 
 * 功能：
 * 1. 登录后自动从云端加载数据
 * 2. 本地修改后自动同步到云端
 * 3. 向后兼容旧版本数据（songs）
 * 4. 处理数据冲突
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from './auth'
import { useWorkspacesStore } from './workspaces'
import { useProjectsStore } from './projects'
import { useTracksStore } from './tracks'
import { useSongsStore } from './songs'
import { needsMigration, migrateData } from '@/utils/migration'

export const useCloudSyncStore = defineStore('cloudSync', () => {
  // 状态
  const isSyncing = ref(false)
  const lastSyncTime = ref(null)
  const syncError = ref(null)
  const syncStatus = ref('idle') // idle, syncing, success, error
  const syncProgress = ref({ current: 0, total: 0, message: '' })

  // 计算属性
  const lastSyncTimeFormatted = computed(() => {
    if (!lastSyncTime.value) return '从未同步'
    const date = new Date(lastSyncTime.value)
    return date.toLocaleString('zh-CN')
  })

  /**
   * 完整同步：上传所有数据到云端
   */
  async function syncToCloud() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    isSyncing.value = true
    syncStatus.value = 'syncing'
    syncError.value = null

    try {
      const userId = authStore.user.uid
      console.log('[CloudSync] 开始同步到云端，用户ID:', userId)

      // 获取所有 stores
      const workspacesStore = useWorkspacesStore()
      const projectsStore = useProjectsStore()
      const tracksStore = useTracksStore()

      // 1. 同步工作区
      syncProgress.value = { current: 1, total: 3, message: '同步工作区...' }
      await syncWorkspacesToCloud(userId, workspacesStore.workspaces)

      // 2. 同步项目
      syncProgress.value = { current: 2, total: 3, message: '同步项目...' }
      await syncProjectsToCloud(userId, projectsStore.projects)

      // 3. 同步作品
      syncProgress.value = { current: 3, total: 3, message: '同步作品...' }
      await syncTracksToCloud(userId, tracksStore.tracks)

      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
      console.log('[CloudSync] 同步到云端完成')

      return { success: true }
    } catch (error) {
      console.error('[CloudSync] 同步到云端失败:', error)
      syncError.value = error.message
      syncStatus.value = 'error'
      return { success: false, error: error.message }
    } finally {
      isSyncing.value = false
      syncProgress.value = { current: 0, total: 0, message: '' }
    }
  }

  /**
   * 从云端加载数据
   */
  async function loadFromCloud() {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    isSyncing.value = true
    syncStatus.value = 'syncing'

    try {
      const userId = authStore.user.uid
      console.log('[CloudSync] 开始从云端加载数据，用户ID:', userId)

      // 检查云端数据结构
      const hasNewData = await checkNewDataStructure(userId)
      const hasOldData = await checkOldDataStructure(userId)
      
      console.log('[CloudSync] 云端数据检查:', { hasNewData, hasOldData })

      if (hasNewData) {
        // 加载新数据结构
        console.log('[CloudSync] 检测到新数据结构，加载中...')
        await loadNewDataStructure(userId)
      }
      
      // 即使有新数据，也要检查是否有旧数据需要迁移
      if (hasOldData) {
        console.log('[CloudSync] 检测到旧数据，开始迁移...')
        await migrateOldDataToNew(userId)
      }
      
      if (!hasNewData && !hasOldData) {
        console.log('[CloudSync] 云端无数据')
      }

      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
      console.log('[CloudSync] 从云端加载完成')

      return { success: true }
    } catch (error) {
      console.error('[CloudSync] 从云端加载失败:', error)
      syncError.value = error.message
      syncStatus.value = 'error'
      return { success: false, error: error.message }
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * 检查云端是否有新数据结构
   */
  async function checkNewDataStructure(userId) {
    try {
      const workspacesRef = collection(db, 'users', userId, 'workspaces')
      const snapshot = await getDocs(workspacesRef)
      return !snapshot.empty
    } catch (error) {
      console.error('[CloudSync] 检查新数据结构失败:', error)
      return false
    }
  }

  /**
   * 检查云端是否有旧数据结构
   */
  async function checkOldDataStructure(userId) {
    try {
      const songsRef = collection(db, 'users', userId, 'songs')
      const snapshot = await getDocs(songsRef)
      return !snapshot.empty
    } catch (error) {
      console.error('[CloudSync] 检查旧数据结构失败:', error)
      return false
    }
  }

  /**
   * 加载新数据结构
   */
  async function loadNewDataStructure(userId) {
    const workspacesStore = useWorkspacesStore()
    const projectsStore = useProjectsStore()
    const tracksStore = useTracksStore()

    // 1. 加载工作区
    syncProgress.value = { current: 1, total: 3, message: '加载工作区...' }
    const workspaces = await loadWorkspacesFromCloud(userId)
    
    // 2. 加载项目
    syncProgress.value = { current: 2, total: 3, message: '加载项目...' }
    const projects = await loadProjectsFromCloud(userId)
    
    // 3. 加载作品
    syncProgress.value = { current: 3, total: 3, message: '加载作品...' }
    const tracks = await loadTracksFromCloud(userId)

    // 更新本地数据
    if (workspaces.length > 0) {
      workspacesStore.workspaces = workspaces
      workspacesStore.saveWorkspaces()
      
      // 设置活跃工作区
      if (!workspacesStore.activeWorkspaceId && workspaces.length > 0) {
        workspacesStore.setActiveWorkspace(workspaces[0].id)
      }
    }

    if (projects.length > 0) {
      projectsStore.projects = projects
      projectsStore.saveProjects()
      
      // 设置活跃项目
      if (!projectsStore.activeProjectId && projects.length > 0) {
        const firstProject = projects.find(p => p.workspaceId === workspacesStore.activeWorkspaceId) || projects[0]
        projectsStore.setActiveProject(firstProject.id)
      }
    }

    if (tracks.length > 0) {
      tracksStore.tracks = tracks
      tracksStore.saveTracks()
    }

    console.log(`[CloudSync] 加载完成: ${workspaces.length} 工作区, ${projects.length} 项目, ${tracks.length} 作品`)
  }

  /**
   * 迁移旧数据到新结构并上传
   */
  async function migrateOldDataToNew(userId) {
    console.log('[CloudSync] 开始迁移旧数据到新结构...')
    
    // 1. 从云端加载旧数据
    const songsStore = useSongsStore()
    const oldSongs = await loadOldSongsFromCloud(userId)
    
    if (oldSongs.length === 0) {
      console.log('[CloudSync] 没有旧数据需要迁移')
      return
    }

    console.log(`[CloudSync] 从云端加载了 ${oldSongs.length} 首旧歌曲`)

    // 2. 在本地执行迁移
    // 先保存旧数据到 localStorage
    localStorage.setItem('musicplan_songs', JSON.stringify(oldSongs))
    console.log('[CloudSync] 旧数据已保存到 localStorage')
    
    // 强制执行迁移（临时重置版本号以触发迁移）
    console.log('[CloudSync] 执行数据迁移...')
    const MIGRATION_VERSION_KEY = 'pattr_migration_version'
    const currentVersion = localStorage.getItem(MIGRATION_VERSION_KEY)
    console.log('[CloudSync] 当前迁移版本:', currentVersion)
    
    // 临时重置版本号
    localStorage.setItem(MIGRATION_VERSION_KEY, '0')
    
    // 执行迁移
    migrateData()
    
    console.log('[CloudSync] 迁移版本已更新')

    // 3. 重新加载迁移后的数据
    const workspacesStore = useWorkspacesStore()
    const projectsStore = useProjectsStore()
    const tracksStore = useTracksStore()
    
    workspacesStore.loadWorkspaces()
    projectsStore.loadProjects()
    tracksStore.loadTracks()

    console.log('[CloudSync] 迁移后数据:')
    console.log(`  - 工作区: ${workspacesStore.workspaces.length}`)
    console.log(`  - 项目: ${projectsStore.projects.length}`)
    console.log(`  - 作品: ${tracksStore.tracks.length}`)

    // 4. 上传新数据到云端
    console.log('[CloudSync] 上传新数据到云端...')
    await syncToCloud()

    console.log('[CloudSync] ✅ 旧数据迁移完成')
  }

  /**
   * 同步工作区到云端
   */
  async function syncWorkspacesToCloud(userId, workspaces) {
    const workspacesRef = collection(db, 'users', userId, 'workspaces')
    
    for (const workspace of workspaces) {
      const docRef = doc(workspacesRef, workspace.id)
      await setDoc(docRef, {
        ...workspace,
        updatedAt: new Date().toISOString()
      })
    }
    
    console.log(`[CloudSync] 已同步 ${workspaces.length} 个工作区`)
  }

  /**
   * 同步项目到云端
   */
  async function syncProjectsToCloud(userId, projects) {
    const projectsRef = collection(db, 'users', userId, 'projects')
    
    for (const project of projects) {
      const docRef = doc(projectsRef, project.id)
      await setDoc(docRef, {
        ...project,
        updatedAt: new Date().toISOString()
      })
    }
    
    console.log(`[CloudSync] 已同步 ${projects.length} 个项目`)
  }

  /**
   * 同步作品到云端
   */
  async function syncTracksToCloud(userId, tracks) {
    const tracksRef = collection(db, 'users', userId, 'tracks')
    
    // 使用批量写入提高性能
    const batchSize = 500 // Firestore 批量写入限制
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchTracks = tracks.slice(i, i + batchSize)
      
      for (const track of batchTracks) {
        const docRef = doc(tracksRef, track.id)
        batch.set(docRef, {
          ...track,
          updatedAt: new Date().toISOString()
        })
      }
      
      await batch.commit()
      console.log(`[CloudSync] 已同步 ${Math.min(i + batchSize, tracks.length)}/${tracks.length} 个作品`)
    }
  }

  /**
   * 从云端加载工作区
   */
  async function loadWorkspacesFromCloud(userId) {
    const workspacesRef = collection(db, 'users', userId, 'workspaces')
    const snapshot = await getDocs(workspacesRef)
    
    const workspaces = []
    snapshot.forEach(doc => {
      workspaces.push({ id: doc.id, ...doc.data() })
    })
    
    return workspaces
  }

  /**
   * 从云端加载项目
   */
  async function loadProjectsFromCloud(userId) {
    const projectsRef = collection(db, 'users', userId, 'projects')
    const snapshot = await getDocs(projectsRef)
    
    const projects = []
    snapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() })
    })
    
    return projects
  }

  /**
   * 从云端加载作品
   */
  async function loadTracksFromCloud(userId) {
    const tracksRef = collection(db, 'users', userId, 'tracks')
    const snapshot = await getDocs(tracksRef)
    
    const tracks = []
    snapshot.forEach(doc => {
      tracks.push({ id: doc.id, ...doc.data() })
    })
    
    return tracks
  }

  /**
   * 从云端加载旧的歌曲数据
   */
  async function loadOldSongsFromCloud(userId) {
    const songsRef = collection(db, 'users', userId, 'songs')
    const snapshot = await getDocs(songsRef)
    
    const songs = []
    snapshot.forEach(doc => {
      songs.push({ id: doc.id, ...doc.data() })
    })
    
    return songs
  }

  /**
   * 删除云端的工作区
   */
  async function deleteWorkspaceFromCloud(workspaceId) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      const userId = authStore.user.uid
      const docRef = doc(db, 'users', userId, 'workspaces', workspaceId)
      await deleteDoc(docRef)
      console.log(`[CloudSync] 已删除云端工作区: ${workspaceId}`)
    } catch (error) {
      console.error('[CloudSync] 删除云端工作区失败:', error)
    }
  }

  /**
   * 删除云端的项目
   */
  async function deleteProjectFromCloud(projectId) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      const userId = authStore.user.uid
      const docRef = doc(db, 'users', userId, 'projects', projectId)
      await deleteDoc(docRef)
      console.log(`[CloudSync] 已删除云端项目: ${projectId}`)
    } catch (error) {
      console.error('[CloudSync] 删除云端项目失败:', error)
    }
  }

  /**
   * 删除云端的作品
   */
  async function deleteTrackFromCloud(trackId) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      const userId = authStore.user.uid
      const docRef = doc(db, 'users', userId, 'tracks', trackId)
      await deleteDoc(docRef)
      console.log(`[CloudSync] 已删除云端作品: ${trackId}`)
    } catch (error) {
      console.error('[CloudSync] 删除云端作品失败:', error)
    }
  }

  return {
    // 状态
    isSyncing,
    lastSyncTime,
    syncError,
    syncStatus,
    syncProgress,
    // 计算属性
    lastSyncTimeFormatted,
    // 方法
    syncToCloud,
    loadFromCloud,
    checkNewDataStructure,
    checkOldDataStructure,
    syncWorkspacesToCloud,
    syncProjectsToCloud,
    syncTracksToCloud,
    deleteWorkspaceFromCloud,
    deleteProjectFromCloud,
    deleteTrackFromCloud
  }
})

