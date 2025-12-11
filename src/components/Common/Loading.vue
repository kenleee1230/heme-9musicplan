<template>
  <Transition name="fade">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">
          <p class="loading-message">{{ message || '加载中...' }}</p>
          <p v-if="progress.total > 0" class="loading-progress">
            {{ progress.current }} / {{ progress.total }}
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useCloudSyncStore } from '@/stores/cloudSync'

const cloudSyncStore = useCloudSyncStore()

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
})

const progress = computed(() => cloudSyncStore.syncProgress)
const message = computed(() => props.message || cloudSyncStore.syncProgress.message || '加载中...')
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  min-width: 280px;
}

.loading-spinner {
  position: relative;
  width: 64px;
  height: 64px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
  border-top-color: #6366f1;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
  border-top-color: #8b5cf6;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
  border-top-color: #a855f7;
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
}

.spinner-ring:nth-child(4) {
  border-top-color: #c084fc;
  width: 40%;
  height: 40%;
  top: 30%;
  left: 30%;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-text {
  text-align: center;
}

.loading-message {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.loading-progress {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

