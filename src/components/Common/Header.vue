<template>
  <header>
    <h1>let'sgetpattern</h1>
    <p class="header-tagline">
      To HEMe Records 未来制作人：<br/>
      我们制作的是有其命运轨迹的东西，我们无法保证它「好运」，但我们可以保证它「是当下我能做到的最好」，且「品质越来越好」。它们的任何进步，源于我们自己的进步。
    </p>
    
    <div class="header-stats">
      <StatsCard label="剩余天数" :value="remainingDays" />
      <StatsCard label="已完成" :value="completedCount" :sublabel="`/ ${TARGET_SONGS} 首`" />
      <StatsCard label="进行中" :value="inProgressCount" />
      <StatsCard label="总进度" :value="`${totalProgress}%`" />
    </div>
    
    <div class="header-actions">
      <button class="btn btn-secondary" @click="openStartDateModal">📅 设置开始日期</button>
      <UserMenu @showLogin="$emit('showLogin')" />
      <div class="data-management">
        <button class="btn-link" @click="exportData" title="导出备份">💾</button>
        <button class="btn-link" @click="importData" title="导入备份">📥</button>
      </div>
    </div>
    
    <!-- 设置开始日期模态框 -->
    <div v-if="showStartDateModal" class="modal" style="display: flex">
      <div class="modal-content">
        <span class="close" @click="showStartDateModal = false">&times;</span>
        <h2>设置开始日期</h2>
        <form @submit.prevent="saveStartDate">
          <div class="form-group">
            <label>项目开始日期：</label>
            <input v-model="startDateInput" type="date" required />
          </div>
          <div class="form-group">
            <label>每日学习时长（小时）</label>
            <input v-model.number="learningHoursInput" type="number" min="0" max="2" step="0.5" />
            <small>用于听歌分析/学习技巧的时间（0-2小时）</small>
          </div>
          <div class="form-group">
            <label>每日制作时长（小时）</label>
            <input v-model.number="makingHoursInput" type="number" min="0" max="6" step="0.5" />
            <small>用于制作歌曲的时间（最大6小时）</small>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" class="btn btn-secondary" @click="showStartDateModal = false">取消</button>
          </div>
        </form>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSongsStore } from '@/stores/songs'
import { useSettingsStore } from '@/stores/settings'
import { TARGET_SONGS } from '@/utils/constants'
import StatsCard from './StatsCard.vue'
import UserMenu from '../Auth/UserMenu.vue'

const emit = defineEmits(['showLogin'])

const songsStore = useSongsStore()
const settingsStore = useSettingsStore()

const { completedCount, inProgressCount, totalProgress } = storeToRefs(songsStore)
const { remainingDays, dailyLearningHours, dailyMakingHours, startDate } = storeToRefs(settingsStore)

const showStartDateModal = ref(false)
const startDateInput = ref('')
const learningHoursInput = ref(0.5)
const makingHoursInput = ref(2)

function openStartDateModal() {
  const date = startDate.value ? new Date(startDate.value) : new Date()
  startDateInput.value = date.toISOString().split('T')[0]
  learningHoursInput.value = dailyLearningHours.value
  makingHoursInput.value = dailyMakingHours.value
  showStartDateModal.value = true
}

function saveStartDate() {
  settingsStore.saveStartDate(startDateInput.value)
  settingsStore.updateTimeConfig(learningHoursInput.value, makingHoursInput.value)
  showStartDateModal.value = false
}

function exportData() {
  const data = songsStore.exportData()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `musicplan-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = songsStore.importData(event.target.result)
        if (result.success) {
          alert(`成功导入 ${result.count} 首歌曲`)
        } else {
          alert(`导入失败：${result.error}`)
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}
</script>

<style scoped>
.data-management {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid #e0e0e0;
}

.btn-link {
  background: none;
  border: none;
  padding: 4px 8px;
  font-size: 0.85em;
  color: #999;
  cursor: pointer;
  transition: color 0.2s ease;
  opacity: 0.6;
}

.btn-link:hover {
  color: #666;
  opacity: 0.8;
}

.btn-link:active {
  opacity: 1;
}

@media (max-width: 768px) {
  .data-management {
    margin-left: 5px;
    padding-left: 5px;
  }
  
  .btn-link {
    font-size: 0.75em;
    padding: 2px 6px;
  }
}
</style>

