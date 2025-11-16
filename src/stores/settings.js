import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  TOTAL_DAYS,
  DEFAULT_LEARNING_HOURS,
  DEFAULT_MAKING_HOURS,
  START_DATE_KEY,
  TIME_CONFIG_KEY
} from '@/utils/constants'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { getRemainingDays } from '@/utils/calculations'

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const startDate = ref(null)
  const dailyLearningHours = ref(DEFAULT_LEARNING_HOURS)
  const dailyMakingHours = ref(DEFAULT_MAKING_HOURS)

  // 计算属性
  const remainingDays = computed(() => {
    return getRemainingDays(startDate.value)
  })

  const dailyMakingTime = computed(() => {
    return Math.max(0, dailyMakingHours.value - dailyLearningHours.value)
  })

  const endDate = computed(() => {
    if (!startDate.value) return null
    const end = new Date(startDate.value)
    end.setDate(end.getDate() + TOTAL_DAYS)
    return end
  })

  // 从 localStorage 加载设置
  function loadSettings() {
    // 加载开始日期
    const savedStartDate = loadFromStorage(START_DATE_KEY)
    if (savedStartDate) {
      startDate.value = savedStartDate
    } else {
      // 默认开始日期
      const defaultDate = new Date('2025-11-08')
      startDate.value = defaultDate.toISOString()
      saveStartDate(startDate.value)
    }

    // 加载时间配置
    const savedTimeConfig = loadFromStorage(TIME_CONFIG_KEY)
    if (savedTimeConfig) {
      dailyLearningHours.value = savedTimeConfig.dailyLearningHours || DEFAULT_LEARNING_HOURS
      dailyMakingHours.value = savedTimeConfig.dailyMakingHours || DEFAULT_MAKING_HOURS
    }
  }

  // 保存开始日期
  function saveStartDate(date) {
    startDate.value = new Date(date).toISOString()
    saveToStorage(START_DATE_KEY, startDate.value)
  }

  // 保存时间配置
  function saveTimeConfig() {
    const config = {
      dailyLearningHours: dailyLearningHours.value,
      dailyMakingHours: dailyMakingHours.value
    }
    saveToStorage(TIME_CONFIG_KEY, config)
  }

  // 更新时间配置
  function updateTimeConfig(learning, making) {
    dailyLearningHours.value = Math.max(0, Math.min(2, learning))
    dailyMakingHours.value = Math.max(0, Math.min(6, making))
    saveTimeConfig()
  }

  return {
    // 状态
    startDate,
    dailyLearningHours,
    dailyMakingHours,
    // 计算属性
    remainingDays,
    dailyMakingTime,
    endDate,
    // 方法
    loadSettings,
    saveStartDate,
    saveTimeConfig,
    updateTimeConfig
  }
})

