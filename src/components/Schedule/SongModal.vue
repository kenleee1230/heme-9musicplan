<template>
  <div class="modal" style="display: flex">
    <div class="modal-content">
      <span class="close" @click="$emit('close')">&times;</span>
      <h2>{{ song ? '编辑歌曲' : '添加新歌' }}</h2>
      
      <form @submit.prevent="handleSave">
        <div class="form-group">
          <label>歌曲名称</label>
          <input v-model="formData.name" type="text" required />
        </div>
        
        <div class="form-group">
          <label>子曲风</label>
          <input v-model="formData.genre" type="text" placeholder="例如：Future Bass, Deep House" />
          <small>建议：90%精力用于制作你当下正喜欢的曲风</small>
        </div>
        
        <div class="form-group">
          <label>预计有效时长（小时）</label>
          <input v-model.number="formData.estimatedHours" type="number" min="20" max="60" step="1" @input="handleEstimatedHoursChange" />
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="formData.isNewGenre" type="checkbox" @change="handleGenreChange" />
            <span>是否为新曲风</span>
          </label>
          <small>新曲风需要至少一周前期准备</small>
        </div>
        
        <div v-if="showTaskHours" class="form-group">
          <label>
            任务时长分配（小时）
            <button type="button" class="btn btn-small" @click="recalculateTaskHours">重新计算</button>
          </label>
          <div class="task-hours-list">
            <div v-for="(task, index) in TASKS" :key="index" class="task-hour-item">
              <label class="task-hour-label">{{ task }}</label>
              <input 
                v-model.number="formData.taskHours[index]" 
                type="number" 
                min="0" 
                step="0.5" 
                class="task-hour-input"
                @input="handleTaskHourChange"
              />
            </div>
          </div>
          <small>可以手动调整每个任务的时长，系统会自动重新计算总时长。</small>
        </div>
        
        <div class="form-group">
          <label>已用时长（小时）</label>
          <input v-model.number="formData.timeSpent" type="number" min="0" step="0.5" @blur="formatTimeSpent" />
        </div>
        
        <div class="form-group">
          <label>当前阶段</label>
          <select v-model="formData.currentStage">
            <option value="曲风研究">曲风研究</option>
            <option value="Demo制作">Demo制作</option>
            <option value="编曲">编曲</option>
            <option value="混音母带">混音母带</option>
            <option value="队长审核">队长审核</option>
            <option value="校长审核">校长审核</option>
            <option value="已完成">已完成</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>任务进度</label>
          <div class="task-checklist">
            <label v-for="(task, index) in TASKS" :key="index">
              <input v-model="formData.tasks[index]" type="checkbox" />
              {{ task }}
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="formData.notes" rows="3"></textarea>
        </div>
        
        <!-- 计时记录展示区域（仅在编辑模式下显示） -->
        <div v-if="song && timerRecords.length > 0" class="form-group">
          <label>计时记录</label>
          <div class="timer-records-list">
            <div v-for="record in sortedTimerRecords" :key="record.id" class="timer-record-item">
              <div class="timer-record-header">
                <div class="timer-record-time">
                  <span class="record-date">{{ formatRecordDate(record.createdAt) }}</span>
                  <span class="record-separator">·</span>
                  <span class="record-duration">{{ formatDuration(record.duration) }}</span>
                </div>
                <button 
                  type="button" 
                  class="btn btn-small btn-delete" 
                  @click="deleteRecord(record.id)"
                  title="删除记录"
                >
                  删除
                </button>
              </div>
              <div v-if="record.details" class="timer-record-details">
                {{ record.details }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">保存</button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { TASKS } from '@/utils/constants'
import { calculateTaskHours } from '@/utils/calculations'
import { useSongsStore } from '@/stores/songs'
import { formatDuration } from '@/utils/helpers'

const props = defineProps({
  song: Object
})

const emit = defineEmits(['close', 'save'])

const songsStore = useSongsStore()
const showTaskHours = ref(false)

// 获取计时记录
const timerRecords = computed(() => {
  if (!props.song || !props.song.timerRecords) return []
  return props.song.timerRecords
})

// 按时间倒序排列的计时记录
const sortedTimerRecords = computed(() => {
  return [...timerRecords.value].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.startTime || 0).getTime()
    const timeB = new Date(b.createdAt || b.startTime || 0).getTime()
    return timeB - timeA // 最新的在前
  })
})

const formData = ref({
  name: '',
  genre: '',
  estimatedHours: 40,
  isNewGenre: false,
  currentStage: '曲风研究',
  tasks: new Array(TASKS.length).fill(false),
  taskHours: calculateTaskHours(40, false),
  timeSpent: 0,
  notes: ''
})

// 如果是编辑模式，填充表单
watch(() => props.song, (song) => {
  if (song) {
    const taskHours = song.taskHours || calculateTaskHours(song.estimatedHours || 40, song.isNewGenre || false)
    formData.value = {
      name: song.name,
      genre: song.genre || '',
      estimatedHours: song.estimatedHours || 40,
      isNewGenre: song.isNewGenre || false,
      currentStage: song.currentStage || '曲风研究',
      tasks: [...(song.tasks || new Array(TASKS.length).fill(false))],
      taskHours: [...taskHours],
      timeSpent: song.timeSpent || 0,
      notes: song.notes || ''
    }
    // 如果有自定义的任务时长，显示任务时长区域
    if (song.taskHours && song.taskHours.length > 0) {
      showTaskHours.value = true
    }
  } else {
    // 新建模式，重置表单
    formData.value = {
      name: '',
      genre: '',
      estimatedHours: 40,
      isNewGenre: false,
      currentStage: '曲风研究',
      tasks: new Array(TASKS.length).fill(false),
      taskHours: calculateTaskHours(40, false),
      timeSpent: 0,
      notes: ''
    }
    showTaskHours.value = false
  }
}, { immediate: true })

function handleEstimatedHoursChange() {
  // 当预计时长改变时，显示任务时长分配
  showTaskHours.value = true
  recalculateTaskHours()
}

function handleGenreChange() {
  // 当"是否为新曲风"改变时，重新计算任务时长
  showTaskHours.value = true
  recalculateTaskHours()
}

function recalculateTaskHours() {
  // 重新计算任务时长分配
  formData.value.taskHours = calculateTaskHours(
    formData.value.estimatedHours,
    formData.value.isNewGenre
  )
}

function handleTaskHourChange() {
  // 当单个任务时长改变时，重新计算总时长
  const total = formData.value.taskHours.reduce((sum, hours) => sum + (hours || 0), 0)
  formData.value.estimatedHours = Math.round(total * 10) / 10
}

function formatTimeSpent() {
  // 格式化已用时长为保留1位小数
  if (formData.value.timeSpent !== null && formData.value.timeSpent !== undefined) {
    formData.value.timeSpent = Math.round(formData.value.timeSpent * 10) / 10
  }
}

// formatDuration 已从 helpers.js 导入

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

async function deleteRecord(recordId) {
  if (!props.song) return
  if (confirm('确定要删除这条计时记录吗？')) {
    await songsStore.deleteTimerRecord(props.song.id, recordId)
    // 更新表单中的已用时长
    const updatedSong = songsStore.getSongById(props.song.id)
    if (updatedSong) {
      formData.value.timeSpent = updatedSong.timeSpent || 0
    }
  }
}

function handleSave() {
  // 保存前确保已用时长格式正确
  formatTimeSpent()
  emit('save', formData.value)
}
</script>

