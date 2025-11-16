<template>
  <div class="gantt-chart">
    <div v-if="songs.length === 0" class="empty-state">
      <p>还没有添加歌曲，点击上方按钮添加第一首歌吧！</p>
    </div>
    
    <template v-else>
      <div class="gantt-wrapper">
        <div class="gantt-timeline">
          <!-- 时间轴表头 -->
          <div class="gantt-timeline-header">
            <div 
              v-for="(week, weekIndex) in weeks" 
              :key="weekIndex"
              class="gantt-week"
            >
              <div class="gantt-week-label">
                {{ week[0].getMonth() + 1 }}/{{ week[0].getDate() }}
              </div>
              <div class="gantt-week-days">
                <div 
                  v-for="day in week" 
                  :key="day.getTime()"
                  :class="[
                    'gantt-day',
                    {
                      today: isToday(day),
                      'start-date': isStartDate(day)
                    }
                  ]"
                >
                  {{ day.getDate() }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 歌曲行 -->
          <div 
            v-for="(song, index) in songs" 
            :key="song.id"
            class="gantt-row"
          >
            <div class="gantt-song-label">
              <div class="gantt-song-name">
                {{ song.name || `歌曲 ${index + 1}` }}
                <span v-if="song.isNewGenre" class="new-genre-badge">新曲风</span>
              </div>
              <div class="gantt-song-info">
                {{ getProgress(song).toFixed(0) }}% | {{ (song.timeSpent || 0).toFixed(1) }}h / {{ song.estimatedHours }}h
              </div>
              <div class="gantt-song-stage">{{ song.currentStage }}</div>
            </div>
            
            <div class="gantt-song-bar-container">
              <div 
                class="gantt-song-bar"
                :style="getBarStyle(song, index)"
              >
                <div 
                  class="gantt-song-progress"
                  :style="getProgressStyle(song)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSongsStore } from '@/stores/songs'
import { useSettingsStore } from '@/stores/settings'
import { TOTAL_DAYS, TARGET_SONGS, HOURS_PER_SONG, RECOMMENDED_HOURS_PER_DAY } from '@/utils/constants'
import { calculateProgress, getRemainingDays } from '@/utils/calculations'

const songsStore = useSongsStore()
const settingsStore = useSettingsStore()

const { songs } = storeToRefs(songsStore)
const { startDate, dailyMakingHours } = storeToRefs(settingsStore)

const startDateObj = computed(() => {
  if (!startDate.value) return new Date()
  return new Date(startDate.value)
})

const endDateObj = computed(() => {
  const end = new Date(startDateObj.value)
  end.setDate(end.getDate() + TOTAL_DAYS)
  return end
})

const dates = computed(() => {
  const dates = []
  const currentDate = new Date(startDateObj.value)
  while (currentDate <= endDateObj.value) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return dates
})

const weeks = computed(() => {
  const weeks = []
  for (let i = 0; i < dates.value.length; i += 7) {
    weeks.push(dates.value.slice(i, i + 7))
  }
  return weeks
})

const hoursPerDay = computed(() => {
  return dailyMakingHours.value || RECOMMENDED_HOURS_PER_DAY
})

function isToday(day) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayDate = new Date(day)
  dayDate.setHours(0, 0, 0, 0)
  return dayDate.getTime() === today.getTime()
}

function isStartDate(day) {
  const start = new Date(startDateObj.value)
  start.setHours(0, 0, 0, 0)
  const dayDate = new Date(day)
  dayDate.setHours(0, 0, 0, 0)
  return dayDate.getTime() === start.getTime()
}

function getProgress(song) {
  return calculateProgress(song)
}

function getBarStyle(song, index) {
  const remainingTime = song.estimatedHours - (song.timeSpent || 0)
  const estimatedDays = Math.max(1, remainingTime / hoursPerDay.value)
  
  // 计算开始和结束日期
  const startOffset = index * (TOTAL_DAYS / TARGET_SONGS)
  const songStartDate = new Date(startDateObj.value)
  songStartDate.setDate(startDateObj.value.getDate() + Math.floor(startOffset))
  
  const daysFromStart = Math.floor((songStartDate - startDateObj.value) / (1000 * 60 * 60 * 24))
  const dayWidth = 100 / dates.value.length
  const startPercent = daysFromStart * dayWidth
  const widthPercent = estimatedDays * dayWidth
  
  return {
    left: `${Math.max(0, startPercent)}%`,
    width: `${Math.min(widthPercent, 100 - startPercent)}%`
  }
}

function getProgressStyle(song) {
  const progressPercent = (song.timeSpent || 0) / song.estimatedHours * 100
  const backgroundColor = song.currentStage === '已完成' ? '#28a745' : '#667eea'
  
  return {
    width: `${Math.min(progressPercent, 100)}%`,
    backgroundColor
  }
}
</script>

<style scoped>
.gantt-chart {
  width: 100%;
  overflow-x: auto;
}

.gantt-wrapper {
  min-width: 100%;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow-x: auto;
}

.gantt-timeline {
  min-width: 100%;
}

.gantt-timeline-header {
  display: flex;
  border-bottom: 2px solid #1a1a1a;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.gantt-week {
  flex: 0 0 auto;
  min-width: 200px;
  border-right: 1px solid #e0e0e0;
  padding: 10px 8px;
}

.gantt-week-label {
  font-size: 0.75em;
  color: #999;
  margin-bottom: 5px;
  text-align: center;
  font-weight: 600;
}

.gantt-week-days {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
}

.gantt-day {
  flex: 0 0 auto;
  width: 28px;
  font-size: 0.9em;
  color: #666;
  text-align: center;
  padding: 6px 4px;
  border-radius: 3px;
  font-weight: 500;
  white-space: nowrap;
}

.gantt-day.today {
  background: #1a1a1a;
  color: white;
  font-weight: 400;
}

.gantt-day.start-date {
  border: 2px solid #1a1a1a;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  min-height: 80px;
}

.gantt-song-label {
  width: 200px;
  min-width: 200px;
  padding: 15px;
  border-right: 1px solid #e0e0e0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.gantt-song-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 6px;
  font-size: 1em;
}

.new-genre-badge {
  background: #ffc107;
  color: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7em;
  margin-left: 5px;
}

.gantt-song-info {
  font-size: 0.85em;
  color: #666;
  margin-bottom: 4px;
}

.gantt-song-stage {
  font-size: 0.75em;
  color: #999;
}

.gantt-song-bar-container {
  flex: 1;
  position: relative;
  min-height: 80px;
  padding: 15px 0;
}

.gantt-song-bar {
  position: absolute;
  height: 30px;
  background: #e0e0e0;
  border-radius: 4px;
  top: 50%;
  transform: translateY(-50%);
  min-width: 20px;
}

.gantt-song-progress {
  height: 100%;
  background: #667eea;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px;
}

@media (max-width: 768px) {
  .gantt-song-label {
    width: 150px;
    min-width: 150px;
    padding: 10px;
  }
  
  .gantt-song-name {
    font-size: 0.9em;
  }
  
  .gantt-song-info {
    font-size: 0.8em;
  }
  
  .gantt-week {
    min-width: 150px;
  }
  
  .gantt-day {
    width: 20px;
    font-size: 0.8em;
    padding: 4px 2px;
  }
}
</style>

