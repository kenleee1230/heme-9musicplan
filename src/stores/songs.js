import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEY, TASKS, TARGET_SONGS } from '@/utils/constants'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { generateId } from '@/utils/helpers'
import { calculateProgress, calculateTaskHours, calculateProjectStats } from '@/utils/calculations'
import { useFirestore } from '@/composables/useFirestore'
import { useAuthStore } from './auth'

export const useSongsStore = defineStore('songs', () => {
  // 状态
  const songs = ref([])

  // 计算属性
  const completedSongs = computed(() => {
    return songs.value.filter(s => s.currentStage === '已完成')
  })

  const inProgressSongs = computed(() => {
    return songs.value.filter(s => s.currentStage !== '已完成')
  })

  const completedCount = computed(() => completedSongs.value.length)
  
  const inProgressCount = computed(() => inProgressSongs.value.length)

  const totalProgress = computed(() => {
    if (songs.value.length === 0) return 0
    const sum = songs.value.reduce((acc, song) => acc + calculateProgress(song), 0)
    return Math.round(sum / songs.value.length)
  })

  const projectStats = computed(() => {
    return calculateProjectStats(songs.value)
  })

  // 从 localStorage 加载歌曲
  function loadSongs() {
    const savedSongs = loadFromStorage(STORAGE_KEY, [])
    songs.value = savedSongs.map(song => ({
      ...song,
      // 确保必要字段存在
      id: song.id || generateId(),
      tasks: song.tasks || new Array(TASKS.length).fill(false),
      taskHours: song.taskHours || calculateTaskHours(song.estimatedHours || 40, song.isNewGenre || false),
      createdAt: song.createdAt || new Date().toISOString(),
      updatedAt: song.updatedAt || new Date().toISOString()
    }))
  }

  // 保存歌曲到 localStorage
  function saveSongs() {
    saveToStorage(STORAGE_KEY, songs.value)
  }

  // 添加歌曲
  async function addSong(songData) {
    const newSong = {
      id: generateId(),
      name: songData.name || '未命名歌曲',
      genre: songData.genre || '',
      estimatedHours: songData.estimatedHours || 40,
      isNewGenre: songData.isNewGenre || false,
      currentStage: songData.currentStage || '曲风研究',
      tasks: songData.tasks || new Array(TASKS.length).fill(false),
      taskHours: songData.taskHours || calculateTaskHours(songData.estimatedHours || 40, songData.isNewGenre || false),
      timeSpent: songData.timeSpent || 0,
      notes: songData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    songs.value.push(newSong)
    saveSongs()
    
    // 如果已登录，自动同步到云端
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      const { saveSongToCloud } = useFirestore()
      saveSongToCloud(newSong).catch(err => {
        console.error('自动同步到云端失败:', err)
      })
    }
    
    return newSong
  }

  // 更新歌曲
  async function updateSong(id, updates) {
    const index = songs.value.findIndex(s => s.id === id)
    if (index !== -1) {
      songs.value[index] = {
        ...songs.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveSongs()
      
      // 如果已登录，自动同步到云端
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        const { updateSongInCloud } = useFirestore()
        updateSongInCloud(id, updates).catch(err => {
          console.error('自动同步到云端失败:', err)
        })
      }
      
      return songs.value[index]
    }
    return null
  }

  // 删除歌曲
  async function deleteSong(id) {
    const index = songs.value.findIndex(s => s.id === id)
    if (index !== -1) {
      songs.value.splice(index, 1)
      saveSongs()
      
      // 如果已登录，自动从云端删除
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        const { deleteSongFromCloud } = useFirestore()
        deleteSongFromCloud(id).catch(err => {
          console.error('自动同步到云端失败:', err)
        })
      }
      
      return true
    }
    return false
  }

  // 获取单首歌曲
  function getSongById(id) {
    return songs.value.find(s => s.id === id)
  }

  // 导出数据
  function exportData() {
    const data = {
      songs: songs.value,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    return JSON.stringify(data, null, 2)
  }

  // 导入数据
  function importData(jsonData) {
    try {
      const data = JSON.parse(jsonData)
      if (data.songs && Array.isArray(data.songs)) {
        songs.value = data.songs.map(song => ({
          ...song,
          id: song.id || generateId(),
          tasks: song.tasks || new Array(TASKS.length).fill(false),
          updatedAt: new Date().toISOString()
        }))
        saveSongs()
        return { success: true, count: songs.value.length }
      }
      return { success: false, error: '无效的数据格式' }
    } catch (error) {
      console.error('Import error:', error)
      return { success: false, error: '数据解析失败' }
    }
  }

  // 清空所有歌曲
  function clearAllSongs() {
    songs.value = []
    saveSongs()
  }

  return {
    // 状态
    songs,
    // 计算属性
    completedSongs,
    inProgressSongs,
    completedCount,
    inProgressCount,
    totalProgress,
    projectStats,
    // 方法
    loadSongs,
    saveSongs,
    addSong,
    updateSong,
    deleteSong,
    getSongById,
    exportData,
    importData,
    clearAllSongs
  }
})

