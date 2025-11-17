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
      timerRecords: song.timerRecords || [], // 计时记录数组
      createdAt: song.createdAt || new Date().toISOString(),
      updatedAt: song.updatedAt || new Date().toISOString()
    }))
  }

  // 保存歌曲到 localStorage
  function saveSongs() {
    try {
      // 确保传递的是纯 JavaScript 数组，而不是 Vue 响应式对象
      const songsArray = Array.isArray(songs.value) ? songs.value : []
      
      // 深拷贝以确保没有响应式引用
      const plainSongs = songsArray.map(song => {
        // 创建一个纯对象，确保所有字段都是可序列化的
        return {
          id: song.id,
          name: song.name,
          genre: song.genre || '',
          estimatedHours: song.estimatedHours || 40,
          isNewGenre: song.isNewGenre || false,
          currentStage: song.currentStage || '曲风研究',
          tasks: Array.isArray(song.tasks) ? [...song.tasks] : new Array(TASKS.length).fill(false),
          taskHours: Array.isArray(song.taskHours) ? [...song.taskHours] : [],
          timeSpent: song.timeSpent || 0,
          timerRecords: Array.isArray(song.timerRecords) 
            ? song.timerRecords.map(record => ({
                id: record.id,
                songId: record.songId,
                startTime: record.startTime,
                endTime: record.endTime,
                duration: record.duration,
                details: record.details || '',
                createdAt: record.createdAt
              }))
            : [],
          notes: song.notes || '',
          createdAt: song.createdAt || new Date().toISOString(),
          updatedAt: song.updatedAt || new Date().toISOString()
        }
      })
      
      console.log(`准备保存 ${plainSongs.length} 首歌曲`)
      return saveToStorage(STORAGE_KEY, plainSongs)
    } catch (error) {
      console.error('saveSongs 失败:', error)
      throw error
    }
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
      timerRecords: songData.timerRecords || [], // 计时记录数组
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

  // 添加计时记录
  async function addTimerRecord(songId, recordData) {
    const song = getSongById(songId)
    if (!song) {
      throw new Error(`歌曲不存在: ${songId}`)
    }

    // 验证时长
    if (!recordData.duration || recordData.duration <= 0) {
      throw new Error(`无效的计时时长: ${recordData.duration} 小时`)
    }

    const record = {
      id: generateId(),
      songId: songId,
      startTime: recordData.startTime,
      endTime: recordData.endTime,
      duration: recordData.duration, // 小时
      details: recordData.details || '', // 明细文本
      createdAt: new Date().toISOString()
    }

    // 确保 timerRecords 数组存在
    if (!song.timerRecords) {
      song.timerRecords = []
    }

    song.timerRecords.push(record)
    
    // 更新总时长（向后兼容）
    song.timeSpent = (song.timeSpent || 0) + record.duration
    
    // 更新 updatedAt
    song.updatedAt = new Date().toISOString()
    
    // 先保存到本地（离线优先）
    try {
      const saved = saveSongs()
      if (!saved) {
        throw new Error('保存到本地存储失败，请检查浏览器控制台获取详细信息')
      }
    } catch (error) {
      // 如果是存储空间问题，提供更详细的错误信息
      if (error.message.includes('存储空间')) {
        throw error
      }
      throw new Error(`保存到本地存储失败: ${error.message || '未知错误'}`)
    }
    
    // 如果已登录，尝试同步到云端（异步，不阻塞）
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      // 异步同步，不等待结果，避免阻塞
      Promise.resolve().then(async () => {
        try {
          const { updateSongInCloud } = useFirestore()
          await updateSongInCloud(songId, {
            timerRecords: song.timerRecords,
            timeSpent: song.timeSpent,
            updatedAt: song.updatedAt
          })
          // 同步成功
        } catch (err) {
          console.error('自动同步到云端失败，加入重试队列:', err)
          // 同步失败，加入重试队列
          const { useTimerSyncStore } = await import('./timerSync')
          const timerSyncStore = useTimerSyncStore()
          timerSyncStore.addToQueue(songId, record)
        }
      }).catch(err => {
        console.error('同步处理出错:', err)
      })
    }
    
    return record
  }

  // 更新计时记录
  async function updateTimerRecord(songId, recordId, updates) {
    const song = getSongById(songId)
    if (!song || !song.timerRecords) {
      throw new Error(`歌曲不存在或没有计时记录: ${songId}`)
    }

    const recordIndex = song.timerRecords.findIndex(r => r.id === recordId)
    if (recordIndex === -1) {
      throw new Error(`计时记录不存在: ${recordId}`)
    }

    const record = song.timerRecords[recordIndex]
    const oldDuration = record.duration
    
    // 更新记录
    if (updates.details !== undefined) {
      record.details = updates.details
    }
    
    if (updates.duration !== undefined) {
      // 验证新时长
      if (updates.duration <= 0) {
        throw new Error(`无效的计时时长: ${updates.duration} 小时`)
      }
      record.duration = updates.duration
      
      // 如果修改了时长，需要更新 startTime 和 endTime
      if (updates.startTime !== undefined) {
        record.startTime = updates.startTime
      }
      if (updates.endTime !== undefined) {
        record.endTime = updates.endTime
      } else if (updates.startTime !== undefined && record.startTime) {
        // 如果只更新了 startTime，自动计算 endTime
        const start = new Date(record.startTime)
        const end = new Date(start.getTime() + updates.duration * 3600 * 1000)
        record.endTime = end.toISOString()
      }
    }
    
    // 更新总时长（向后兼容）
    song.timeSpent = Math.max(0, (song.timeSpent || 0) - oldDuration + record.duration)
    
    // 更新 updatedAt
    song.updatedAt = new Date().toISOString()
    record.updatedAt = new Date().toISOString()
    
    // 先保存到本地（离线优先）
    try {
      const saved = saveSongs()
      if (!saved) {
        throw new Error('保存到本地存储失败，请检查浏览器控制台获取详细信息')
      }
    } catch (error) {
      // 如果保存失败，回滚更改
      record.duration = oldDuration
      song.timeSpent = Math.max(0, (song.timeSpent || 0) - record.duration + oldDuration)
      if (error.message.includes('存储空间')) {
        throw error
      }
      throw new Error(`保存到本地存储失败: ${error.message || '未知错误'}`)
    }
    
    // 如果已登录，尝试同步到云端（异步，不阻塞）
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      Promise.resolve().then(async () => {
        try {
          const { updateSongInCloud } = useFirestore()
          await updateSongInCloud(songId, {
            timerRecords: song.timerRecords,
            timeSpent: song.timeSpent,
            updatedAt: song.updatedAt
          })
        } catch (err) {
          console.error('自动同步到云端失败:', err)
        }
      }).catch(err => {
        console.error('同步处理出错:', err)
      })
    }
    
    return record
  }

  // 删除计时记录
  async function deleteTimerRecord(songId, recordId) {
    const song = getSongById(songId)
    if (!song || !song.timerRecords) return false

    const recordIndex = song.timerRecords.findIndex(r => r.id === recordId)
    if (recordIndex === -1) return false

    const record = song.timerRecords[recordIndex]
    
    // 从数组中删除
    song.timerRecords.splice(recordIndex, 1)
    
    // 更新总时长（向后兼容）
    song.timeSpent = Math.max(0, (song.timeSpent || 0) - record.duration)
    
    // 更新 updatedAt
    song.updatedAt = new Date().toISOString()
    
    saveSongs()
    
    // 如果已登录，自动同步到云端
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      const { updateSongInCloud } = useFirestore()
      updateSongInCloud(songId, {
        timerRecords: song.timerRecords,
        timeSpent: song.timeSpent,
        updatedAt: song.updatedAt
      }).catch(err => {
        console.error('自动同步到云端失败:', err)
      })
    }
    
    return true
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
        timerRecords: song.timerRecords || [],
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
    addTimerRecord,
    updateTimerRecord,
    deleteTimerRecord,
    exportData,
    importData,
    clearAllSongs
  }
})

