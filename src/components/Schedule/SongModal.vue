<template>
  <div class="modal" style="display: flex">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ song ? '编辑歌曲' : '添加新歌' }}</h2>
        <span class="close" @click="$emit('close')">&times;</span>
      </div>
      
      <div class="modal-body">
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
              <div v-for="(task, index) in formData.customTasks" :key="index" class="task-hour-item">
                <label class="task-hour-label">{{ task }}</label>
                <input 
                  v-model.number="formData.taskHours[index]" 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  class="task-hour-input"
                  @input="handleTaskHourChange"
                />
              </div>
            </div>
            <small>可以手动调整每个任务的时长，系统会自动重新计算总时长。</small>
          </div>
          
          <div class="form-group">
            <label>已用时长（小时）</label>
            <input v-model.number="formData.timeSpent" type="number" min="0" step="0.1" @blur="formatTimeSpent" />
          </div>
          
          <div class="form-group">
            <label>开始制作时间</label>
            <input v-model="formData.startDate" type="date" />
            <small>设置这首歌的开始制作日期</small>
            <div v-if="!formData.startDate && inferredStartDate" class="inferred-date-hint">
              <small style="color: #666;">
                系统推断的开始日期：{{ formatInferredDate(inferredStartDate) }} 
                <span style="color: #999;">（基于{{ inferredDateSource }}）</span>
              </small>
            </div>
          </div>
          
          <div class="form-group">
            <label>当前阶段</label>
            <div class="current-stage-display">{{ formData.currentStage }}</div>
            <!--<small style="color: #666; font-size: 0.85em; display: block; margin-top: 5px;">
              根据已完成步骤的最后一项自动判断
            </small>-->
          </div>
          
          <div class="form-group">
            <label>
              步骤列表
              <button type="button" class="btn btn-small" @click="addTask">+ 添加步骤</button>
            </label>
            <div class="custom-tasks-list">
              <div v-for="(task, index) in formData.customTasks" :key="index" class="custom-task-item">
                <div class="custom-task-controls">
                  <button 
                    type="button" 
                    class="btn btn-tiny" 
                    @click="moveTaskUp(index)"
                    :disabled="index === 0"
                    title="上移"
                  >
                    ↑
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-tiny" 
                    @click="moveTaskDown(index)"
                    :disabled="index === formData.customTasks.length - 1"
                    title="下移"
                  >
                    ↓
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-tiny btn-delete" 
                    @click="removeTask(index)"
                    :disabled="formData.customTasks.length <= 1"
                    title="删除"
                  >
                    ×
                  </button>
                </div>
                <input 
                  v-model="formData.customTasks[index]" 
                  type="text" 
                  class="custom-task-input"
                  @blur="syncArrays"
                  placeholder="步骤名称"
                />
                <label class="task-checkbox-label">
                  <input v-model="formData.tasks[index]" type="checkbox" />
                  <span>已完成</span>
                </label>
              </div>
            </div>
            <small>可以添加、删除、编辑和调整步骤顺序。每个步骤对应一个任务进度复选框。</small>
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
        </form>
      </div>
      
      <div class="modal-footer">
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" @click="handleSave">保存</button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { TASKS } from '@/utils/constants'
import { calculateTaskHours, getStageFromLastCompletedTask, getSongStartDate } from '@/utils/calculations'
import { useSongsStore } from '@/stores/songs'
import { useSettingsStore } from '@/stores/settings'
import { formatDuration } from '@/utils/helpers'

const props = defineProps({
  song: Object
})

const emit = defineEmits(['close', 'save'])

const songsStore = useSongsStore()
const settingsStore = useSettingsStore()
const { startDate: projectStartDate } = storeToRefs(settingsStore)
const { songs } = storeToRefs(songsStore)
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

// 获取歌曲在列表中的索引
const songIndex = computed(() => {
  if (!props.song) return -1
  return songs.value.findIndex(s => s.id === props.song.id)
})

// 计算推断的开始日期和来源
const inferredStartDate = computed(() => {
  // 只在编辑模式下显示推断日期
  if (!props.song) return null
  
  // 如果表单中已经设置了 startDate，不显示推断日期
  if (formData.value.startDate) return null
  
  // 如果歌曲有手动设置的 startDate，不显示推断日期
  if (props.song.startDate) return null
  
  // 使用 getSongStartDate 函数推断
  const inferred = getSongStartDate(props.song, projectStartDate.value, songIndex.value)
  return inferred
})

