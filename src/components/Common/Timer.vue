<template>
  <div v-if="timer.isRunning" class="timer-floating">
    <div class="timer-header">
      <span>{{ timer.songName }}</span>
      <button class="timer-close" @click="stop">&times;</button>
    </div>
    <div class="timer-display">
      <div class="timer-time">{{ timerDisplay }}</div>
      <div class="timer-controls">
        <button v-if="!timer.isPaused" class="btn btn-small" @click="pause">暂停</button>
        <button v-else class="btn btn-small" @click="resume">继续</button>
        <button class="btn btn-small btn-delete" @click="stop">停止</button>
      </div>
    </div>
  </div>

  <!-- 计时明细输入对话框 -->
  <div v-if="showDetailsDialog" class="modal timer-details-dialog" @click.self="cancelRecord">
    <div class="modal-content timer-details-modal" @click.stop>
      <span class="close" @click="cancelRecord">&times;</span>
      <h2>本次总结</h2>
      <div class="timer-details-info">
        <div class="detail-item">
          <span class="detail-label">歌曲：</span>
          <span class="detail-value">{{ pendingRecord?.songName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">时长：</span>
          <span class="detail-value">{{ formatDuration(pendingRecord?.hours) }}</span>
        </div>
      </div>
      <div class="form-group">
        <label>本次计时做了什么？（可选）</label>
        <textarea 
          v-model="timerDetails" 
          rows="4" 
          placeholder="例如：完成了编曲的鼓组部分，学习了侧链压缩技巧..."
          class="timer-details-input"
        ></textarea>
        <small>可以记录本次计时做了什么、学了什么知识点等</small>
      </div>
      <div v-if="syncStatus" class="sync-status" :class="`sync-${syncStatus}`">
        <span v-if="syncStatus === 'saving'">正在保存...</span>
        <span v-else-if="syncStatus === 'success'">✓ 已保存到本地</span>
        <span v-else-if="syncStatus === 'syncing'">正在同步到云端...</span>
        <span v-else-if="syncStatus === 'synced'">✓ 已同步到云端</span>
        <span v-else-if="syncStatus === 'error'">⚠ 已保存到本地，云端同步失败（稍后自动重试）</span>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-primary" @click="saveRecord" :disabled="syncStatus === 'saving' || syncStatus === 'syncing'">
          {{ syncStatus === 'saving' || syncStatus === 'syncing' ? '保存中...' : '保存' }}
        </button>
        <button type="button" class="btn btn-secondary" @click="cancelRecord" :disabled="syncStatus === 'saving' || syncStatus === 'syncing'">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTimer } from '@/composables/useTimer'
import { useSongsStore } from '@/stores/songs'
import { useAuthStore } from '@/stores/auth'
import { useFirestore } from '@/composables/useFirestore'
import { formatDuration } from '@/utils/helpers'

const { timer, timerDisplay, pauseTimer, resumeTimer, stopTimer } = useTimer()
const songsStore = useSongsStore()
const authStore = useAuthStore()

const showDetailsDialog = ref(false)
const pendingRecord = ref(null)
const timerDetails = ref('')
const syncStatus = ref(null) // 'saving', 'success', 'syncing', 'synced', 'error'

function pause() {
  pauseTimer()
}

function resume() {
  resumeTimer()
}

// formatDuration 已从 helpers.js 导入

function stop() {
  if (confirm('确定要停止计时吗？')) {
    const result = stopTimer()
    console.log('停止计时结果:', result) // 调试信息
    
    if (!result || !result.songId) {
      console.warn('无法显示明细对话框，缺少必要信息:', result)
      return
    }

    // 检查时长是否为0或负数
    if (!result.hours || result.hours <= 0) {
      alert('本次计时时长为0，无法保存记录。\n\n请确保计时器运行了至少几秒钟。')
      console.warn('时长为0，不保存记录:', result)
      return
    }

    // 检查时长限制
    const isDev = import.meta.env.DEV // 开发环境
    const minDurationHours = isDev ? 0.0028 : 0.017 // 开发环境：10秒，生产环境：1分钟
    const minDurationText = isDev ? '10秒' : '1分钟' // 用于显示提示

    if (result.hours < minDurationHours) {
      const durationText = formatDuration(result.hours)
      const shouldRecord = confirm(
        `本次计时时长仅为 ${durationText}，少于 ${minDurationText}。\n\n` +
        `是否仍要记录本次计时？\n\n` +
        `（点击"确定"记录，点击"取消"放弃）`
      )
      
      if (!shouldRecord) {
        console.log('用户选择不记录短时计时')
        return
      }
    }

    // 保存计时信息，准备显示对话框
    pendingRecord.value = result
    timerDetails.value = ''
    syncStatus.value = null
    showDetailsDialog.value = true
    console.log('显示明细对话框') // 调试信息
  }
}

async function saveRecord() {
  if (!pendingRecord.value) {
    console.error('没有待保存的记录')
    return
  }

  syncStatus.value = 'saving'

  try {
    // 先保存到本地（离线优先）
    const record = await songsStore.addTimerRecord(pendingRecord.value.songId, {
      startTime: pendingRecord.value.startTime,
      endTime: pendingRecord.value.endTime,
      duration: pendingRecord.value.hours,
      details: timerDetails.value.trim()
    })

    if (!record) {
      throw new Error('保存记录失败：返回值为空')
    }

    // 本地保存成功
    // addTimerRecord 内部已经处理了云端同步，这里不需要重复同步
    if (authStore.isAuthenticated) {
      syncStatus.value = 'syncing'
      // 给一点时间让 addTimerRecord 内部的同步完成
      setTimeout(() => {
        syncStatus.value = 'synced'
      }, 500)
    } else {
      syncStatus.value = 'success'
    }

    // 延迟关闭对话框，让用户看到状态
    setTimeout(() => {
      showDetailsDialog.value = false
      pendingRecord.value = null
      timerDetails.value = ''
      syncStatus.value = null
    }, syncStatus.value === 'error' ? 3000 : 1500)
  } catch (error) {
    console.error('保存计时记录失败:', error)
    console.error('错误详情:', {
      songId: pendingRecord.value?.songId,
      record: pendingRecord.value,
      hours: pendingRecord.value?.hours,
      error: error.message || error,
      errorName: error.name,
      errorStack: error.stack
    })
    syncStatus.value = 'error'
    
    // 提供更友好的错误提示
    let errorMessage = error.message || '未知错误'
    if (error.message.includes('无效的计时时长')) {
      errorMessage = '计时时长为0或无效，无法保存。请重新开始计时。'
    } else if (error.message.includes('歌曲不存在')) {
      errorMessage = '歌曲不存在，可能已被删除。请刷新页面后重试。'
    } else if (error.message.includes('存储空间')) {
      errorMessage = error.message
    } else if (error.message.includes('序列化')) {
      errorMessage = '数据格式错误，请刷新页面后重试。'
    }
    
    alert(`保存失败：${errorMessage}\n\n请查看浏览器控制台获取详细信息。`)
    // 不自动关闭对话框，让用户重试
  }
}

function cancelRecord() {
  // 取消时不保存记录，直接丢弃
  // 修复：之前这里也会调用 addTimerRecord，导致可能重复保存
  showDetailsDialog.value = false
  pendingRecord.value = null
  timerDetails.value = ''
  console.log('[Timer] 用户取消了计时记录')
}
</script>

