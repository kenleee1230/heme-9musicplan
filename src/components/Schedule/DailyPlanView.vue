<template>
  <div class="daily-plan-view">
    <div v-if="songs.length === 0" class="empty-state">
      <p>还没有添加歌曲，点击上方按钮添加第一首歌吧！</p>
    </div>
    
    <div v-else-if="dailyPlan.length === 0" class="empty-state">
      <p>没有进行中的歌曲</p>
    </div>
    
    <template v-else>
      <div class="calendar-wrapper">
        <!-- 月份导航 -->
        <div class="calendar-month-nav">
          <button class="btn btn-small" @click="changeMonth(-1)">← 上个月</button>
          <h3>{{ currentYear }}年 {{ currentMonth + 1 }}月</h3>
          <button class="btn btn-small" @click="changeMonth(1)">下个月 →</button>
        </div>
        
        <!-- 桌面端：完整日历网格 -->
        <div class="calendar-grid desktop-calendar">
          <!-- 星期标题 -->
          <div 
            v-for="day in weekDays" 
            :key="day"
            class="calendar-weekday"
          >
            {{ day }}
          </div>
          
          <!-- 空白填充 -->
          <div 
            v-for="i in firstDayOfWeek" 
            :key="`empty-${i}`"
            class="calendar-day empty"
          ></div>
          
          <!-- 日期单元格 -->
          <div 
            v-for="day in daysInMonth" 
            :key="day"
            :class="[
              'calendar-day',
              {
                today: isToday(day),
                past: isPast(day)
              }
            ]"
          >
            <div class="calendar-day-number">{{ day }}</div>
            <!-- 计划任务 -->
            <div class="calendar-day-tasks">
              <div 
                v-for="task in getDayTasks(day)" 
                :key="`task-${task.songId}-${task.taskIndex}`"
                class="calendar-task making-task"
              >
                <div class="task-song">{{ task.songName }}</div>
                <div class="task-name">{{ task.taskName }}</div>
                <div class="task-hours">{{ task.allocatedHours.toFixed(1) }}h</div>
              </div>
            </div>
            <!-- 计时记录 -->
            <div v-if="getDayTimerRecords(day).length > 0" class="calendar-day-records">
              <div 
                v-if="!collapsedTimerRecords.has(getDayKey(day))"
                v-for="record in getDayTimerRecords(day)" 
                :key="`record-${record.id}`"
                class="calendar-task timer-record"
              >
                <div class="task-song">⏱️ {{ record.songName }}</div>
                <div class="task-hours">{{ formatDuration(record.duration) }}</div>
              </div>
              <button 
                v-if="getDayTimerRecords(day).length > 0"
                class="btn-toggle-records"
                @click.stop="toggleTimerRecords(day)"
                :title="collapsedTimerRecords.has(getDayKey(day)) ? '展开记录' : '收起记录'"
              >
                {{ collapsedTimerRecords.has(getDayKey(day)) ? '▼' : '▲' }}
              </button>
            </div>
            <div v-if="getDayTotalHours(day) > 0 || getDayTimerRecords(day).length > 0" class="calendar-day-total">
              计划: {{ getDayTotalHours(day).toFixed(1) }}h
              <span v-if="getDayTimerRecords(day).length > 0">
                | 实际: {{ getDayActualHours(day).toFixed(1) }}h
              </span>
            </div>
          </div>
        </div>
        
        <!-- 移动端：紧凑日历 + 详细日程 -->
        <div class="mobile-calendar-view">
          <!-- 紧凑日历 -->
          <div class="mobile-calendar-grid">
            <!-- 星期标题 -->
            <div 
              v-for="day in weekDays" 
              :key="day"
              class="mobile-weekday"
            >
              {{ day }}
            </div>
            
            <!-- 空白填充 -->
            <div 
              v-for="i in firstDayOfWeek" 
              :key="`empty-${i}`"
              class="mobile-day empty"
            ></div>
            
            <!-- 日期单元格 -->
              <div 
                v-for="day in daysInMonth" 
                :key="day"
                :class="[
                'mobile-day',
                {
                  today: isToday(day),
                  past: isPast(day),
                  selected: isSelected(day),
                  hasTasks: getDayTasks(day).length > 0 || getDayTimerRecords(day).length > 0
                }
              ]"
              @click="selectDay(day)"
            >
              <div class="mobile-day-number">{{ day }}</div>
              <div v-if="getDayTasks(day).length > 0 || getDayTimerRecords(day).length > 0" class="mobile-day-dot"></div>
            </div>
          </div>
          
          <!-- 选中日期的详细日程 -->
          <div v-if="selectedDay" class="mobile-day-details">
            <div class="mobile-day-header">
              <h3>{{ selectedDayDateText }}</h3>
              <div class="mobile-day-total">
                <span v-if="getDayTotalHours(selectedDay) > 0">
                  计划: {{ getDayTotalHours(selectedDay).toFixed(1) }}h
                </span>
                <span v-if="getDayTimerRecords(selectedDay).length > 0">
                  <span v-if="getDayTotalHours(selectedDay) > 0"> | </span>
                  实际: {{ getDayActualHours(selectedDay).toFixed(1) }}h
                </span>
              </div>
            </div>
            <!-- 计划任务 -->
            <div v-if="selectedDayTasks.length > 0" class="mobile-section">
              <div class="mobile-section-title">📋 计划任务</div>
              <div class="mobile-tasks-list">
                <div 
                  v-for="task in selectedDayTasks" 
                  :key="`task-${task.songId}-${task.taskIndex}`"
                  class="mobile-task-card"
                >
                  <div class="mobile-task-header">
                    <div class="mobile-task-song">{{ task.songName }}</div>
                    <div class="mobile-task-hours">{{ task.allocatedHours.toFixed(1) }}h</div>
                  </div>
                  <div class="mobile-task-name">{{ task.taskName }}</div>
                </div>
              </div>
            </div>
            
            <!-- 计时记录 -->
            <div v-if="selectedDayTimerRecords.length > 0" class="mobile-section">
              <div class="mobile-section-title">⏱️ 计时记录</div>
              <div class="mobile-tasks-list">
                <div 
                  v-for="record in selectedDayTimerRecords" 
                  :key="`record-${record.id}`"
                  class="mobile-task-card timer-record-card"
                >
                  <div class="mobile-task-header">
                    <div class="mobile-task-song">{{ record.songName }}</div>
                    <div class="mobile-task-hours">{{ formatDuration(record.duration) }}</div>
                  </div>
                  <div v-if="record.details" class="mobile-task-name">{{ record.details }}</div>
                  <div class="mobile-task-time">{{ formatRecordTime(record.createdAt) }}</div>
                </div>
              </div>
            </div>
            
            <div v-if="selectedDayTasks.length === 0 && selectedDayTimerRecords.length === 0" class="mobile-no-tasks">
              这一天没有安排任务和计时记录
            </div>
          </div>
          <div v-else class="mobile-day-details">
            <div class="mobile-no-selection">
              点击上方日期查看详细日程
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSongsStore } from '@/stores/songs'
import { useSettingsStore } from '@/stores/settings'
import { generateDailyPlan } from '@/utils/calculations'
import { formatDuration } from '@/utils/helpers'

