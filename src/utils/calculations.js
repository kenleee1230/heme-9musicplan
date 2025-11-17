import { TASKS, TASK_TIME_RATIOS, TOTAL_DAYS, MAX_HOURS_PER_DAY } from './constants'

// 计算歌曲进度（基于已完成任务数）
export function calculateProgress(song) {
  if (!song || !song.tasks) return 0
  const completedCount = song.tasks.filter(Boolean).length
  // 使用 customTasks 长度，如果没有则使用默认 TASKS 长度
  const totalTasks = (Array.isArray(song.customTasks) && song.customTasks.length > 0)
    ? song.customTasks.length
    : TASKS.length
  return totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
}

// 计算时间分配
export function calculateTimeDistribution(estimatedHours, dailyMakingTime) {
  const composition = estimatedHours * 0.7 // 编曲作曲 70%
  const mixing = estimatedHours * 0.3 // 混音母带 30%
  const daysAtRecommended = dailyMakingTime > 0 ? estimatedHours / dailyMakingTime : 0
  const daysAtMax = estimatedHours / MAX_HOURS_PER_DAY
  
  return { 
    composition, 
    mixing, 
    total: estimatedHours, 
    daysAtRecommended: Math.ceil(daysAtRecommended), 
    daysAtMax: Math.ceil(daysAtMax) 
  }
}

// 计算任务时长分配
export function calculateTaskHours(estimatedHours, isNewGenre = false) {
  const taskHours = []
  
  // 如果是新曲风，第一个任务有占比，否则为0
  const firstTaskRatio = isNewGenre ? TASK_TIME_RATIOS[0] : 0
  
  // 计算其他任务的总占比
  const otherTasksRatio = TASK_TIME_RATIOS.slice(1).reduce((sum, ratio) => sum + ratio, 0)
  const totalRatio = firstTaskRatio + otherTasksRatio
  
  TASK_TIME_RATIOS.forEach((ratio, index) => {
    if (index === 0 && !isNewGenre) {
      taskHours.push(0)
    } else {
      const hours = (ratio / totalRatio) * estimatedHours
      taskHours.push(Math.round(hours * 10) / 10) // 保留一位小数
    }
  })
  
  return taskHours
}

// 更新某个任务的时长
export function updateTaskHour(song, taskIndex, newHours) {
  if (!song.taskHours) {
    song.taskHours = calculateTaskHours(song.estimatedHours, song.isNewGenre)
  }
  
  song.taskHours[taskIndex] = Math.max(0, newHours)
  
  // 重新计算总时长
  const total = song.taskHours.reduce((sum, h) => sum + h, 0)
  song.estimatedHours = total
  
  return song
}

// 计算剩余天数
export function getRemainingDays(startDate) {
  if (!startDate) return TOTAL_DAYS
  
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const endDate = new Date(start)
  endDate.setDate(start.getDate() + TOTAL_DAYS)
  
  const remaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
  return Math.max(0, remaining)
}

