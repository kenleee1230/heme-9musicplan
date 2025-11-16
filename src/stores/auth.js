import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '@/config/firebase'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')

  // 初始化认证状态监听
  function initAuth() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          user.value = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          }
        } else {
          user.value = null
        }
        resolve(firebaseUser)
      })
    })
  }

  // 登录
  async function login(email, password) {
    loading.value = true
    error.value = null
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 注册
  async function register(email, password) {
    loading.value = true
    error.value = null
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }
      return { success: true }
    } catch (err) {
      console.error('Register error:', err)
      error.value = getErrorMessage(err.code)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    loading.value = true
    error.value = null
    
    try {
      await signOut(auth)
      user.value = null
      return { success: true }
    } catch (err) {
      console.error('Logout error:', err)
      error.value = '登出失败，请重试'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 清除错误
  function clearError() {
    error.value = null
  }

  // 错误消息映射
  function getErrorMessage(code) {
    const errorMessages = {
      'auth/user-not-found': '用户不存在',
      'auth/wrong-password': '密码错误',
      'auth/email-already-in-use': '该邮箱已被注册',
      'auth/weak-password': '密码强度不够（至少6位）',
      'auth/invalid-email': '邮箱格式不正确',
      'auth/too-many-requests': '请求过于频繁，请稍后重试',
      'auth/network-request-failed': '网络连接失败',
      'auth/invalid-credential': '登录凭证无效'
    }
    return errorMessages[code] || '操作失败，请重试'
  }

  return {
    // 状态
    user,
    loading,
    error,
    // 计算属性
    isAuthenticated,
    userEmail,
    // 方法
    initAuth,
    login,
    register,
    logout,
    clearError
  }
})

