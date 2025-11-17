// localStorage 封装

export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error)
    return defaultValue
  }
}

export function saveToStorage(key, data) {
  try {
    // 确保数据是可序列化的（处理 Vue 响应式对象）
    let serializableData = data
    
    // 如果是 Vue ref，获取其 value
    if (data && typeof data === 'object' && '_value' in data) {
      serializableData = data._value
    }
    
    // 尝试序列化，如果失败会抛出错误
    let jsonString
    try {
      jsonString = JSON.stringify(serializableData, null, 0)
    } catch (stringifyError) {
      console.error('JSON.stringify 失败:', stringifyError)
      console.error('数据内容:', serializableData)
      throw new Error(`数据序列化失败: ${stringifyError.message}`)
    }
    
    const sizeInMB = new Blob([jsonString]).size / (1024 * 1024)
    const sizeInKB = new Blob([jsonString]).size / 1024
    
    console.log(`保存数据到 ${key}: ${sizeInKB.toFixed(2)}KB (${sizeInMB.toFixed(2)}MB)`)
    
    // 检查数据大小（localStorage 通常限制为 5-10MB）
    if (sizeInMB > 5) {
      console.warn(`数据大小 ${sizeInMB.toFixed(2)}MB，可能接近 localStorage 限制`)
    }
    
    localStorage.setItem(key, jsonString)
    console.log(`成功保存到 localStorage: ${key}`)
    return true
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error)
    console.error('错误类型:', error.name)
    console.error('错误代码:', error.code)
    console.error('错误消息:', error.message)
    
    // 检查是否是存储空间不足的错误
    if (error.name === 'QuotaExceededError' || error.code === 22 || error.message.includes('QuotaExceeded')) {
      console.error('localStorage 存储空间不足，可能需要清理数据')
      const errorMsg = '存储空间不足，请尝试删除一些旧的计时记录或导出数据后清理'
      throw new Error(errorMsg)
    }
    
    // 如果是序列化错误，直接抛出
    if (error.message.includes('序列化')) {
      throw error
    }
    
    return false
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error)
    return false
  }
}

export function clearStorage() {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}

