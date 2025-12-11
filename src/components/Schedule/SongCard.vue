<template>
  <div class="song-card">
    <div class="song-header">
      <div class="song-title-section">
        <div class="song-title">{{ song.name }}</div>
        <!-- 开始制作时间提醒 -->
        <div 
          v-if="!hasStartDate" 
          class="start-date-reminder"
          @click="$emit('edit', song)"
          title="点击设置开始制作时间"
        >
          <span class="reminder-icon">📅</span>
          <span class="reminder-text">未设置开始制作时间，点击设置</span>
        </div>
      </div>
      <div class="song-stage">
        当前阶段：{{ song.currentStage }}
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
        <div class="info-value">{{ formatTimeSpent(song.timeSpent || 0) }}</div>
      </div>
    </div>
    
    <div class="song-actions">
      <button class="btn btn-small btn-primary" @click="startTimer">⏱️ 开始计时</button>
      <button 
        v-if="hasTimerRecords" 
        class="btn btn-small btn-view" 
        @click="toggleRecords"
        :title="showRecords ? '收起记录' : '展开记录'"
      >
        {{ showRecords ? '📊 收起' : '📊 记录' }}
      </button>
      <button class="btn btn-small btn-edit" @click="$emit('edit', song)">编辑</button>
      <button class="btn btn-small btn-delete" @click="$emit('delete', song)">删除</button>
    </div>
    
    <!-- 计时记录区域 -->
    <div v-if="showRecords && hasTimerRecords" class="timer-records-section">
      <div class="timer-records-header">
        <span class="records-title">计时记录 ({{ timerRecords.length }})</span>
      </div>
      <div class="timer-records-list">
        <div v-for="record in sortedRecords" :key="record.id" class="timer-record-item">
          <div class="timer-record-header">
            <div class="timer-record-time">
              <span class="record-date">{{ formatRecordDate(record.createdAt) }}</span>
              <span class="record-separator">·</span>
              <span class="record-duration">{{ formatDuration(record.duration) }}</span>
            </div>
            <div class="record-actions">
              <button 
                type="button" 
                class="btn btn-tiny btn-edit" 
                @click.stop="editRecord(record)"
                title="编辑记录"
              >
                ✏️
              </button>
              <button 
                type="button" 
                class="btn btn-tiny btn-delete" 
                @click.stop="deleteRecord(record.id)"
                title="删除记录"
              >
                ×
              </button>
            </div>
          </div>
          <div v-if="record.details" class="timer-record-details">
            {{ record.details }}
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑计时记录对话框 -->
    <div v-if="editingRecord" class="modal timer-edit-dialog" @click.self="cancelEdit">
      <div class="modal-content timer-edit-modal" @click.stop>
        <span class="close" @click="cancelEdit">&times;</span>
        <h2>编辑计时记录</h2>
        <div class="timer-edit-form">
          <div class="form-group">
            <label>时长（小时）</label>
            <input 
              v-model.number="editForm.durationHours" 
              type="number" 
              min="0" 
              step="0.1"
              placeholder="例如：1.5"
            />
            <small>当前：{{ formatDuration(editingRecord.duration) }}</small>
          </div>
          <div class="form-group">
            <label>明细</label>
            <textarea 
              v-model="editForm.details" 
              rows="4"
              placeholder="记录本次计时的详细内容..."
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-primary" @click="saveEdit">保存</button>
            <button type="button" class="btn btn-secondary" @click="cancelEdit">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calculateProgress } from '@/utils/calculations'
import { TASKS } from '@/utils/constants'
import { useTimer } from '@/composables/useTimer'
import { useTracksStore } from '@/stores/tracks'
import { formatDuration, formatTimeSpent } from '@/utils/helpers'

const props = defineProps({
  song: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])

const tracksStore = useTracksStore()
const { startTimer: startTimerFn } = useTimer()

const showRecords = ref(false)
const editingRecord = ref(null)
const editForm = ref({
  durationHours: 0,
  details: ''
})

const progress = computed(() => calculateProgress(props.song))

const completedTasksCount = computed(() => {
  // 使用新的数据结构：stepsCompleted
  const steps = props.song.stepsCompleted || props.song.tasks || []
  return Array.isArray(steps) ? steps.filter(Boolean).length : 0
})

const totalTasks = computed(() => {
  // 使用新的数据结构：customSteps，如果没有则使用默认 TASKS 长度
  const customSteps = props.song.customSteps || props.song.customTasks
  return (Array.isArray(customSteps) && customSteps.length > 0)
    ? customSteps.length
    : TASKS.length
})

const hasTimerRecords = computed(() => {
  return props.song.timerRecords && props.song.timerRecords.length > 0
})

// 判断歌曲是否手动设置了开始制作时间
const hasStartDate = computed(() => {
  const startDate = props.song.startDate
  if (!startDate || typeof startDate !== 'string' || startDate.trim() === '') {
    return false
  }
  
  // 检查是否为有效的日期格式（YYYY-MM-DD 或其他可解析格式）
  const dateStr = startDate.trim()
  let parsedDate = null
  
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // YYYY-MM-DD 格式
    const [year, month, day] = dateStr.split('-').map(Number)
    parsedDate = new Date(year, month - 1, day)
    parsedDate.setHours(0, 0, 0, 0)
  } else {
    // 其他格式，尝试直接解析
    parsedDate = new Date(dateStr)
    parsedDate.setHours(0, 0, 0, 0)
  }
  
  return !isNaN(parsedDate.getTime())
})

// 获取计时记录（从 store 获取最新数据）
const timerRecords = computed(() => {
  const latestSong = tracksStore.getTrackById(props.song.id) || props.song
  return latestSong.timerRecords || []
})

// 按时间倒序排列的计时记录
const sortedRecords = computed(() => {
  return [...timerRecords.value].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.startTime || 0).getTime()
    const timeB = new Date(b.createdAt || b.startTime || 0).getTime()
    return timeB - timeA // 最新的在前
  })
})

function startTimer() {
  startTimerFn(props.song.id, props.song.name)
}

function toggleRecords() {
  showRecords.value = !showRecords.value
}

// formatDuration 和 formatTimeSpent 已从 helpers.js 导入

function formatRecordDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function editRecord(record) {
  editingRecord.value = record
  editForm.value = {
    durationHours: record.duration || 0,
    details: record.details || ''
  }
}

function cancelEdit() {
  editingRecord.value = null
  editForm.value = {
    durationHours: 0,
    details: ''
  }
}

async function saveEdit() {
  if (!editingRecord.value) return
  
  const newDuration = editForm.value.durationHours
  if (!newDuration || newDuration <= 0) {
    alert('请输入有效的时长（大于0）')
    return
  }

  try {
    // 保留1位小数
    const roundedDuration = Math.round(newDuration * 10) / 10
    await tracksStore.updateTimerRecord(props.song.id, editingRecord.value.id, {
      duration: roundedDuration,
      details: editForm.value.details
    })
    cancelEdit()
  } catch (error) {
    alert(`保存失败：${error.message || '未知错误'}`)
    console.error('更新计时记录失败:', error)
  }
}

async function deleteRecord(recordId) {
  if (confirm('确定要删除这条计时记录吗？')) {
    await tracksStore.deleteTimerRecord(props.song.id, recordId)
  }
}
</script>

