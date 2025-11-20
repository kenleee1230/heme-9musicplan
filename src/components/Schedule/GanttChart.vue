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
        <!-- 时间轴表头容器 -->
        <div class="gantt-timeline-header-wrapper">
          <!-- 时间轴表头 -->
          <div class="gantt-timeline-header">
            <!-- 移动端：左侧占位 -->
            <div class="gantt-header-spacer-mobile"></div>
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
        </div>
        
        <!-- 歌曲进度条 -->
        <div
          v-for="(song, index) in songs"
          :key="song.id"
          class="gantt-row"
        >
          <!-- 移动端：行内歌曲标签 -->
          <div class="gantt-row-label-mobile">
            <div class="gantt-row-song-name-mobile">
              {{ song.name || `歌曲 ${index + 1}` }}
              <span v-if="song.isNewGenre" class="new-genre-badge-mobile">新</span>
              <span v-if="getSongDelayStatus(song, index) === 'at-risk'" class="delay-badge-mobile at-risk">⚠️</span>
              <span v-if="getSongDelayStatus(song, index) === 'delayed'" class="delay-badge-mobile delayed">⏰</span>
            </div>
            <div class="gantt-row-song-info-mobile">
              {{ getProgress(song).toFixed(0) }}% | {{ (song.timeSpent || 0).toFixed(1) }}h
            </div>
          </div>
          
          <div class="gantt-row-timeline">
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

.gantt-chart * {
  box-sizing: border-box;
}

/* 确保 sidebar 和 main 的行完全对齐 */
.gantt-sidebar,
.gantt-main {
  vertical-align: top;
}

.gantt-container {
  display: flex;
  align-items: flex-start;
}

.gantt-sidebar {
  flex-shrink: 0;
  width: 220px;
  border-right: 2px solid #1a1a1a;
  background: #fafafa;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gantt-main {
  flex: 1;
  overflow-x: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 连续的黑条，覆盖整个滚动区域 */
/* 位置需要与 sidebar header spacer 的 border-bottom 对齐 */
/* sidebar: height 60px + border-bottom 2px (box-sizing: border-box) = border 在 58px-60px */
.gantt-main::before {
  content: '';
  position: absolute;
  top: 58px; /* 与 sidebar border-bottom 对齐 */
  left: 0;
  /* 180天 × 40px = 7200px，加上一些余量 */
  width: 8000px;
  min-width: 100%;
  height: 2px;
  background: #1a1a1a;
  z-index: 16;
  pointer-events: none;
}

.gantt-timeline-header-wrapper {
  position: sticky;
  top: 0;
  z-index: 15;
  background: white;
  overflow: visible;
  height: 60px;
  min-height: 60px;
}

.gantt-header-spacer {
  height: 60px;
  line-height: 60px;
  background: #fafafa;
  border: none;
  border-bottom: 2px solid #1a1a1a;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.gantt-song-label {
  padding: 12px;
  height: 80px;
  line-height: 1;
  background: #fafafa;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  margin: 0;
  box-sizing: border-box;
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

.gantt-timeline-header {
  display: inline-flex;
  height: 60px;
  line-height: 60px;
  background: white;
  border: none;
  align-items: center;
  min-width: 100%;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
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
  display: flex;
  height: 80px;
  line-height: 1;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  align-items: stretch;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 移动端行内标签（默认隐藏） */
.gantt-row-label-mobile {
  display: none;
}

.gantt-header-spacer-mobile {
  display: none;
}

.gantt-row-timeline {
  display: inline-flex;
  min-width: 100%;
  align-items: center;
  min-height: 100%;
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
  
  /* 移动端隐藏左侧 sidebar */
  .gantt-sidebar {
    display: none;
  }
  
  /* 时间轴区域全宽显示 */
  .gantt-main {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
  }
  
  /* 显示行内歌曲标签 */
  .gantt-row-label-mobile {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 160px;
    padding: 10px 12px;
    background: #fafafa;
    border-right: 2px solid #1a1a1a;
    justify-content: flex-start;
    position: sticky;
    left: 0;
    z-index: 10;
    height: 100%;
    min-height: 70px;
  }
  
  .gantt-row-song-name-mobile {
    font-weight: 600;
    color: #1a1a1a;
    font-size: 0.85em;
    margin-bottom: 6px;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    flex-wrap: wrap;
    line-height: 1.4;
    word-break: break-word;
    flex: 1;
  }
  
  .gantt-row-song-info-mobile {
    font-size: 0.7em;
    color: #666;
    white-space: nowrap;
    margin-top: auto;
    padding-top: 4px;
  }
  
  .new-genre-badge-mobile {
    background: #1a1a1a;
    color: white;
    padding: 1px 4px;
    font-size: 0.65em;
    font-weight: 600;
    border-radius: 2px;
    white-space: nowrap;
  }
  
  .delay-badge-mobile {
    padding: 1px 4px;
    font-size: 0.65em;
    font-weight: 600;
    border-radius: 2px;
    white-space: nowrap;
  }
  
  .delay-badge-mobile.at-risk {
    background: #FFF3E0;
    color: #FF9800;
    border: 1px solid #FF9800;
  }
  
  .delay-badge-mobile.delayed {
    background: #FFEBEE;
    color: #F44336;
    border: 1px solid #F44336;
  }
  
  .gantt-row-timeline {
    display: inline-flex;
    min-width: 100%;
  }
  
  .gantt-timeline-header {
    height: 50px;
    position: sticky;
    top: 0;
    z-index: 15;
  }
  
  /* 表头左侧占位 */
  .gantt-header-spacer-mobile {
    display: block;
    flex-shrink: 0;
    width: 160px;
    height: 100%;
    background: white;
    border-right: 2px solid #1a1a1a;
    position: sticky;
    left: 0;
    z-index: 16;
  }
  
  .gantt-day-cell {
    width: 30px;
  }
  
  .gantt-day-label {
    font-size: 0.75em;
  }
  
  .gantt-row {
    height: auto;
    min-height: 70px;
    align-items: stretch;
  }
  
  .gantt-row-label-mobile {
    min-height: 70px;
  }
  
  .gantt-bar-segment {
    width: calc(100% - 2px);
    height: 26px;
  }
}

@media (max-width: 480px) {
  .gantt-row-label-mobile {
    width: 140px;
    padding: 8px 10px;
    min-height: 65px;
  }
  
  .gantt-row-song-name-mobile {
    font-size: 0.8em;
    margin-bottom: 6px;
    line-height: 1.3;
  }
  
  .gantt-row-song-info-mobile {
    font-size: 0.65em;
    padding-top: 4px;
  }
  
  .new-genre-badge-mobile,
  .delay-badge-mobile {
    font-size: 0.6em;
    padding: 1px 3px;
  }
  
  /* 表头占位也要调整 */
  .gantt-header-spacer-mobile {
    width: 140px;
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
    height: auto;
    min-height: 65px;
    align-items: stretch;
  }
  
  .gantt-row-label-mobile {
    min-height: 65px;
  }
  
  .gantt-bar-segment {
    width: calc(100% - 2px);
    height: 24px;
  }
}
</style>

