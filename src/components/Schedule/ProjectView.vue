<template>
  <div class="project-view">
    <div v-if="!activeProject" class="empty-state">
      <p>请先选择或创建一个项目</p>
    </div>
    
    <div v-else-if="songs.length === 0" class="empty-state">
      <p>还没有添加作品</p>
    </div>
    
    <template v-else>
      <!-- 项目概览卡片 -->
      <div class="project-card">
        <h3>📊 项目概览</h3>
        <div class="project-stats-grid">
          <div class="project-stat">
            <div class="project-stat-label">整体进度</div>
            <div class="project-stat-value">{{ totalProgress.toFixed(1) }}%</div>
            <div class="project-progress-bar">
              <div class="project-progress-fill" :style="{ width: totalProgress + '%' }"></div>
            </div>
          </div>
          <div class="project-stat">
            <div class="project-stat-label">已完成作品</div>
            <div class="project-stat-value">{{ completedSongs }} / {{ TARGET_SONGS.value || songs.length }}</div>
          </div>
          <div class="project-stat">
            <div class="project-stat-label">进行中</div>
            <div class="project-stat-value">{{ inProgressSongs }} 首</div>
          </div>
          <div class="project-stat">
            <div class="project-stat-label">时间进度</div>
            <div class="project-stat-value">{{ timeProgress.toFixed(1) }}%</div>
            <div class="project-stat-sublabel">{{ totalSpentHours.toFixed(1) }}h / {{ totalEstimatedHours.toFixed(1) }}h</div>
          </div>
        </div>
      </div>
      
      <!-- 里程碑卡片 -->
      <div class="project-card">
        <h3>🎯 里程碑</h3>
        <div class="milestones">
          <div 
            v-for="milestone in milestones" 
            :key="milestone.name"
            :class="['milestone', { achieved: milestone.achieved }]"
          >
            <div class="milestone-icon">{{ milestone.achieved ? '✅' : '⏳' }}</div>
            <div class="milestone-info">
              <div class="milestone-name">{{ milestone.name }}</div>
              <div class="milestone-progress">{{ milestone.progress }}%</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 歌曲状态分布卡片 -->
      <div class="project-card">
        <h3>🎵 歌曲状态分布</h3>
        <div class="stage-distribution">
          <div 
            v-for="stage in STAGES" 
            :key="stage"
            class="stage-item"
          >
            <div class="stage-name">{{ stage }}</div>
            <div class="stage-bar">
              <div 
                class="stage-bar-fill" 
                :style="{ width: getStagePercent(stage) + '%' }"
              ></div>
            </div>
            <div class="stage-count">{{ getStageCount(stage) }} 首</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTracksStore } from '@/stores/tracks'
import { useProjectsStore } from '@/stores/projects'
import { STAGES } from '@/utils/constants'
import { calculateProgress } from '@/utils/calculations'

const tracksStore = useTracksStore()
const projectsStore = useProjectsStore()

const { projectTracks: songs } = storeToRefs(tracksStore)
const { activeProject } = storeToRefs(projectsStore)

const TARGET_SONGS = computed(() => activeProject.value?.targetCount || 9)

const totalProgress = computed(() => {
  if (songs.value.length === 0) return 0
  const sum = songs.value.reduce((acc, song) => acc + calculateProgress(song), 0)
  return sum / songs.value.length
})

const completedSongs = computed(() => {
  return songs.value.filter(s => s.currentStage === '已完成').length
})

const inProgressSongs = computed(() => {
  return songs.value.filter(s => s.currentStage !== '已完成' && s.currentStage !== '曲风研究').length
})

const totalEstimatedHours = computed(() => {
  return songs.value.reduce((sum, s) => sum + s.estimatedHours, 0)
})

const totalSpentHours = computed(() => {
  return songs.value.reduce((sum, s) => sum + (s.timeSpent || 0), 0)
})

const timeProgress = computed(() => {
  if (totalEstimatedHours.value === 0) return 0
  return (totalSpentHours.value / totalEstimatedHours.value) * 100
})

const milestones = computed(() => {
  return [
    { name: '第一首歌完成', progress: 11.1, achieved: completedSongs.value >= 1 },
    { name: '25%完成', progress: 25, achieved: completedSongs.value >= 3 },
    { name: '一半完成', progress: 50, achieved: completedSongs.value >= 5 },
    { name: '75%完成', progress: 75, achieved: completedSongs.value >= 7 },
    { name: '全部完成', progress: 100, achieved: completedSongs.value >= 9 }
  ]
})

function getStageCount(stage) {
  return songs.value.filter(s => s.currentStage === stage).length
}

function getStagePercent(stage) {
  if (songs.value.length === 0) return 0
  const count = getStageCount(stage)
  return (count / songs.value.length) * 100
}
</script>

<style scoped>
.project-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.project-card h3 {
  margin-bottom: 20px;
  color: #1a1a1a;
  font-size: 1.2em;
}

.project-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.project-stat {
  text-align: center;
}

.project-stat-label {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 8px;
}

.project-stat-value {
  font-size: 2em;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.project-stat-sublabel {
  font-size: 0.85em;
  color: #999;
  margin-top: 4px;
}

.project-progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.project-progress-fill {
  height: 100%;
  background: #1a1a1a;
  transition: width 0.3s ease;
}

.milestones {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.milestone {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.milestone.achieved {
  background: #e8f5e9;
  border-color: #4caf50;
}

.milestone-icon {
  font-size: 1.5em;
}

.milestone-info {
  flex: 1;
}

.milestone-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.milestone-progress {
  font-size: 0.9em;
  color: #666;
}

.stage-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stage-name {
  min-width: 100px;
  font-size: 0.9em;
  color: #333;
}

.stage-bar {
  flex: 1;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.stage-bar-fill {
  height: 100%;
  background: #1a1a1a;
  transition: width 0.3s ease;
}

.stage-count {
  min-width: 50px;
  text-align: right;
  font-size: 0.9em;
  color: #666;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px;
}

@media (max-width: 768px) {
  .project-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stage-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .stage-name {
    min-width: auto;
  }
  
  .stage-bar {
    width: 100%;
  }
  
  .stage-count {
    min-width: auto;
    text-align: left;
  }
}
</style>