const songsStore = useSongsStore()
const settingsStore = useSettingsStore()

const { songs } = storeToRefs(songsStore)
const { startDate, dailyLearningHours, dailyMakingHours } = storeToRefs(settingsStore)

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const today = new Date()
const selectedDay = ref(today.getDate())
const collapsedTimerRecords = ref(new Set()) // 存储已收起的日期

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const dailyPlan = computed(() => {
  if (!startDate.value) return []
  return generateDailyPlan(songs.value, startDate.value, dailyLearningHours.value, dailyMakingHours.value)
})

const firstDay = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1)
})

const lastDay = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0)
})

const firstDayOfWeek = computed(() => {
  return firstDay.value.getDay()
})

const daysInMonth = computed(() => {
  return lastDay.value.getDate()
})

function changeMonth(delta) {
  currentMonth.value += delta
  if (currentMonth.value < 0) {
    currentMonth.value = 11
    currentYear.value--
  } else if (currentMonth.value > 11) {
    currentMonth.value = 0
    currentYear.value++
  }
  // 切换月份后，如果选中的日期在新月份不存在，则选择今天（如果今天在当前月份）或1号
  const daysInNewMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const todayDate = new Date()
  const isCurrentMonth = todayDate.getMonth() === currentMonth.value && todayDate.getFullYear() === currentYear.value
  
  if (selectedDay.value > daysInNewMonth) {
    selectedDay.value = isCurrentMonth ? todayDate.getDate() : 1
  } else if (isCurrentMonth && selectedDay.value !== todayDate.getDate()) {
    // 如果切换到当前月份，自动选中今天
    selectedDay.value = todayDate.getDate()
  }
}