// 推断日期的来源说明
const inferredDateSource = computed(() => {
  if (!props.song || !inferredStartDate.value) return ''
  
  // 优先级1：计时记录
  if (props.song.timerRecords && Array.isArray(props.song.timerRecords) && props.song.timerRecords.length > 0) {
    return '最早的计时记录'
  }
  
  // 优先级2：创建日期
  if (props.song.createdAt) {
    return '创建日期'
  }
  
  // 优先级3：默认计算
  return '默认计算'
})

// 格式化推断日期显示
function formatInferredDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formData = ref({
  name: '',
  genre: '',
  estimatedHours: 40,
  isNewGenre: false,
  currentStage: '曲风研究',
  customTasks: [...TASKS],
  tasks: new Array(TASKS.length).fill(false),
  taskHours: calculateTaskHours(40, false),
  timeSpent: 0,
  startDate: '',
  notes: ''
})

// 如果是编辑模式，填充表单
watch(() => props.song, (song) => {
  if (song) {
    // 获取 customTasks，如果没有则使用默认 TASKS
    const customTasks = Array.isArray(song.customTasks) && song.customTasks.length > 0
      ? [...song.customTasks]
      : [...TASKS]
    
    // 确保 tasks 和 taskHours 长度与 customTasks 一致
    let tasks = song.tasks || []
    if (tasks.length !== customTasks.length) {
      const newTasks = new Array(customTasks.length).fill(false)
      tasks.forEach((completed, index) => {
        if (index < newTasks.length) {
          newTasks[index] = completed
        }
      })
      tasks = newTasks
    }
    
    let taskHours = song.taskHours || calculateTaskHours(song.estimatedHours || 40, song.isNewGenre || false)
    if (taskHours.length !== customTasks.length) {
      const newTaskHours = new Array(customTasks.length).fill(0)
      taskHours.forEach((hours, index) => {
        if (index < newTaskHours.length) {
          newTaskHours[index] = hours
        }
      })
      // 如果新数组全为0，重新计算
      if (newTaskHours.every(h => h === 0)) {
        taskHours = calculateTaskHours(song.estimatedHours || 40, song.isNewGenre || false)
        if (taskHours.length !== customTasks.length) {
          const recalculated = new Array(customTasks.length).fill(0)
          taskHours.forEach((hours, index) => {
            if (index < recalculated.length) {
              recalculated[index] = hours
            }
          })
          taskHours = recalculated
        }
      } else {
        taskHours = newTaskHours
      }
    }
    
    // 根据 tasks 自动计算 currentStage
    const tempSong = {
      ...song,
      customTasks: customTasks,
      tasks: tasks
    }
    const calculatedStage = getStageFromLastCompletedTask(tempSong)
    
    // 处理开始制作时间：如果有 startDate，转换为 YYYY-MM-DD 格式
    let startDateValue = ''
    if (song.startDate) {
      const date = new Date(song.startDate)
      if (!isNaN(date.getTime())) {
        startDateValue = date.toISOString().split('T')[0]
      }
    }
    
    formData.value = {
      name: song.name,
      genre: song.genre || '',
      estimatedHours: song.estimatedHours || 40,
      isNewGenre: song.isNewGenre || false,
      currentStage: calculatedStage,
      customTasks: customTasks,
      tasks: tasks,
      taskHours: taskHours,
      timeSpent: song.timeSpent || 0,
      startDate: startDateValue,
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
      customTasks: [...TASKS],
      tasks: new Array(TASKS.length).fill(false),
      taskHours: calculateTaskHours(40, false),
      timeSpent: 0,
      startDate: '',
      notes: ''
    }
    showTaskHours.value = false
  }
}, { immediate: true })

// 监听 tasks 变化，自动更新 currentStage
watch(() => formData.value.tasks, () => {
  const tempSong = {
    customTasks: formData.value.customTasks,
    tasks: formData.value.tasks
  }
  formData.value.currentStage = getStageFromLastCompletedTask(tempSong)
}, { deep: true })

