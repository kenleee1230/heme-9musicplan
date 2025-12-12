import { v4 as uuidv4 } from 'uuid'
import { NOTE_FREQUENCIES } from './constants'

// 生成唯一 ID
export function generateId() {
  return uuidv4()
}

// 格式化日期
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 格式化时间（旧版，保留兼容性）
export function formatTime(hours) {
  if (hours === null || hours === undefined) return '0小时'
  return `${hours.toFixed(1)}小时`
}

// 格式化时长：显示为"xx小时xx分钟"，如果小于1分钟则显示秒数
export function formatDuration(hours) {
  if (!hours || hours === 0) return '0秒'
  // 使用更精确的计算，避免浮点数精度问题
  // 先转换为毫秒，再转换为秒，避免精度丢失
  const totalSeconds = Math.round(hours * 3600 * 1000) / 1000
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.round(totalSeconds % 60) // 秒数四舍五入
  
  if (h > 0) {
    if (m > 0) {
      return `${h}小时${m}分钟`
    } else {
      return `${h}小时`
    }
  } else if (m > 0) {
    if (s > 0) {
      return `${m}分${s}秒`
    } else {
      return `${m}分钟`
    }
  } else {
    return `${s}秒`
  }
}

// 格式化已用时长：显示为"xx小时xx分钟"，如果小于1分钟则显示秒数
export function formatTimeSpent(hours) {
  return formatDuration(hours)
}

// 获取音符名称（处理升降号）
export function getNoteName(note) {
  // 标准化音符名称，处理升降号
  const noteMap = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  }
  return noteMap[note] || note
}

// 计算两个音符之间的音程（半音数）
export function getInterval(note1, note2) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const n1 = getNoteName(note1)
  const n2 = getNoteName(note2)
  const index1 = notes.indexOf(n1)
  const index2 = notes.indexOf(n2)
  
  if (index1 === -1 || index2 === -1) return 0
  
  let interval = index2 - index1
  if (interval < 0) interval += 12
  return interval
}

// 根据根音和音程获取和弦音符
export function getChordNotes(rootNote, intervals) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const root = getNoteName(rootNote)
  const rootIndex = notes.indexOf(root)
  
  if (rootIndex === -1) return []
  
  return intervals.map(interval => notes[(rootIndex + interval) % 12])
}

// 根据根音和调式获取调式音阶音符
export function getModalScaleNotes(rootNote, intervals) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const root = getNoteName(rootNote)
  const rootIndex = notes.indexOf(root)
  
  if (rootIndex === -1) return []
  
  return intervals.map(interval => notes[(rootIndex + interval) % 12])
}

// 获取音符频率
export function getNoteFrequency(note) {
  const noteName = getNoteName(note)
  return NOTE_FREQUENCIES[noteName] || 440
}

// 计算进度百分比
export function calculatePercentage(completed, total) {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// 防抖函数
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深拷贝对象
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  
  const clonedObj = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key])
    }
  }
  return clonedObj
}