function isToday(day) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(currentYear.value, currentMonth.value, day)
  date.setHours(0, 0, 0, 0)
  return date.getTime() === today.getTime()
}

function isPast(day) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(currentYear.value, currentMonth.value, day)
  date.setHours(0, 0, 0, 0)
  return date < today
}

function getDayTasks(day) {
  const date = new Date(currentYear.value, currentMonth.value, day)
  date.setHours(0, 0, 0, 0)
  
  const dayPlan = dailyPlan.value.find(dp => {
    const dpDate = new Date(dp.date)
    dpDate.setHours(0, 0, 0, 0)
    return dpDate.getTime() === date.getTime()
  })
  
  return dayPlan ? dayPlan.tasks : []
}

function getDayTotalHours(day) {
  const tasks = getDayTasks(day)
  return tasks.reduce((sum, task) => sum + task.allocatedHours, 0)
}

function selectDay(day) {
  selectedDay.value = day
}

function isSelected(day) {
  return selectedDay.value === day
}

const selectedDayTasks = computed(() => {
  if (!selectedDay.value) return []
  return getDayTasks(selectedDay.value)
})

const selectedDayDateText = computed(() => {
  if (!selectedDay.value) return ''
  const date = new Date(currentYear.value, currentMonth.value, selectedDay.value)
  const weekDay = weekDays[date.getDay()]
  return `${currentYear.value}年${currentMonth.value + 1}月${selectedDay.value}日 星期${weekDay}`
})

// 获取所有计时记录（按日期分组）
const allTimerRecords = computed(() => {
  const recordsByDate = new Map()
  
  songs.value.forEach(song => {
    if (song.timerRecords && song.timerRecords.length > 0) {
      song.timerRecords.forEach(record => {
        const recordDate = new Date(record.createdAt || record.startTime)
        recordDate.setHours(0, 0, 0, 0)
        const dateKey = recordDate.getTime()
        
        if (!recordsByDate.has(dateKey)) {
          recordsByDate.set(dateKey, [])
        }
        
        recordsByDate.get(dateKey).push({
          ...record,
          songName: song.name,
          songId: song.id
        })
      })
    }
  })
  
  return recordsByDate
})

// 初始化：默认收起所有有计时记录的日期
function initializeCollapsedRecords() {
  const newCollapsed = new Set()
  
  // 遍历当前月份的所有日期
  const daysInCurrentMonth = daysInMonth.value
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const records = getDayTimerRecords(day)
    if (records.length > 0) {
      const key = getDayKey(day)
      newCollapsed.add(key)
    }
  }
  
  collapsedTimerRecords.value = newCollapsed
}

// 监听月份变化和计时记录变化，重新初始化收起状态
watch([currentMonth, currentYear, allTimerRecords], () => {
  initializeCollapsedRecords()
}, { immediate: false })

