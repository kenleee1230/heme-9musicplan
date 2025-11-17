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

