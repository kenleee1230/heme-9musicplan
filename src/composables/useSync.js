import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'

export function useSync() {
  const authStore = useAuthStore()
  const syncStore = useSyncStore()

  // 监听认证状态变化，自动同步
  watch(
    () => authStore.isAuthenticated,
    async (isAuth, wasAuth) => {
      // 用户刚登录，执行同步
      if (isAuth && !wasAuth) {
        console.log('用户已登录，开始同步数据...')
        await syncStore.syncWithCloud()
      }
    }
  )

  // 手动触发同步
  async function triggerSync() {
    if (!authStore.isAuthenticated) {
      return { success: false, error: '请先登录' }
    }

    return await syncStore.syncWithCloud()
  }

  return {
    triggerSync
  }
}

