<template>
  <div v-if="showUpdatePrompt" class="update-prompt-overlay" @click.self="dismiss">
    <div class="update-prompt-modal">
      <div class="update-prompt-header">
        <h3>🔄 发现新版本</h3>
      </div>
      <div class="update-prompt-content">
        <p>检测到应用有新版本可用，建议立即更新以获得最佳体验。</p>
        <div class="version-info">
          <span>当前版本: {{ oldVersion }}</span>
          <span>新版本: {{ newVersion }}</span>
        </div>
      </div>
      <div class="update-prompt-actions">
        <button class="btn btn-primary" @click="updateNow">
          立即更新
        </button>
        <button class="btn btn-secondary" @click="dismiss">
          稍后提醒
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { forceUpdate, APP_VERSION, getStoredVersion } from '@/utils/version'

const showUpdatePrompt = ref(false)
const oldVersion = ref('')
const newVersion = ref(APP_VERSION)

function checkVersion() {
  const storedVersion = getStoredVersion()
  if (storedVersion && storedVersion !== APP_VERSION) {
    oldVersion.value = storedVersion
    newVersion.value = APP_VERSION
    showUpdatePrompt.value = true
  }
}

function handleUpdateAvailable() {
  checkVersion()
}

onMounted(() => {
  // 检查是否有新版本
  checkVersion()
  
  // 监听更新事件
  window.addEventListener('app-update-available', handleUpdateAvailable)
  
  // 监听 Service Worker 更新
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[UpdatePrompt] Service Worker 已更新')
      checkVersion()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('app-update-available', handleUpdateAvailable)
})

function updateNow() {
  forceUpdate()
}

function dismiss() {
  showUpdatePrompt.value = false
  // 延迟5分钟后再次提示
  setTimeout(() => {
    const storedVersion = getStoredVersion()
    if (storedVersion && storedVersion !== APP_VERSION) {
      showUpdatePrompt.value = true
    }
  }, 5 * 60 * 1000)
}
</script>

<style scoped>
.update-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.update-prompt-modal {
  background: var(--bg-primary, #1a1a1a);
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.update-prompt-header {
  margin-bottom: 16px;
}

.update-prompt-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary, #fff);
}

.update-prompt-content {
  margin-bottom: 24px;
}

.update-prompt-content p {
  margin: 0 0 16px 0;
  color: var(--text-secondary, #ccc);
  line-height: 1.6;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--bg-secondary, #2a2a2a);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary, #ccc);
}

.version-info span {
  display: flex;
  justify-content: space-between;
}

.update-prompt-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent-color, #4a9eff);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-color-hover, #3a8eef);
}

.btn-secondary {
  background: var(--bg-secondary, #2a2a2a);
  color: var(--text-primary, #fff);
}

.btn-secondary:hover {
  background: var(--bg-tertiary, #3a3a3a);
}
</style>
