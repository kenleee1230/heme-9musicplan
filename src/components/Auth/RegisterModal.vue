<template>
  <div class="modal" style="display: flex">
    <div class="modal-content">
      <span class="close" @click="$emit('close')">&times;</span>
      <h2>注册</h2>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="email" type="email" required placeholder="your@email.com" />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" required placeholder="至少6位" />
        </div>
        
        <div class="form-group">
          <label>确认密码</label>
          <input v-model="confirmPassword" type="password" required placeholder="再次输入密码" />
        </div>
        
        <div v-if="localError || error" class="error-message">
          {{ localError || error }}
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            取消
          </button>
        </div>
      </form>
      
      <p style="margin-top: 20px; text-align: center; color: #666;">
        已有账号？<a href="#" @click.prevent="$emit('showLogin')" style="color: #1a1a1a;">登录</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['close', 'showLogin'])
const authStore = useAuthStore()

const { loading, error } = storeToRefs(authStore)

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const localError = ref('')

async function handleRegister() {
  localError.value = ''
  
  if (password.value !== confirmPassword.value) {
    localError.value = '两次输入的密码不一致'
    return
  }
  
  if (password.value.length < 6) {
    localError.value = '密码至少需要6位'
    return
  }
  
  const result = await authStore.register(email.value, password.value)
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

