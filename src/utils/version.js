/**
 * 版本检查和更新管理
 */

const VERSION_STORAGE_KEY = 'pattr_app_version'
const VERSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5分钟检查一次

// 从 package.json 读取的版本号（构建时注入）
// 在开发环境中，如果没有定义，使用默认值
let APP_VERSION = '3.0.1'
try {
  // @ts-ignore
  if (typeof __APP_VERSION__ !== 'undefined') {
    // @ts-ignore
    APP_VERSION = __APP_VERSION__
  }
} catch (e) {
  // 忽略错误
}
export { APP_VERSION }

/**
 * 获取存储的版本号
 */
export function getStoredVersion() {
  return localStorage.getItem(VERSION_STORAGE_KEY)
}

/**
 * 保存当前版本号
 */
export function saveVersion(version) {
  localStorage.setItem(VERSION_STORAGE_KEY, version)
}

/**
 * 检查是否有新版本
 */
export function hasNewVersion() {
  const storedVersion = getStoredVersion()
  if (!storedVersion) {
    // 首次运行，保存当前版本
    saveVersion(APP_VERSION)
    return false
  }
  
  return storedVersion !== APP_VERSION
}

/**
 * 比较版本号
 * @param {string} v1 版本1
 * @param {string} v2 版本2
 * @returns {number} -1: v1 < v2, 0: v1 === v2, 1: v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    
    if (part1 < part2) return -1
    if (part1 > part2) return 1
  }
  
  return 0
}

/**
 * 检查版本是否需要强制更新
 */
export function needsForceUpdate() {
  const storedVersion = getStoredVersion()
  if (!storedVersion) return false
  
  // 如果存储的版本小于当前版本，需要更新
  return compareVersions(storedVersion, APP_VERSION) < 0
}

/**
 * 强制更新（清除缓存并刷新）
 */
export function forceUpdate() {
  console.log('[Version] 检测到新版本，强制更新...')
  console.log('[Version] 旧版本:', getStoredVersion())
  console.log('[Version] 新版本:', APP_VERSION)
  
  // 清除所有缓存
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name)
      })
      console.log('[Version] 缓存已清除')
    })
  }
  
  // 保存新版本号
  saveVersion(APP_VERSION)
  
  // 强制刷新页面
  window.location.reload(true)
}

/**
 * 初始化版本检查
 */
export function initVersionCheck() {
  console.log('[Version] 当前应用版本:', APP_VERSION)
  
  const storedVersion = getStoredVersion()
  
  // 如果存储的版本与当前版本不同，说明有新版本
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('[Version] 检测到版本变化:', {
      stored: storedVersion,
      current: APP_VERSION
    })
    // 不立即强制更新，让用户看到更新提示
    // 如果用户5秒内没有操作，自动更新
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        // 页面可见，延迟更新
        console.log('[Version] 页面可见，延迟更新')
      } else {
        // 页面不可见，立即更新
        forceUpdate()
      }
    }, 5000)
  }
  
  // 保存当前版本（如果是首次运行或版本已更新）
  if (!storedVersion || storedVersion !== APP_VERSION) {
    saveVersion(APP_VERSION)
  }
  
  // 立即检查一次更新
  checkForUpdates()
  
  // 定期检查版本（通过检查文件hash变化）
  setInterval(() => {
    checkForUpdates()
  }, VERSION_CHECK_INTERVAL)
  
  // 监听页面可见性变化，当页面重新可见时检查更新
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates()
    }
  })
  
  // 监听在线状态变化
  window.addEventListener('online', () => {
    console.log('[Version] 网络已连接，检查更新...')
    checkForUpdates()
  })
}

/**
 * 检查更新（通过尝试加载带版本号的资源文件）
 */
async function checkForUpdates() {
  try {
    // 方法1: 检查 Service Worker 更新
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        console.log('[Version] Service Worker 更新检查完成')
      }
    }
    
    // 方法2: 尝试获取主HTML文件的ETag
    const response = await fetch(`/?v=${Date.now()}`, { 
      method: 'HEAD',
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    // 如果响应头包含版本信息，可以比较
    const etag = response.headers.get('etag') || response.headers.get('last-modified')
    if (etag) {
      const storedEtag = localStorage.getItem('pattr_app_etag')
      if (storedEtag && storedEtag !== etag) {
        console.log('[Version] 检测到资源更新:', {
          old: storedEtag,
          new: etag
        })
        localStorage.setItem('pattr_app_etag', etag)
        // 触发版本更新事件，让组件处理
        window.dispatchEvent(new CustomEvent('app-update-available', {
          detail: { etag }
        }))
      } else if (!storedEtag) {
        localStorage.setItem('pattr_app_etag', etag)
      }
    }
  } catch (error) {
    // 网络错误，忽略
    console.debug('[Version] 版本检查失败:', error)
  }
}

/**
 * 注册Service Worker更新监听
 */
export function registerServiceWorkerUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[Version] Service Worker已更新，刷新页面...')
      // Service Worker更新后，等待一小段时间再刷新
      setTimeout(() => {
        forceUpdate()
      }, 1000)
    })
    
    // 监听Service Worker消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[Version] 收到Service Worker更新通知')
        forceUpdate()
      }
    })
  }
}