// 组件挂载时初始化
onMounted(() => {
  initializeCollapsedRecords()
})

// 获取某一天的计时记录
function getDayTimerRecords(day) {
  if (!day) return []
  const date = new Date(currentYear.value, currentMonth.value, day)
  date.setHours(0, 0, 0, 0)
  const dateKey = date.getTime()
  return allTimerRecords.value.get(dateKey) || []
}

// 获取某一天的实际计时总时长
function getDayActualHours(day) {
  const records = getDayTimerRecords(day)
  return records.reduce((sum, record) => sum + (record.duration || 0), 0)
}

// 选中日期的计时记录
const selectedDayTimerRecords = computed(() => {
  if (!selectedDay.value) return []
  return getDayTimerRecords(selectedDay.value)
})

// formatDuration 已从 helpers.js 导入

function getDayKey(day) {
  return `${currentYear.value}-${currentMonth.value}-${day}`
}

function toggleTimerRecords(day) {
  const key = getDayKey(day)
  if (collapsedTimerRecords.value.has(key)) {
    collapsedTimerRecords.value.delete(key)
  } else {
    collapsedTimerRecords.value.add(key)
  }
}

function formatRecordTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.daily-plan-view {
  width: 100%;
  overflow-x: hidden;
}

.calendar-wrapper {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  width: 100%;
  box-sizing: border-box;
}

.calendar-month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.calendar-month-nav h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 1.2em;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

/* 移动端日历视图 */
.mobile-calendar-view {
  display: none;
}

.calendar-weekday {
  text-align: center;
  font-weight: 600;
  color: #666;
  padding: 10px;
  font-size: 0.9em;
}

