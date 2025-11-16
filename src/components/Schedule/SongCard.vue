<template>
  <div class="song-card">
    <div class="song-header">
      <div class="song-title">{{ song.name }}</div>
      <div class="song-stage" :class="`stage-${song.currentStage}`">
        {{ song.currentStage }}
      </div>
    </div>
    
    <div class="song-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="progress-text">
        <span>{{ progress }}% 完成</span>
        <span>{{ completedTasksCount }}/{{ totalTasks }} 任务</span>
      </div>
    </div>
    
    <div class="song-info">
      <div class="info-item">
        <div class="info-label">子曲风</div>
        <div class="info-value">{{ song.genre || '未设置' }}</div>
      </div>
      <div class="info-item">
        <div class="info-label">预计时长</div>
        <div class="info-value">{{ song.estimatedHours }}h</div>
      </div>
      <div class="info-item">
        <div class="info-label">已用时长</div>
        <div class="info-value">{{ (song.timeSpent || 0).toFixed(1) }}h</div>
      </div>
    </div>
    
    <div class="song-actions">
      <button class="btn btn-small btn-primary" @click="startTimer">⏱️ 开始计时</button>
      <button class="btn btn-small btn-edit" @click="$emit('edit', song)">编辑</button>
      <button class="btn btn-small btn-delete" @click="$emit('delete', song)">删除</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { calculateProgress } from '@/utils/calculations'
import { TASKS } from '@/utils/constants'
import { useTimer } from '@/composables/useTimer'

const props = defineProps({
  song: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])

const { startTimer: startTimerFn } = useTimer()

const progress = computed(() => calculateProgress(props.song))

const completedTasksCount = computed(() => {
  return props.song.tasks.filter(Boolean).length
})

const totalTasks = computed(() => TASKS.length)

function startTimer() {
  startTimerFn(props.song.id, props.song.name)
}
</script>

