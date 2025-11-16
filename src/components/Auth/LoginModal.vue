<template>
  <div class="modal" style="display: flex">
    <div class="modal-content">
      <span class="close" @click="$emit('close')">&times;</span>
      <h2>登录</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" required placeholder="your@email.com" />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" required placeholder="至少6位" />
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            取消
          </button>
        </div>
      </form>
      
      <p style="margin-top: 20px; text-align: center; color: #666;">
        还没有账号？<a href="#" @click.prevent="$emit('showRegister')" style="color: #1a1a1a;">注册</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['close', 'showRegister'])
const authStore = useAuthStore()

const { loading, error } = storeToRefs(authStore)

const email = ref('')
const password = ref('')

async function handleLogin() {
  const result = await authStore.login(email.value, password.value)
  if (result.success) {
    emit('close')
  }
}
</script>

<style scoped>
.error-message {
  color: #d32f2f;
  padding: 10px;
  background: #ffebee;
  border-radius: 4px;
  margin-bottom: 15px;
}
</style>