// 监听 customTasks 变化，也更新 currentStage（因为步骤名称可能改变）
watch(() => formData.value.customTasks, () => {
  const tempSong = {
    customTasks: formData.value.customTasks,
    tasks: formData.value.tasks
  }
  formData.value.currentStage = getStageFromLastCompletedTask(tempSong)
}, { deep: true })

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
  const calculatedHours = calculateTaskHours(
    formData.value.estimatedHours,
    formData.value.isNewGenre
  )
  
  // 如果计算出的长度与 customTasks 长度不匹配，需要调整
  if (calculatedHours.length !== formData.value.customTasks.length) {
    // 按比例分配或填充
    const newTaskHours = new Array(formData.value.customTasks.length).fill(0)
    const totalCalculated = calculatedHours.reduce((sum, h) => sum + h, 0)
    if (totalCalculated > 0) {
      // 按比例分配
      calculatedHours.forEach((hours, index) => {
        if (index < newTaskHours.length) {
          newTaskHours[index] = Math.round(hours * 10) / 10 // 保留1位小数
        }
      })
      // 如果还有剩余长度，平均分配剩余时长
      const remainingLength = formData.value.customTasks.length - calculatedHours.length
      if (remainingLength > 0) {
        const avgHours = totalCalculated / formData.value.customTasks.length
        for (let i = calculatedHours.length; i < newTaskHours.length; i++) {
          newTaskHours[i] = Math.round(avgHours * 10) / 10 // 保留1位小数
        }
      }
    }
    formData.value.taskHours = newTaskHours
  } else {
    formData.value.taskHours = calculatedHours
  }
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

// 添加新步骤
function addTask() {
  formData.value.customTasks.push('新步骤')
  formData.value.tasks.push(false)
  formData.value.taskHours.push(0)
  syncArrays()
}

// 删除步骤
function removeTask(index) {
  if (formData.value.customTasks.length <= 1) {
    alert('至少需要保留一个步骤')
    return
  }
  if (confirm('确定要删除这个步骤吗？')) {
    formData.value.customTasks.splice(index, 1)
    formData.value.tasks.splice(index, 1)
    formData.value.taskHours.splice(index, 1)
    syncArrays()
  }
}

// 上移步骤
function moveTaskUp(index) {
  if (index > 0) {
    // 交换 customTasks
    const tempTask = formData.value.customTasks[index]
    formData.value.customTasks[index] = formData.value.customTasks[index - 1]
    formData.value.customTasks[index - 1] = tempTask
    
    // 交换 tasks
    const tempTaskStatus = formData.value.tasks[index]
    formData.value.tasks[index] = formData.value.tasks[index - 1]
    formData.value.tasks[index - 1] = tempTaskStatus
    
    // 交换 taskHours
    const tempHours = formData.value.taskHours[index]
    formData.value.taskHours[index] = formData.value.taskHours[index - 1]
    formData.value.taskHours[index - 1] = tempHours
  }
}

// 下移步骤
function moveTaskDown(index) {
  if (index < formData.value.customTasks.length - 1) {
    // 交换 customTasks
    const tempTask = formData.value.customTasks[index]
    formData.value.customTasks[index] = formData.value.customTasks[index + 1]
    formData.value.customTasks[index + 1] = tempTask
    
    // 交换 tasks
    const tempTaskStatus = formData.value.tasks[index]
    formData.value.tasks[index] = formData.value.tasks[index + 1]
    formData.value.tasks[index + 1] = tempTaskStatus
    
    // 交换 taskHours
    const tempHours = formData.value.taskHours[index]
    formData.value.taskHours[index] = formData.value.taskHours[index + 1]
    formData.value.taskHours[index + 1] = tempHours
  }
}

// 同步数组长度（确保 tasks 和 taskHours 与 customTasks 长度一致）
function syncArrays() {
  const targetLength = formData.value.customTasks.length
  
  // 同步 tasks 数组
  while (formData.value.tasks.length < targetLength) {
    formData.value.tasks.push(false)
  }
  while (formData.value.tasks.length > targetLength) {
    formData.value.tasks.pop()
  }
  
  // 同步 taskHours 数组
  while (formData.value.taskHours.length < targetLength) {
    formData.value.taskHours.push(0)
  }
  while (formData.value.taskHours.length > targetLength) {
    formData.value.taskHours.pop()
  }
  
  // 同步后更新 currentStage
  const tempSong = {
    customTasks: formData.value.customTasks,
    tasks: formData.value.tasks
  }
  formData.value.currentStage = getStageFromLastCompletedTask(tempSong)
}

function handleSave() {
  // 保存前确保已用时长格式正确
  formatTimeSpent()
  // 确保数组同步
  syncArrays()
  emit('save', formData.value)
}
</script>

