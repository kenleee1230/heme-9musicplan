<template>
  <div class="gantt-chart">
    <div v-if="songs.length === 0" class="empty-state">
      <p>还没有添加歌曲，点击上方按钮添加第一首歌吧！</p>
    </div>
    
    <div v-else class="gantt-container">
      <!-- 左侧标签列 -->
      <div class="gantt-sidebar">
        <!-- 表头占位 -->
        <div class="gantt-header-spacer"></div>
        
        <!-- 歌曲标签 -->
        <div
          v-for="(song, index) in songs"
          :key="song.id"
          class="gantt-song-label"
        >
          <div class="gantt-song-name">
            {{ song.name || `歌曲 ${index + 1}` }}
            <span v-if="song.isNewGenre" class="new-genre-badge">新曲风</span>
            <span v-if="getSongDelayStatus(song, index) === 'at-risk'" class="delay-badge at-risk">⚠️ 风险</span>
            <span v-if="getSongDelayStatus(song, index) === 'delayed'" class="delay-badge delayed">⏰ 延期</span>
          </div>
          <div class="gantt-song-info">
            {{ getProgress(song).toFixed(0) }}% | {{ (song.timeSpent || 0).toFixed(1) }}h / {{ song.estimatedHours }}h
          </div>
          <div class="gantt-song-stage">{{ song.currentStage }}</div>
        </div>
      </div>
      
      <!-- 右侧时间轴和进度条 -->
      <div class="gantt-main">
        <!-- 时间轴表头 -->
        <div class="gantt-timeline-header">
          <div
            v-for="(date, index) in dates"
            :key="index"
            :class="['gantt-day-cell', { 
              'is-today': isToday(date),
              'is-start': isStartDate(date)
            }]"
          >
            <div class="gantt-day-label">
              {{ date.getDate() }}
            </div>
          </div>
        </div>
        
        <!-- 歌曲进度条 -->
        <div
          v-for="(song, index) in songs"
          :key="song.id"
          class="gantt-row"
        >
          <div
            v-for="(date, dayIndex) in dates"
            :key="dayIndex"
            class="gantt-day-cell"
          >
            <!-- 如果这一天在歌曲的时间范围内，显示进度条 -->
            <div
              v-if="isSongActiveOnDay(song, date, index)"
              class="gantt-bar-segment"
              :class="{ 'is-completed': song.currentStage === '已完成' }"
              :style="getSegmentStyle(song, date, index)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSongsStore } from '@/stores/songs'
import { useSettingsStore } from '@/stores/settings'
import { TOTAL_DAYS, RECOMMENDED_HOURS_PER_DAY } from '@/utils/constants'
import { calculateProgress, getSongStartDate } from '@/utils/calculations'

const songsStore = useSongsStore()
const settingsStore = useSettingsStore()

const { songs } = storeToRefs(songsStore)
const { startDate, dailyMakingHours } = storeToRefs(settingsStore)

// 项目开始日期
const projectStartDate = computed(() => {
  if (!startDate.value) return new Date()
  const date = new Date(startDate.value)
  date.setHours(0, 0, 0, 0)
  return date
})

// 项目结束日期
const projectEndDate = computed(() => {
  const end = new Date(projectStartDate.value)
  end.setDate(end.getDate() + TOTAL_DAYS)
  end.setHours(0, 0, 0, 0)
  return end
})

