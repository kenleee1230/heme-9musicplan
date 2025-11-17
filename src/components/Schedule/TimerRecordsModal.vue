<template>
  <div v-if="show" class="modal" style="display: flex" @click.self="$emit('close')">
    <div class="modal-content timer-records-modal" @click.stop>
      <span class="close" @click="$emit('close')">&times;</span>
      <h2>计时记录 - {{ currentSong?.name || '未知歌曲' }}</h2>
      
      <div v-if="!timerRecords || timerRecords.length === 0" class="empty-records">
        <p>暂无计时记录</p>
        <small>开始计时后，记录会显示在这里</small>
      </div>
      
      <div v-else class="timer-records-list">
        <div v-for="record in sortedRecords" :key="record.id" class="timer-record-item">
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
      
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSongsStore } from '@/stores/songs'
import { formatDuration } from '@/utils/helpers'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  song: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const songsStore = useSongsStore()

// 获取最新的歌曲数据（响应式）
const currentSong = computed(() => {
  if (!props.song) return null
  // 从 store 中获取最新数据，确保数据是最新的
  return songsStore.getSongById(props.song.id) || props.song
})

// 获取计时记录
const timerRecords = computed(() => {
  if (!currentSong.value || !currentSong.value.timerRecords) return []
  return currentSong.value.timerRecords
})

// 按时间倒序排列的计时记录
const sortedRecords = computed(() => {
  return [...timerRecords.value].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.startTime || 0).getTime()
    const timeB = new Date(b.createdAt || b.startTime || 0).getTime()
    return timeB - timeA // 最新的在前
  })
})

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
  if (!currentSong.value) return
  if (confirm('确定要删除这条计时记录吗？')) {
    await songsStore.deleteTimerRecord(currentSong.value.id, recordId)
    // 删除后会自动更新，因为 currentSong 是响应式的
  }
}
</script>

<style scoped>
.timer-records-modal {
  max-width: 600px;
  max-height: 80vh;
}

.empty-records {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-records p {
  font-size: 1.1em;
  margin-bottom: 10px;
}

.empty-records small {
  color: #ccc;
}
</style>

