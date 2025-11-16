import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from './auth'
import { useSongsStore } from './songs'
import { useSettingsStore } from './settings'

export const useSyncStore = defineStore('sync', () => {
  // 状态
  const isSyncing = ref(false)
  const lastSyncTime = ref(null)
  const syncError = ref(null)
  const syncStatus = ref('idle') // idle, syncing, success, error

  // 计算属性
  const lastSyncTimeFormatted = computed(() => {
    if (!lastSyncTime.value) return '从未同步'
    const date = new Date(lastSyncTime.value)
    return date.toLocaleString('zh-CN')
  })

  // 同步歌曲到云端
  async function syncSongsToCloud() {
    const authStore = useAuthStore()
    const songsStore = useSongsStore()

    if (!authStore.isAuthenticated) {
      console.log('用户未登录，跳过同步')
      return { success: false, error: '用户未登录' }
    }

    isSyncing.value = true
    syncStatus.value = 'syncing'
    syncError.value = null

    try {
      const userId = authStore.user.uid
      const songsCollectionRef = collection(db, 'users', userId, 'songs')

      // 上传所有歌曲
      const uploadPromises = songsStore.songs.map(song => {
        const songDocRef = doc(songsCollectionRef, song.id)
        return setDoc(songDocRef, {
          ...song,
          updatedAt: new Date().toISOString()
        })
      })

      await Promise.all(uploadPromises)

      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
      
      return { success: true }
    } catch (error) {
      console.error('Sync to cloud error:', error)
      syncError.value = '同步到云端失败'
      syncStatus.value = 'error'
      return { success: false, error: error.message }
    } finally {
      isSyncing.value = false
    }
  }

  // 从云端加载歌曲
  async function loadSongsFromCloud() {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    isSyncing.value = true
    syncStatus.value = 'syncing'

    try {
      const userId = authStore.user.uid
      const songsCollectionRef = collection(db, 'users', userId, 'songs')
      const querySnapshot = await getDocs(songsCollectionRef)

      const cloudSongs = []
      querySnapshot.forEach((doc) => {
        cloudSongs.push({
          ...doc.data(),
          id: doc.id
        })
      })

      syncStatus.value = 'success'
      return { success: true, songs: cloudSongs }
    } catch (error) {
      console.error('Load from cloud error:', error)
      syncError.value = '从云端加载失败'
      syncStatus.value = 'error'
      return { success: false, error: error.message }
    } finally {
      isSyncing.value = false
    }
  }

  // 合并本地和云端数据
  function mergeLocalAndCloud(localSongs, cloudSongs) {
    const merged = new Map()

    // 添加本地歌曲
    localSongs.forEach(song => {
      merged.set(song.id, song)
    })

    // 合并云端歌曲（以 updatedAt 为准）
    cloudSongs.forEach(cloudSong => {
      const localSong = merged.get(cloudSong.id)

      if (!localSong) {
        // 云端有，本地没有，直接添加
        merged.set(cloudSong.id, cloudSong)
      } else {
        // 都有，比较时间戳，保留最新的
        const cloudTime = new Date(cloudSong.updatedAt).getTime()
        const localTime = new Date(localSong.updatedAt).getTime()

        if (cloudTime > localTime) {
          merged.set(cloudSong.id, cloudSong)
        }
      }
    })

    return Array.from(merged.values())
  }

  // 完整同步流程（合并策略）
  async function syncWithCloud() {
    const authStore = useAuthStore()
    const songsStore = useSongsStore()

    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    isSyncing.value = true
    syncStatus.value = 'syncing'
    syncError.value = null

    try {
      // 1. 从云端加载数据
      const cloudResult = await loadSongsFromCloud()
      
      if (!cloudResult.success) {
        throw new Error(cloudResult.error)
      }

      const cloudSongs = cloudResult.songs || []
      const localSongs = songsStore.songs

      // 2. 合并数据
      const mergedSongs = mergeLocalAndCloud(localSongs, cloudSongs)

      // 3. 更新本地
      songsStore.songs = mergedSongs
      songsStore.saveSongs()

      // 4. 同步回云端（确保云端也是最新的）
      await syncSongsToCloud()

      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'

      return { success: true, mergedCount: mergedSongs.length }
    } catch (error) {
      console.error('Sync with cloud error:', error)
      syncError.value = '数据同步失败'
      syncStatus.value = 'error'
      return { success: false, error: error.message }
    } finally {
      isSyncing.value = false
    }
  }

  // 删除云端歌曲
  async function deleteSongFromCloud(songId) {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    try {
      const userId = authStore.user.uid
      const songDocRef = doc(db, 'users', userId, 'songs', songId)
      await deleteDoc(songDocRef)
      return { success: true }
    } catch (error) {
      console.error('Delete from cloud error:', error)
      return { success: false, error: error.message }
    }
  }

  // 清除同步错误
  function clearSyncError() {
    syncError.value = null
    syncStatus.value = 'idle'
  }

  return {
    // 状态
    isSyncing,
    lastSyncTime,
    syncError,
    syncStatus,
    // 计算属性
    lastSyncTimeFormatted,
    // 方法
    syncSongsToCloud,
    loadSongsFromCloud,
    mergeLocalAndCloud,
    syncWithCloud,
    deleteSongFromCloud,
    clearSyncError
  }
})

