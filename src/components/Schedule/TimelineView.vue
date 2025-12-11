<template>
  <div class="timeline-view">
    <div v-if="!hasProject" class="empty-state">
      <p>请先选择或创建一个项目</p>
    </div>
    
    <div v-else-if="songs.length === 0" class="empty-state">
      <p>添加作品后，时间线规划将显示在这里</p>
    </div>
    
    <template v-else>
      <!-- 总体时间规划 -->
      <div class="timeline-item">
        <h3>📅 时间规划</h3>
        <p><strong>开始日期：</strong>{{ formatDate(startDateObj) }}</p>
        <p><strong>结束日期：</strong>{{ formatDate(endDateObj) }}</p>
        <p v-if="remainingDays !== null"><strong>剩余天数：</strong>{{ remainingDays }} 天</p>
        <p v-if="targetCount"><strong>目标：</strong>{{ targetCount }} 首作品</p>
        <p><strong>每首作品：</strong>{{ avgHoursPerSong.toFixed(0) }} 有效小时</p>
        <p><strong>总工作量：</strong>{{ totalHours.toFixed(0) }} 有效小时</p>
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
import { useTracksStore } from '@/stores/tracks'
import { useProjectsStore } from '@/stores/projects'
import { 
  HOURS_PER_SONG, 
  RECOMMENDED_HOURS_PER_DAY
} from '@/utils/constants'
import { calculateProgress } from '@/utils/calculations'

const tracksStore = useTracksStore()
const projectsStore = useProjectsStore()

const { projectTracks: songs } = storeToRefs(tracksStore)
const { activeProject } = storeToRefs(projectsStore)

const startDate = computed(() => activeProject.value?.startDate || null)
const deadline = computed(() => activeProject.value?.deadline || null)
const dailyMakingHours = computed(() => activeProject.value?.settings?.dailyHours || 2)
const targetCount = computed(() => activeProject.value?.targetCount || null)

const remainingDays = computed(() => {
  if (!deadline.value) return null
  const end = new Date(deadline.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
})

const startDateObj = computed(() => {
  if (!startDate.value) return new Date()
  return new Date(startDate.value)
})

const endDateObj = computed(() => {
  if (deadline.value) {
    return new Date(deadline.value)
  }
  // 如果没有截止日期，使用开始日期 + 180天作为默认
  const end = new Date(startDateObj.value)
  end.setDate(end.getDate() + 180)
  return end
})

const avgHoursPerSong = computed(() => {
  if (songs.value.length === 0) return HOURS_PER_SONG
  const sum = songs.value.reduce((acc, s) => acc + s.estimatedHours, 0)
  return sum / songs.value.length
})

const totalHours = computed(() => {
  const count = targetCount.value || songs.value.length || 9
  return count * avgHoursPerSong.value
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

// 添加空状态提示
const hasProject = computed(() => !!activeProject.value)
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