// 生成所有日期
const dates = computed(() => {
  const dateList = []
  const current = new Date(projectStartDate.value)
  
  while (current <= projectEndDate.value) {
    dateList.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dateList
})

// 每天的工作小时数
const hoursPerDay = computed(() => {
  return dailyMakingHours.value || RECOMMENDED_HOURS_PER_DAY
})

// 判断是否是今天
function isToday(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate.getTime() === today.getTime()
}

// 判断是否是项目开始日期
function isStartDate(date) {
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate.getTime() === projectStartDate.value.getTime()
}

// 获取进度
function getProgress(song) {
  return calculateProgress(song)
}

// 获取歌曲的开始和结束日期
function getSongDateRange(song, index) {
  // 获取开始日期（使用智能推断）
  const songStartDate = getSongStartDate(song, startDate.value, index)
  
  if (!songStartDate || isNaN(songStartDate.getTime())) {
    return null
  }
  
  const songStart = new Date(songStartDate)
  songStart.setHours(0, 0, 0, 0)
  
  // 计算剩余工作时间和预计天数
  const remainingHours = song.estimatedHours - (song.timeSpent || 0)
  const estimatedDays = Math.max(1, Math.ceil(remainingHours / hoursPerDay.value))
  
  // 计算结束日期
  const songEnd = new Date(songStart)
  songEnd.setDate(songStart.getDate() + estimatedDays - 1)
  songEnd.setHours(0, 0, 0, 0)
  
  return {
    start: songStart,
    end: songEnd,
    days: estimatedDays
  }
}

// 获取歌曲的延期状态
function getSongDelayStatus(song, index) {
  if (song.currentStage === '已完成') {
    return 'completed'
  }
  
  const range = getSongDateRange(song, index)
  if (!range) return 'normal'
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const songStart = new Date(range.start)
  songStart.setHours(0, 0, 0, 0)
  
  // 如果还没开始，状态正常
  if (today < songStart) {
    return 'normal'
  }
  
  // 计算预期进度（基于时间流逝）
  const totalDays = Math.ceil(song.estimatedHours / hoursPerDay.value)
  const daysPassed = Math.floor((today.getTime() - songStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const expectedHours = Math.min(daysPassed * hoursPerDay.value, song.estimatedHours)
  const actualHours = song.timeSpent || 0
  
  // 如果实际进度落后预期20%以上，标记为有风险
  const progressGap = expectedHours - actualHours
  const gapPercent = (progressGap / song.estimatedHours) * 100
  
  if (gapPercent > 20) {
    return 'at-risk' // 延期风险
  }
  
  // 如果今天已超过计划完成日期
  if (today > range.end) {
    return 'delayed' // 已延期
  }
  
  return 'normal'
}

// 判断歌曲在某一天是否活跃
function isSongActiveOnDay(song, date, index) {
  const range = getSongDateRange(song, index)
  if (!range) return false
  
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  return checkDate >= range.start && checkDate <= range.end
}

// 获取进度条片段样式
function getSegmentStyle(song, date, index) {
  const range = getSongDateRange(song, index)
  if (!range) return {}
  
  // 计算已完成的完整天数（只有完整完成一天的工作量才算）
  const spentHours = song.timeSpent || 0
  const completedFullDays = Math.floor(spentHours / hoursPerDay.value)
  
  // 计算当前日期是歌曲的第几天（从0开始）
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  
  const daysSinceStart = Math.floor((checkDate.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24))
  
  // 只有已完成整天工作量的天数才显示为深色
  const isCompleted = daysSinceStart < completedFullDays
  
  // 获取延期状态，决定颜色
  const delayStatus = getSongDelayStatus(song, index)
  let backgroundColor = '#1a1a1a' // 正常：黑色
  
  if (delayStatus === 'at-risk') {
    backgroundColor = '#FF9800' // 有风险：橙色
  } else if (delayStatus === 'delayed') {
    backgroundColor = '#F44336' // 已延期：红色
  } else if (delayStatus === 'completed') {
    backgroundColor = '#1DB954' // 已完成：绿色
  }
  
  return {
    opacity: isCompleted ? '1' : '0.3',
    backgroundColor
  }
}
</script>

<style scoped>
.gantt-chart {
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

.gantt-container {
  display: flex;
}

.gantt-sidebar {
  flex-shrink: 0;
  width: 220px;
  border-right: 2px solid #1a1a1a;
  background: #fafafa;
}

.gantt-header-spacer {
  height: 60px;
  background: #fafafa;
  border-bottom: 2px solid #1a1a1a;
}

.gantt-song-label {
  padding: 12px;
  height: 80px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.gantt-song-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
  font-size: 0.9em;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  line-height: 1.3;
  flex-wrap: wrap;
  word-break: break-word;
  max-width: 100%;
}

.new-genre-badge {
  background: #1a1a1a;
  color: white;
  padding: 2px 5px;
  font-size: 0.65em;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 3px;
  flex-shrink: 0;
}

.delay-badge {
  padding: 2px 5px;
  font-size: 0.65em;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 3px;
  flex-shrink: 0;
}

.delay-badge.at-risk {
  background: #FFF3E0;
  color: #FF9800;
  border: 1px solid #FF9800;
}

.delay-badge.delayed {
  background: #FFEBEE;
  color: #F44336;
  border: 1px solid #F44336;
}

.gantt-song-info {
  font-size: 0.75em;
  color: #666;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-song-stage {
  font-size: 0.7em;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-main {
  flex: 1;
  overflow-x: auto;
}

.gantt-timeline-header {
  display: inline-flex;
  height: 60px;
  background: white;
  border-bottom: 2px solid #1a1a1a;
  position: sticky;
  top: 0;
  z-index: 15;
  align-items: center;
  min-width: 100%;
}

.gantt-day-cell {
  flex-shrink: 0;
  width: 40px;
  height: 100%;
  position: relative;
  border-right: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gantt-day-label {
  font-size: 0.85em;
  color: #666;
  font-weight: 500;
}

.gantt-day-cell.is-today .gantt-day-label {
  background: #1a1a1a;
  color: white;
  padding: 4px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.gantt-day-cell.is-start {
  border-left: 2px solid #1a1a1a;
}

.gantt-row {
  display: inline-flex;
  height: 80px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
  min-width: 100%;
}

.gantt-bar-segment {
  width: calc(100% - 2px);
  height: 32px;
  transition: all 0.2s;
  border-radius: 3px;
  /* background 由 style 动态设置 */
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px;
}

@media (max-width: 1024px) {
  .gantt-sidebar {
    flex: 0 0 auto;
    width: 180px;
  }
  
  .gantt-song-label {
    padding: 10px;
  }
  
  .gantt-song-name {
    font-size: 0.85em;
  }
  
  .gantt-day-cell {
    flex: 0 0 35px;
    width: 35px;
  }
  
  .gantt-bar-segment {
    width: calc(100% - 2px);
    height: 28px;
  }
}

@media (max-width: 768px) {
  .gantt-chart {
    border-radius: 4px;
  }
  
  .gantt-sidebar {
    width: 130px;
  }
  
  .gantt-header-spacer {
    height: 50px;
  }
  
  .gantt-song-label {
    padding: 8px 6px;
    height: 70px;
  }
  
  .gantt-song-name {
    font-size: 0.75em;
    margin-bottom: 3px;
    gap: 3px;
  }
  
  .gantt-song-info {
    font-size: 0.65em;
    margin-bottom: 1px;
  }
  
  .gantt-song-stage {
    font-size: 0.6em;
  }
  
  .new-genre-badge,
  .delay-badge {
    font-size: 0.6em;
    padding: 1px 4px;
  }
  
  .gantt-timeline-header {
    height: 50px;
  }
  
  .gantt-day-cell {
    width: 30px;
  }
  
  .gantt-day-label {
    font-size: 0.75em;
  }
  
  .gantt-row {
    height: 70px;
  }
  
  .gantt-bar-segment {
    width: calc(100% - 2px);
    height: 26px;
  }
}

@media (max-width: 480px) {
  .gantt-sidebar {
    width: 110px;
  }
  
  .gantt-song-label {
    padding: 6px 4px;
    height: 65px;
  }
  
  .gantt-song-name {
    font-size: 0.7em;
    margin-bottom: 2px;
  }
  
  .gantt-song-info {
    font-size: 0.6em;
  }
  
  .gantt-song-stage {
    font-size: 0.55em;
  }
  
  .new-genre-badge,
  .delay-badge {
    font-size: 0.55em;
    padding: 1px 3px;
  }
  
  .gantt-header-spacer {
    height: 45px;
  }
  
  .gantt-timeline-header {
    height: 45px;
  }
  
  .gantt-day-cell {
    width: 26px;
  }
  
  .gantt-day-label {
    font-size: 0.7em;
  }
  
  .gantt-row {
    height: 65px;
  }
  
  .gantt-bar-segment {
    width: calc(100% - 2px);
    height: 24px;
  }
}
</style>

