import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEY, TASKS, TARGET_SONGS, TOTAL_DAYS, START_DATE_KEY } from '@/utils/constants'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { generateId } from '@/utils/helpers'
import { calculateProgress, calculateTaskHours, calculateProjectStats, getStageFromLastCompletedTask } from '@/utils/calculations'
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
    
    // 获取项目开始日期，用于计算默认 startDate
    const projectStartDate = loadFromStorage(START_DATE_KEY)
    let projectStart = null
    if (projectStartDate) {
      projectStart = new Date(projectStartDate)
    } else {
      // 如果没有项目开始日期，使用默认值
      projectStart = new Date('2025-11-08')
    }
    
    songs.value = savedSongs.map((song, index) => {
      // 数据迁移：如果歌曲没有 customTasks，使用默认的 TASKS
      let customTasks = song.customTasks
      if (!customTasks || !Array.isArray(customTasks) || customTasks.length === 0) {
        customTasks = [...TASKS]
      }
      
      // 确保 tasks 数组长度与 customTasks 一致
      let tasks = song.tasks || []
      if (tasks.length !== customTasks.length) {
        // 如果长度不匹配，调整 tasks 数组
        const newTasks = new Array(customTasks.length).fill(false)
        // 保留原有的完成状态（如果索引存在）
        tasks.forEach((completed, index) => {
          if (index < newTasks.length) {
            newTasks[index] = completed
          }
        })
        tasks = newTasks
      }
      
      // 确保 taskHours 数组长度与 customTasks 一致
      let taskHours = song.taskHours || []
      if (taskHours.length !== customTasks.length) {
        // 如果长度不匹配，重新计算或调整
        if (taskHours.length === 0) {
          taskHours = calculateTaskHours(song.estimatedHours || 40, song.isNewGenre || false)
          // 如果新计算的长度不匹配，需要调整
          if (taskHours.length !== customTasks.length) {
            const newTaskHours = new Array(customTasks.length).fill(0)
            // 尝试按比例分配或复制值
            taskHours.forEach((hours, index) => {
              if (index < newTaskHours.length) {
                newTaskHours[index] = hours
              }
            })
            taskHours = newTaskHours
          }
        } else {
          // 调整现有数组长度
          const newTaskHours = new Array(customTasks.length).fill(0)
          taskHours.forEach((hours, index) => {
            if (index < newTaskHours.length) {
              newTaskHours[index] = hours
            }
          })
          taskHours = newTaskHours
        }
      }
      
      // 计算默认 startDate（如果歌曲没有设置 startDate）
      let startDate = song.startDate || ''
      if (!startDate && projectStart) {
        // 计算默认开始日期：项目开始日期 + 索引 × (总天数 / 目标歌曲数)
        const daysOffset = Math.floor(index * (TOTAL_DAYS / TARGET_SONGS))
        const defaultStartDate = new Date(projectStart)
        defaultStartDate.setDate(projectStart.getDate() + daysOffset)
        startDate = defaultStartDate.toISOString().split('T')[0] // 格式化为 YYYY-MM-DD
      }
      
      // 根据 tasks 重新计算 currentStage（数据迁移）
      const tempSong = {
        customTasks: customTasks,
        tasks: tasks
      }
      const calculatedStage = getStageFromLastCompletedTask(tempSong)
      
      return {
        ...song,
        // 确保必要字段存在
        id: song.id || generateId(),
        customTasks: customTasks,
        tasks: tasks,
        taskHours: taskHours,
        currentStage: calculatedStage, // 使用计算出的阶段
        startDate: startDate, // 开始制作时间（可能已计算默认值）
        timerRecords: song.timerRecords || [], // 计时记录数组
        createdAt: song.createdAt || new Date().toISOString(),
        updatedAt: song.updatedAt || new Date().toISOString()
      }
    })
  }

  // 保存歌曲到 localStorage
  function saveSongs() {
    try {
      // 确保传递的是纯 JavaScript 数组，而不是 Vue 响应式对象
      const songsArray = Array.isArray(songs.value) ? songs.value : []
      
      // 深拷贝以确保没有响应式引用
      const plainSongs = songsArray.map(song => {
        // 获取 customTasks，如果没有则使用默认 TASKS
        const customTasks = Array.isArray(song.customTasks) && song.customTasks.length > 0
          ? [...song.customTasks]
          : [...TASKS]
        
        // 创建一个纯对象，确保所有字段都是可序列化的
        return {
          id: song.id,
          name: song.name,
          genre: song.genre || '',
          estimatedHours: song.estimatedHours || 40,
          isNewGenre: song.isNewGenre || false,
          currentStage: song.currentStage || '曲风研究',
          customTasks: customTasks,
          tasks: Array.isArray(song.tasks) ? [...song.tasks] : new Array(customTasks.length).fill(false),
          taskHours: Array.isArray(song.taskHours) ? [...song.taskHours] : [],
          timeSpent: song.timeSpent || 0,
          startDate: song.startDate || '',
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
    // 获取 customTasks，如果没有则使用默认 TASKS
    const customTasks = Array.isArray(songData.customTasks) && songData.customTasks.length > 0
      ? [...songData.customTasks]
      : [...TASKS]
    
    // 确保 tasks 和 taskHours 长度与 customTasks 一致
    const tasksLength = customTasks.length
    let tasks = songData.tasks || new Array(tasksLength).fill(false)
    if (tasks.length !== tasksLength) {
      const newTasks = new Array(tasksLength).fill(false)
      tasks.forEach((completed, index) => {
        if (index < newTasks.length) {
          newTasks[index] = completed
        }
      })
      tasks = newTasks
    }
    
    let taskHours = songData.taskHours || calculateTaskHours(songData.estimatedHours || 40, songData.isNewGenre || false)
    if (taskHours.length !== tasksLength) {
      const newTaskHours = new Array(tasksLength).fill(0)
      taskHours.forEach((hours, index) => {
        if (index < newTaskHours.length) {
          newTaskHours[index] = hours
        }
      })
      // 如果新数组全为0，重新计算
      if (newTaskHours.every(h => h === 0)) {
        taskHours = calculateTaskHours(songData.estimatedHours || 40, songData.isNewGenre || false)
        // 再次检查长度
        if (taskHours.length !== tasksLength) {
          const recalculated = new Array(tasksLength).fill(0)
          taskHours.forEach((hours, index) => {
            if (index < recalculated.length) {
              recalculated[index] = hours
            }
          })
          taskHours = recalculated
        }
      } else {
        taskHours = newTaskHours
      }
    }
    
    // 根据 tasks 自动计算 currentStage
    const tempSong = {
      customTasks: customTasks,
      tasks: tasks
    }
    const calculatedStage = getStageFromLastCompletedTask(tempSong)
    
    const newSong = {
      id: generateId(),
      name: songData.name || '未命名歌曲',
      genre: songData.genre || '',
      estimatedHours: songData.estimatedHours || 40,
      isNewGenre: songData.isNewGenre || false,
      currentStage: calculatedStage,
      customTasks: customTasks,
      tasks: tasks,
      taskHours: taskHours,
      timeSpent: songData.timeSpent || 0,
      startDate: songData.startDate || '', // 开始制作时间
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
      // 如果更新了 tasks 或 customTasks，自动计算 currentStage
      if (updates.tasks !== undefined || updates.customTasks !== undefined) {
        const existingSong = songs.value[index]
        const customTasks = updates.customTasks !== undefined 
          ? (Array.isArray(updates.customTasks) && updates.customTasks.length > 0 ? updates.customTasks : existingSong.customTasks)
          : existingSong.customTasks
        const tasks = updates.tasks !== undefined ? updates.tasks : existingSong.tasks
        
        const tempSong = {
          customTasks: customTasks,
          tasks: tasks
        }
        updates.currentStage = getStageFromLastCompletedTask(tempSong)
      }
      
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
        songs.value = data.songs.map(song => {
          // 数据迁移：如果歌曲没有 customTasks，使用默认的 TASKS
          let customTasks = song.customTasks
          if (!customTasks || !Array.isArray(customTasks) || customTasks.length === 0) {
            customTasks = [...TASKS]
          }
          
          // 确保 tasks 数组长度与 customTasks 一致
          let tasks = song.tasks || []
          if (tasks.length !== customTasks.length) {
            const newTasks = new Array(customTasks.length).fill(false)
            tasks.forEach((completed, index) => {
              if (index < newTasks.length) {
                newTasks[index] = completed
              }
            })
            tasks = newTasks
          }
          
          return {
            ...song,
            id: song.id || generateId(),
            customTasks: customTasks,
            tasks: tasks,
            timerRecords: song.timerRecords || [],
            updatedAt: new Date().toISOString()
          }
        })
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

