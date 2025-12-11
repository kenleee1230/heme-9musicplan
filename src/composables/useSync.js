import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCloudSyncStore } from '@/stores/cloudSync'
import { useTimerSyncStore } from '@/stores/timerSync'
import { useWorkspacesStore } from '@/stores/workspaces'
import { useProjectsStore } from '@/stores/projects'
import { useTracksStore } from '@/stores/tracks'

export function useSync() {
  const authStore = useAuthStore()
  const cloudSyncStore = useCloudSyncStore()
  const timerSyncStore = useTimerSyncStore()

  // 监听认证状态变化，自动同步
  watch(
    () => authStore.isAuthenticated,
    async (isAuth, wasAuth) => {
      // ========== 从未登录 → 已登录 ==========
      if (isAuth && !wasAuth) {
        console.log('[Sync] ========== 用户登录 ==========')
        console.log('[Sync] 用户刚登录，开始同步数据...')
        
        const workspacesStore = useWorkspacesStore()
        const projectsStore = useProjectsStore()
        const tracksStore = useTracksStore()
        
        // 1. 检查云端是否有数据
        const userId = authStore.user.uid
        const hasCloudData = await cloudSyncStore.checkNewDataStructure(userId)
        
        if (hasCloudData) {
          // ========== 云端有数据：下载并覆盖本地 ==========
          console.log('[Sync] 云端有数据，下载中...')
          const result = await cloudSyncStore.loadFromCloud()
          
          if (result.success) {
            console.log('[Sync] 云端数据下载成功，重新加载本地数据...')
            
            // 重新加载本地数据（已被云端数据覆盖）
            workspacesStore.loadWorkspaces()
            projectsStore.loadProjects()
            tracksStore.loadTracks()
            
            console.log('[Sync] 数据同步完成:')
            console.log('  - 工作区:', workspacesStore.workspaces.length)
            console.log('  - 项目:', projectsStore.projects.length)
            console.log('  - 作品:', tracksStore.tracks.length)
          } else {
            console.error('[Sync] 云端数据下载失败:', result.error)
          }
        } else {
          // ========== 云端无数据：上传本地数据到云端 ==========
          console.log('[Sync] 云端无数据，上传本地数据...')
          
          // 检查本地是否有数据
          const hasLocalData = workspacesStore.workspaces.length > 0 || 
                              projectsStore.projects.length > 0 || 
                              tracksStore.tracks.length > 0
          
          if (hasLocalData) {
            console.log('[Sync] 本地有数据，上传到云端...')
            const result = await cloudSyncStore.syncToCloud()
            
            if (result.success) {
              console.log('[Sync] 本地数据上传成功')
            } else {
              console.error('[Sync] 本地数据上传失败:', result.error)
            }
          } else {
            console.log('[Sync] 本地也无数据，跳过上传')
          }
        }
        
        // 2. 处理计时同步队列
        if (navigator.onLine) {
          timerSyncStore.processSyncQueue()
        }
        
        console.log('[Sync] ========== 登录同步完成 ==========')
      }
      
      // ========== 从已登录 → 未登录 ==========
      if (!isAuth && wasAuth) {
        console.log('[Sync] 用户登出，保留本地数据')
        // 不做任何操作，保留本地数据作为离线备份
      }
    }
  )

  // 手动触发同步（上传本地数据到云端）
  async function triggerSync() {
    if (!authStore.isAuthenticated) {
      return { success: false, error: '请先登录' }
    }

    console.log('[Sync] 手动触发同步...')
    return await cloudSyncStore.syncToCloud()
  }

  return {
    triggerSync
  }
}