.calendar-day {
  min-height: 120px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.calendar-day.empty {
  border: none;
  background: transparent;
}

.calendar-day.today {
  background: #fff3cd;
  border-color: #1a1a1a;
  border-width: 2px;
}

.calendar-day.past {
  opacity: 0.6;
}

.calendar-day-number {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 6px;
  font-size: 0.9em;
}

.calendar-day-tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.calendar-task {
  background: white;
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 0.75em;
  border-left: 3px solid #1a1a1a;
}

.calendar-task.making-task {
  border-left-color: #1a1a1a;
}

.calendar-day-records {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.btn-toggle-records {
  align-self: flex-start;
  padding: 2px 6px;
  font-size: 0.75em;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  margin-top: 2px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-toggle-records:hover {
  opacity: 1;
  color: #666;
}

.calendar-task.timer-record {
  border-left-color: #1DB954;
  background: #f0fdf4;
  opacity: 0.95;
}

.task-song {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.task-name {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 2px;
  line-height: 1.2;
}

.task-hours {
  color: #999;
  font-size: 0.85em;
}

.calendar-day-total {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #e0e0e0;
  font-size: 0.75em;
  color: #666;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px;
}

/* 移动端适配 - 适配主流机型 */
/* 小屏手机 (320px - 480px) */
@media (max-width: 480px) {
  .calendar-wrapper {
    padding: 8px;
  }
  
  .mobile-calendar-grid {
    gap: 1px;
  }
  
  .mobile-weekday {
    padding: 4px 1px;
    font-size: 0.65em;
  }
  
  .mobile-day {
    padding: 1px;
  }
  
  .mobile-day-number {
    font-size: 0.7em;
  }
  
  .mobile-day-dot {
    width: 2px;
    height: 2px;
  }
}

/* 中等屏幕手机和平板 (481px - 768px) */
@media (min-width: 481px) and (max-width: 768px) {
  .mobile-calendar-grid {
    gap: 3px;
  }
  
  .mobile-weekday {
    padding: 8px 2px;
    font-size: 0.75em;
  }
  
  .mobile-day {
    padding: 4px 2px;
  }
  
  .mobile-day-number {
    font-size: 0.8em;
  }
}

/* 通用移动端样式 */
@media (max-width: 768px) {
  /* 隐藏桌面端日历 */
  .desktop-calendar {
    display: none !important;
  }
  
  /* 显示移动端日历 */
  .mobile-calendar-view {
    display: block !important;
  }
  
  .daily-plan-view {
    width: 100%;
    overflow-x: hidden;
    max-width: 100vw;
  }
  
  .calendar-wrapper {
    padding: 10px;
    width: 100%;
    box-sizing: border-box;
    max-width: 100%;
    overflow-x: hidden;
  }
  
  .calendar-month-nav {
    flex-direction: column;
    gap: 8px;
    padding-bottom: 12px;
    margin-bottom: 12px;
  }
  
  .calendar-month-nav h3 {
    font-size: 1em;
    text-align: center;
    margin: 0;
  }
  
  .calendar-month-nav .btn {
    font-size: 0.85em;
    padding: 8px 12px;
    min-height: 44px;
  }
  
  /* 移动端紧凑日历 - 适配主流机型 */
  .mobile-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 20px;
    width: 100%;
    box-sizing: border-box;
    padding: 0;
  }
  
  .mobile-weekday {
    text-align: center;
    font-weight: 600;
    color: #666;
    padding: 6px 1px;
    font-size: 0.7em;
    background: #f8f9fa;
    border-radius: 3px;
    min-width: 0;
    overflow: hidden;
  }
  
  .mobile-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  
  .mobile-day.empty {
    border: none;
    background: transparent;
    cursor: default;
  }
  
  .mobile-day.today {
    background: #fff3cd;
    border-color: #1a1a1a;
    border-width: 2px;
  }
  
  .mobile-day.past {
    opacity: 0.5;
  }
  
  .mobile-day.hasTasks .mobile-day-number {
    font-weight: 700;
  }
  
  .mobile-day.selected {
    background: #1a1a1a;
    color: white;
    border-color: #1a1a1a;
  }
  
  .mobile-day.selected .mobile-day-number {
    color: white;
  }
  
  .mobile-day-number {
    font-size: 0.75em;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 1px;
    line-height: 1;
    text-align: center;
  }
  
  .mobile-day-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #1a1a1a;
    margin-top: 1px;
    flex-shrink: 0;
  }
  
  .mobile-day.selected .mobile-day-dot {
    background: white;
  }
  
  /* 移动端详细日程 */
  .mobile-day-details {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
  }
  
  .mobile-day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e0e0e0;
  }
  
  .mobile-day-header h3 {
    margin: 0;
    font-size: 1.2em;
    color: #1a1a1a;
    font-weight: 600;
  }
  
  .mobile-day-total {
    font-size: 0.9em;
    color: #666;
    font-weight: 600;
  }
  
  .mobile-no-tasks,
  .mobile-no-selection {
    text-align: center;
    color: #999;
    padding: 40px 20px;
    font-size: 0.95em;
  }
  
  .mobile-tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .mobile-task-card {
    background: white;
    border-radius: 8px;
    padding: 15px;
    border-left: 4px solid #1a1a1a;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .mobile-task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .mobile-task-song {
    font-size: 1em;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .mobile-task-hours {
    font-size: 0.9em;
    color: #667eea;
    font-weight: 600;
    background: #e8eaf6;
    padding: 4px 10px;
    border-radius: 12px;
  }
  
  .mobile-task-name {
    font-size: 0.9em;
    color: #666;
    line-height: 1.5;
  }
  
  .mobile-section {
    margin-bottom: 20px;
  }
  
  .mobile-section-title {
    font-size: 1em;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e0e0e0;
  }
  
  .timer-record-card {
    border-left-color: #1DB954;
    background: #f0fdf4;
  }
  
  .mobile-task-time {
    font-size: 0.85em;
    color: #999;
    margin-top: 6px;
  }
}
</style>