// 生成每日任务计划
export function generateDailyPlan(songs, startDate, dailyLearningHours, dailyMakingHours) {
  const dailyMakingTime = Math.max(0, dailyMakingHours - dailyLearningHours)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 获取进行中的歌曲
  const activeSongs = songs.filter(song => song.currentStage !== '已完成')
  
  if (activeSongs.length === 0) {
    return []
  }
  
  // 为每首歌初始化任务时长
  activeSongs.forEach(song => {
    if (!song.taskHours) {
      song.taskHours = calculateTaskHours(song.estimatedHours, song.isNewGenre)
    }
  })
  
  const dailyPlan = []
  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setDate(start.getDate() + TOTAL_DAYS)
  
  // 为每首歌创建任务队列
  const songQueues = activeSongs.map(song => {
    const queue = []
    
    // 获取 customTasks，如果没有则使用默认 TASKS
    const customTasks = Array.isArray(song.customTasks) && song.customTasks.length > 0
      ? song.customTasks
      : TASKS
    
    song.taskHours.forEach((hours, taskIndex) => {
      if (!song.tasks[taskIndex] && hours > 0) {
        // 使用 customTasks 中的任务名称
        const taskName = customTasks[taskIndex] || `任务 ${taskIndex + 1}`
        queue.push({
          songId: song.id,
          songName: song.name,
          taskIndex: taskIndex,
          taskName: taskName,
          hours: hours,
          remainingHours: hours,
          isNewGenre: song.isNewGenre
        })
      }
    })
    
    return { songId: song.id, queue }
  })
  
  // 分配任务到每一天
  let currentDate = new Date(today)
  let currentDayIndex = 0
  
  while (currentDate <= endDate && songQueues.some(sq => sq.queue.length > 0)) {
    const dayPlan = {
      date: new Date(currentDate),
      tasks: [],
      learningHours: dailyLearningHours,
      makingHours: dailyMakingTime,
      totalHours: 0
    }
    
    let availableHours = dailyMakingTime
    
    // 轮询分配任务
    for (const songQueue of songQueues) {
      if (songQueue.queue.length > 0 && availableHours > 0) {
        const task = songQueue.queue[0]
        const hoursToAllocate = Math.min(task.remainingHours, availableHours)
        
        dayPlan.tasks.push({
          ...task,
          allocatedHours: hoursToAllocate
        })
        
        task.remainingHours -= hoursToAllocate
        availableHours -= hoursToAllocate
        dayPlan.totalHours += hoursToAllocate
        
        // 如果任务完成，移出队列
        if (task.remainingHours <= 0) {
          songQueue.queue.shift()
        }
      }
    }
    
    if (dayPlan.tasks.length > 0) {
      dailyPlan.push(dayPlan)
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
    currentDayIndex++
    
    // 防止无限循环
    if (currentDayIndex > TOTAL_DAYS * 2) break
  }
  
  return dailyPlan
}

// 根据任务名称进行关键词匹配，返回匹配的阶段或null
function matchStageByKeywords(taskName, taskIndex, totalTasks) {
  const lowerTaskName = taskName.toLowerCase()
  
  // 检查是否包含"完成制作"或"完成"（且是最后一步）
  if (taskIndex === totalTasks - 1) {
    if (lowerTaskName.includes('完成制作') || lowerTaskName.includes('完成')) {
      return '已完成'
    }
  }
  
  // 检查是否包含"校长"
  if (lowerTaskName.includes('校长')) {
    return '校长审核'
  }
  
  // 检查是否包含"队长"且不包含"校长"
  if (lowerTaskName.includes('队长') && !lowerTaskName.includes('校长')) {
    return '队长审核'
  }
  
  // 检查是否包含"混音"或"母带"
  if (lowerTaskName.includes('混音') || lowerTaskName.includes('母带')) {
    return '混音母带'
  }
  
  // 检查是否包含"编曲"
  if (lowerTaskName.includes('编曲')) {
    return '编曲'
  }
  
  // 检查是否包含"Demo"
  if (lowerTaskName.includes('demo')) {
    return 'Demo制作'
  }
  
  // 检查是否包含"曲风"、"参考歌"、"前期准备"
  if (lowerTaskName.includes('曲风') || lowerTaskName.includes('参考歌') || lowerTaskName.includes('前期准备')) {
    return '曲风研究'
  }
  
  return null
}

// 根据最后一个已完成步骤判断当前阶段
export function getStageFromLastCompletedTask(song) {
  if (!song || !song.tasks || !Array.isArray(song.tasks)) {
    return '曲风研究'
  }

  // 获取 customTasks，如果没有则使用默认 TASKS
  const customTasks = (Array.isArray(song.customTasks) && song.customTasks.length > 0)
    ? song.customTasks
    : TASKS

  // 找到所有已完成的步骤索引
  const completedIndices = []
  song.tasks.forEach((completed, index) => {
    if (completed && index < customTasks.length) {
      completedIndices.push(index)
    }
  })

  // 如果没有任何步骤完成，对第一项进行匹配
  if (completedIndices.length === 0) {
    if (customTasks.length === 0) {
      return '曲风研究'
    }
    const firstTaskName = customTasks[0] || ''
    const matchedStage = matchStageByKeywords(firstTaskName, 0, customTasks.length)
    // 如果匹配上就展示，匹配不上就展示原文
    return matchedStage || firstTaskName || '曲风研究'
  }

  // 如果所有步骤都已完成，返回"已完成"
  if (completedIndices.length === customTasks.length) {
    return '已完成'
  }

  // 获取最后一个已完成步骤的索引和名称
  const lastCompletedIndex = completedIndices[completedIndices.length - 1]
  const lastCompletedTaskName = customTasks[lastCompletedIndex] || ''

  // 策略1：关键词匹配（优先）
  const matchedStage = matchStageByKeywords(lastCompletedTaskName, lastCompletedIndex, customTasks.length)
  if (matchedStage) {
    return matchedStage
  }

  // 策略2：如果关键词匹配失败，返回步骤名称原文
  return lastCompletedTaskName || '曲风研究'
}

// 计算项目整体统计
export function calculateProjectStats(songs) {
  const totalSongs = songs.length
  const completedSongs = songs.filter(s => s.currentStage === '已完成').length
  const inProgressSongs = songs.filter(s => s.currentStage !== '已完成').length
  
  // 计算整体进度
  const totalProgress = songs.reduce((sum, song) => {
    return sum + calculateProgress(song)
  }, 0)
  
  const avgProgress = totalSongs > 0 ? Math.round(totalProgress / totalSongs) : 0
  
  // 计算总时长统计
  const totalEstimatedHours = songs.reduce((sum, song) => sum + (song.estimatedHours || 0), 0)
  const totalSpentHours = songs.reduce((sum, song) => sum + (song.timeSpent || 0), 0)
  const totalRemainingHours = totalEstimatedHours - totalSpentHours
  
  // 按阶段统计
  const stageDistribution = {}
  songs.forEach(song => {
    const stage = song.currentStage || '曲风研究'
    stageDistribution[stage] = (stageDistribution[stage] || 0) + 1
  })
  
  return {
    totalSongs,
    completedSongs,
    inProgressSongs,
    avgProgress,
    totalEstimatedHours,
    totalSpentHours,
    totalRemainingHours,
    stageDistribution
  }
}

