<template>
  <div class="user-menu">
    <button v-if="!isAuthenticated" class="btn btn-primary" @click="showLogin">
      登录
    </button>
    <div v-else class="user-info">
      <span class="user-email">{{ userEmail }}</span>
      <button class="btn btn-secondary" @click="handleLogout">登出</button>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['showLogin'])
const authStore = useAuthStore()

const { isAuthenticated, userEmail } = storeToRefs(authStore)

function showLogin() {
  emit('showLogin')
}

async function handleLogout() {
  if (confirm('确定要登出吗？')) {
    await authStore.logout()
  }
}
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-email {
  font-size: 0.9em;
  color: #666;
  margin-right: 10px;
}
</style>

