import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'

export function useFirestore() {
  const authStore = useAuthStore()

  // 保存歌曲到云端
  async function saveSongToCloud(song) {
    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    try {
      const userId = authStore.user.uid
      const songRef = doc(db, 'users', userId, 'songs', song.id)
      
      await setDoc(songRef, {
        ...song,
        updatedAt: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('Save song to cloud error:', error)
      return { success: false, error: error.message }
    }
  }

  // 更新云端歌曲
  async function updateSongInCloud(songId, updates) {
    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    try {
      const userId = authStore.user.uid
      const songRef = doc(db, 'users', userId, 'songs', songId)
      
      await updateDoc(songRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('Update song in cloud error:', error)
      return { success: false, error: error.message }
    }
  }

  // 从云端删除歌曲
  async function deleteSongFromCloud(songId) {
    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    try {
      const userId = authStore.user.uid
      const songRef = doc(db, 'users', userId, 'songs', songId)
      
      await deleteDoc(songRef)

      return { success: true }
    } catch (error) {
      console.error('Delete song from cloud error:', error)
      return { success: false, error: error.message }
    }
  }

  // 保存设置到云端
  async function saveSettingsToCloud(settings) {
    if (!authStore.isAuthenticated) {
      return { success: false, error: '用户未登录' }
    }

    try {
      const userId = authStore.user.uid
      const settingsRef = doc(db, 'users', userId, 'settings', 'config')
      
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('Save settings to cloud error:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    saveSongToCloud,
    updateSongInCloud,
    deleteSongFromCloud,
    saveSettingsToCloud
  }
}

