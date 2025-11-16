<template>
  <div class="timeline-view">
    <div v-if="songs.length === 0" class="empty-state">
      <p>添加歌曲后，时间线规划将显示在这里</p>
    </div>
    
    <template v-else>
      <!-- 总体时间规划 -->
      <div class="timeline-item">
        <h3>📅 时间规划</h3>
        <p><strong>开始日期：</strong>{{ formatDate(startDateObj) }}</p>
        <p><strong>结束日期：</strong>{{ formatDate(endDateObj) }}</p>
        <p><strong>目标：</strong>{{ remainingDays }} 天内完成 {{ TARGET_SONGS }} 首歌（共 {{ TOTAL_DAYS }} 天）</p>
        <p><strong>每首歌：</strong>{{ avgHoursPerSong.toFixed(0) }} 有效小时</p>
        <p><strong>总工作量：</strong>{{ totalHours.toFixed(0) }} 有效小时</p>
        <div class="timeline-section">
          <strong>时间安排：</strong><br>
          • 每天 {{ RECOMMENDED_HOURS_PER_DAY }} 小时（已养成习惯）：{{ daysAtRecommended.toFixed(0) }} 天完成，约 {{ (daysAtRecommended / avgHoursPerSong).toFixed(1) }} 首歌/周<br>
          • 每天 {{ MAX_HOURS_PER_DAY }} 小时（最大强度）：{{ daysAtMax.toFixed(0) }} 天完成，约 {{ (daysAtMax / avgHoursPerSong).toFixed(1) }} 首歌/周<br>
          <span class="success-text">✓ 维持每天2小时的习惯，{{ TOTAL_DAYS }}天可以完成9首歌，一定能拿回全部押金！</span>
        </div>
        <div class="timeline-section">
          <strong>时间分配建议：</strong><br>
          • 编曲作曲：{{ (RECOMMENDED_HOURS_PER_DAY * 0.7).toFixed(1) }} 小时/天 (70%)<br>
          • 混音母带：{{ (RECOMMENDED_HOURS_PER_DAY * 0.3).toFixed(1) }} 小时/天 (30%)
        </div>
      </div>
      
      <!-- 每首歌的预计完成时间 -->
      <div 
        v-for="(song, index) in songs" 
        :key="song.id" 
        class="timeline-item"
      >
        <h3>{{ song.name || `歌曲 ${index + 1}` }}</h3>
        <p><strong>阶段：</strong>{{ song.currentStage }}</p>
        <p><strong>进度：</strong>{{ calculateProgress(song).toFixed(1) }}%</p>
        <p><strong>预计还需：</strong>{{ getEstimatedDays(song).toFixed(1) }} 天完成</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSongsStore } from '@/stores/songs'
import { useSettingsStore } from '@/stores/settings'
import { 
  TARGET_SONGS, 
  TOTAL_DAYS, 
  HOURS_PER_SONG, 
  RECOMMENDED_HOURS_PER_DAY, 
  MAX_HOURS_PER_DAY 
} from '@/utils/constants'
import { calculateProgress, getRemainingDays } from '@/utils/calculations'

const songsStore = useSongsStore()
const settingsStore = useSettingsStore()

const { songs } = storeToRefs(songsStore)
const { startDate, dailyMakingHours } = storeToRefs(settingsStore)

const remainingDays = computed(() => getRemainingDays(startDate.value))

const startDateObj = computed(() => {
  if (!startDate.value) return new Date()
  return new Date(startDate.value)
})

const endDateObj = computed(() => {
  const end = new Date(startDateObj.value)
  end.setDate(end.getDate() + TOTAL_DAYS)
  return end
})

const avgHoursPerSong = computed(() => {
  if (songs.value.length === 0) return HOURS_PER_SONG
  const sum = songs.value.reduce((acc, s) => acc + s.estimatedHours, 0)
  return sum / songs.value.length
})

const totalHours = computed(() => TARGET_SONGS * avgHoursPerSong.value)

const daysAtRecommended = computed(() => {
  return totalHours.value / RECOMMENDED_HOURS_PER_DAY
})

const daysAtMax = computed(() => {
  return totalHours.value / MAX_HOURS_PER_DAY
})

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getEstimatedDays(song) {
  const remainingTime = song.estimatedHours - (song.timeSpent || 0)
  const hoursPerDay = dailyMakingHours.value || RECOMMENDED_HOURS_PER_DAY
  return remainingTime / hoursPerDay
}
</script>

<style scoped>
.timeline-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.timeline-item h3 {
  margin-bottom: 15px;
  color: #1a1a1a;
  font-size: 1.2em;
}

.timeline-item p {
  margin: 8px 0;
  line-height: 1.6;
  color: #333;
}

.timeline-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
  line-height: 1.8;
}

.success-text {
  color: #28a745;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px;
}

@media (max-width: 768px) {
  .timeline-item {
    padding: 15px;
  }
  
  .timeline-item h3 {
    font-size: 1.1em;
  }
}
</style>

