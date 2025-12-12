import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SYNC_QUEUE_KEY } from '@/utils/constants'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { useFirestore } from '@/composables/useFirestore'
import { useAuthStore } from './auth'

export const useTimerSyncStore = defineStore('timerSync', () => {
  // 状态
  const syncQueue = ref([])
  const isSyncing = ref(false)
  const lastSyncError = ref(null)

  // 从 localStorage 加载同步队列
  function loadSyncQueue() {
    const saved = loadFromStorage(SYNC_QUEUE_KEY, [])
    syncQueue.value = saved
  }

  // 保存同步队列到 localStorage
  function saveSyncQueue() {
    saveToStorage(SYNC_QUEUE_KEY, syncQueue.value)
  }

  // 添加待同步的记录到队列
  function addToQueue(songId, recordData) {
    const queueItem = {
      id: recordData.id || Date.now().toString(),
      songId,
      recordData,
      timestamp: new Date().toISOString(),
      retryCount: 0
    }
    syncQueue.value.push(queueItem)
    saveSyncQueue()
  }

  // 从队列中移除已同步的记录
  function removeFromQueue(queueItemId) {
    const index = syncQueue.value.findIndex(item => item.id === queueItemId)
    if (index !== -1) {
      syncQueue.value.splice(index, 1)
      saveSyncQueue()
    }
  }

  // 同步单个记录到云端
  async function syncRecordToCloud(songId, recordData) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    try {
      const { updateSongInCloud } = useFirestore()
      const song = await getSongById(songId)
      if (!song) {
        return { success: false, error: '歌曲不存在' }
      }

      // 确保歌曲数据包含最新的 timerRecords
      await updateSongInCloud(songId, {
        timerRecords: song.timerRecords || [],
        timeSpent: song.timeSpent || 0,
        updatedAt: song.updatedAt || new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('同步记录到云端失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 处理同步队列
  async function processSyncQueue() {
    if (isSyncing.value || syncQueue.value.length === 0) return

    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    isSyncing.value = true
    lastSyncError.value = null

    const { useTracksStore } = await import('./tracks')
    const tracksStore = useTracksStore()

    const itemsToProcess = [...syncQueue.value]
    
    for (const item of itemsToProcess) {
      try {
        // 获取最新的歌曲数据
        const track = tracksStore.getTrackById(item.songId)
        if (!track) {
          // 歌曲不存在，移除队列项
          removeFromQueue(item.id)
          continue
        }

        const result = await syncRecordToCloud(item.songId, item.recordData)
        
        if (result.success) {
          // 同步成功，移除队列项
          removeFromQueue(item.id)
        } else {
          // 同步失败，增加重试次数
          item.retryCount = (item.retryCount || 0) + 1
          
          // 如果重试次数超过5次，移除该项（避免无限重试）
          if (item.retryCount >= 5) {
            console.warn('同步记录失败次数过多，移除队列项:', item)
            removeFromQueue(item.id)
          } else {
            // 更新队列项
            const index = syncQueue.value.findIndex(q => q.id === item.id)
            if (index !== -1) {
              syncQueue.value[index] = item
              saveSyncQueue()
            }
          }
          
          lastSyncError.value = result.error
        }
      } catch (error) {
        console.error('处理同步队列项失败:', error)
        lastSyncError.value = error.message
        
        // 增加重试次数
        item.retryCount = (item.retryCount || 0) + 1
        if (item.retryCount >= 5) {
          removeFromQueue(item.id)
        } else {
          const index = syncQueue.value.findIndex(q => q.id === item.id)
          if (index !== -1) {
            syncQueue.value[index] = item
            saveSyncQueue()
          }
        }
      }
    }

    isSyncing.value = false
  }

  // 初始化：加载队列并监听网络状态
  function init() {
    loadSyncQueue()
    
    // 监听网络状态变化
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('网络已连接，开始处理同步队列')
        processSyncQueue()
      })
    }
  }

  // 获取歌曲（需要动态导入以避免循环依赖）
  async function getSongById(songId) {
    const { useTracksStore } = await import('./tracks')
    const tracksStore = useTracksStore()
    return tracksStore.getTrackById(songId)
  }

  return {
    syncQueue,
    isSyncing,
    lastSyncError,
    loadSyncQueue,
    saveSyncQueue,
    addToQueue,
    removeFromQueue,
    syncRecordToCloud,
    processSyncQueue,
    init
  }
})

