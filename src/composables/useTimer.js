import { ref, computed } from 'vue'
import { TIMER_STORAGE_KEY } from '@/utils/constants'
import { loadFromStorage, saveToStorage, removeFromStorage } from '@/utils/storage'

// 全局计时器状态（单例）
const timer = ref({
  songId: null,
  songName: '',
  startTime: null,
  pausedTime: null,
  elapsedSeconds: 0,
  isRunning: false,
  isPaused: false
})

let timerInterval = null

export function useTimer() {
  // 计算属性
  const timerDisplay = computed(() => {
    const hours = Math.floor(timer.value.elapsedSeconds / 3600)
    const minutes = Math.floor((timer.value.elapsedSeconds % 3600) / 60)
    const seconds = timer.value.elapsedSeconds % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const elapsedHours = computed(() => {
    return (timer.value.elapsedSeconds / 3600).toFixed(2)
  })

  // 从 localStorage 恢复计时器状态
  function loadTimer() {
    const saved = loadFromStorage(TIMER_STORAGE_KEY)
    
    if (saved && saved.isRunning) {
      timer.value = {
        ...saved,
        elapsedSeconds: calculateElapsed(saved.startTime, saved.pausedTime)
      }
      
      if (timer.value.isRunning && !timer.value.isPaused) {
        startTimerTick()
      }
    }
  }

  // 保存计时器状态
  function saveTimer() {
    saveToStorage(TIMER_STORAGE_KEY, {
      songId: timer.value.songId,
      songName: timer.value.songName,
      startTime: timer.value.startTime,
      pausedTime: timer.value.pausedTime,
      elapsedSeconds: timer.value.elapsedSeconds,
      isRunning: timer.value.isRunning,
      isPaused: timer.value.isPaused
    })
  }

  // 计算已用时间（秒）
  function calculateElapsed(startTime, pausedTime) {
    if (!startTime) return 0
    
    const now = pausedTime || Date.now()
    return Math.floor((now - startTime) / 1000)
  }

  // 开始计时
  function startTimer(songId, songName) {
    // 如果已经有计时器在运行，先停止
    if (timer.value.isRunning) {
      stopTimer()
    }

    timer.value = {
      songId,
      songName,
      startTime: Date.now(),
      pausedTime: null,
      elapsedSeconds: 0,
      isRunning: true,
      isPaused: false
    }

    saveTimer()
    startTimerTick()
  }

  // 暂停计时
  function pauseTimer() {
    if (!timer.value.isRunning || timer.value.isPaused) return

    timer.value.isPaused = true
    timer.value.pausedTime = Date.now()
    timer.value.elapsedSeconds = calculateElapsed(timer.value.startTime, timer.value.pausedTime)

    stopTimerTick()
    saveTimer()
  }

  // 继续计时
  function resumeTimer() {
    if (!timer.value.isRunning || !timer.value.isPaused) return

    // 调整开始时间，让已用时间保持不变
    const pausedDuration = Date.now() - timer.value.pausedTime
    timer.value.startTime += pausedDuration
    timer.value.pausedTime = null
    timer.value.isPaused = false

    saveTimer()
    startTimerTick()
  }

  // 停止计时（返回已用时长和计时信息）
  function stopTimer() {
    if (!timer.value.isRunning) return { hours: 0, songId: null, startTime: null, endTime: null }

    // 先停止更新循环
    stopTimerTick()

    // 获取结束时间
    const endTime = Date.now()
    
    // 计算最终已用时间（秒）
    // 如果已暂停，使用已保存的 elapsedSeconds
    // 如果正在运行，先更新一次 elapsedSeconds 确保与显示一致，然后使用它
    let finalElapsed
    if (timer.value.isPaused) {
      finalElapsed = timer.value.elapsedSeconds
    } else {
      // 先更新一次 elapsedSeconds，确保与显示的时间一致
      timer.value.elapsedSeconds = calculateElapsed(timer.value.startTime, endTime)
      finalElapsed = timer.value.elapsedSeconds
    }

    // 保留更多小数位，避免短时间被四舍五入为0
    // 例如：45秒 = 0.0125小时，如果只保留1位小数会变成0
    // 使用更高精度（保留4位小数），避免67秒被四舍五入为72秒
    // 67秒 = 0.018611... 小时，保留2位小数会变成0.02小时（72秒）
    const hours = Math.round((finalElapsed / 3600) * 10000) / 10000 // 保留4位小数

    const result = {
      songId: timer.value.songId,
      songName: timer.value.songName,
      hours: hours,
      startTime: timer.value.startTime,
      endTime: endTime
    }

    // 重置计时器
    timer.value = {
      songId: null,
      songName: '',
      startTime: null,
      pausedTime: null,
      elapsedSeconds: 0,
      isRunning: false,
      isPaused: false
    }

    removeFromStorage(TIMER_STORAGE_KEY)

    return result
  }

  // 开始计时器更新循环
  function startTimerTick() {
    stopTimerTick() // 先清除现有的

    timerInterval = setInterval(() => {
      if (timer.value.isRunning && !timer.value.isPaused) {
        timer.value.elapsedSeconds = calculateElapsed(timer.value.startTime)
      }
    }, 1000)
  }

  // 停止计时器更新循环
  function stopTimerTick() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // 初始化（恢复之前的计时器）
  loadTimer()

  return {
    timer,
    timerDisplay,
    elapsedHours,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer
  }
}

