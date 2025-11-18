import { TASKS, TASK_TIME_RATIOS, TOTAL_DAYS, MAX_HOURS_PER_DAY, TARGET_SONGS } from './constants'

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

// 智能推断歌曲开始日期（三级推断策略）
// 优先级0：手动设置的 startDate（最高优先级）
// 优先级1：使用最早的计时记录日期
// 优先级2：使用创建日期
// 优先级3：使用默认计算（项目开始日期 + 索引偏移）
export function getSongStartDate(song, projectStartDate, songIndex) {
  if (!song) {
    console.debug('[getSongStartDate] song 为空，返回 null')
    return null
  }
  
  // 优先级0：如果歌曲有手动设置的 startDate，优先使用（即使解析失败也不使用推断）
  if (song.startDate && typeof song.startDate === 'string' && song.startDate.trim() !== '') {
    const dateStr = song.startDate.trim()
    console.debug(`[getSongStartDate] 检测到手动设置的 startDate: "${dateStr}"`)
    let parsedDate = null
    
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD 格式，手动解析避免时区问题
      const [year, month, day] = dateStr.split('-').map(Number)
      parsedDate = new Date(year, month - 1, day)
      parsedDate.setHours(0, 0, 0, 0)
      if (!isNaN(parsedDate.getTime())) {
        console.debug(`[getSongStartDate] ✅ 手动设置的 startDate 解析成功: ${parsedDate.toISOString().split('T')[0]}`)
        return parsedDate
      } else {
        console.warn(`[getSongStartDate] ⚠️ 手动设置的 startDate 解析失败 (YYYY-MM-DD格式): "${dateStr}"`)
      }
    } else {
      // 其他格式，尝试直接解析
      parsedDate = new Date(dateStr)
      parsedDate.setHours(0, 0, 0, 0)
      if (!isNaN(parsedDate.getTime())) {
        console.debug(`[getSongStartDate] ✅ 手动设置的 startDate 解析成功 (其他格式): ${parsedDate.toISOString().split('T')[0]}`)
        return parsedDate
      } else {
        console.warn(`[getSongStartDate] ⚠️ 手动设置的 startDate 解析失败 (其他格式): "${dateStr}"`)
      }
    }
    
    // 如果手动设置的 startDate 解析失败，返回 null（不使用推断逻辑）
    // 这样可以避免用户设置了错误日期时被推断逻辑覆盖
    console.debug('[getSongStartDate] 手动设置的 startDate 解析失败，返回 null（不使用推断逻辑）')
    return null
  } else {
    console.debug(`[getSongStartDate] 未检测到手动设置的 startDate (值: ${song.startDate}, 类型: ${typeof song.startDate})，继续使用推断逻辑`)
  }
  
  // 只有在没有手动设置 startDate 的情况下，才使用推断逻辑
  
  // 优先级1：使用最早的计时记录日期
  if (song.timerRecords && Array.isArray(song.timerRecords) && song.timerRecords.length > 0) {
    console.debug(`[getSongStartDate] 🔍 优先级1: 检查计时记录 (${song.timerRecords.length} 条)`)
    let earliestDate = null
    
    song.timerRecords.forEach((record, idx) => {
      // 优先使用 startTime，其次使用 createdAt
      const timeStr = record.startTime || record.createdAt
      if (timeStr) {
        const recordDate = new Date(timeStr)
        recordDate.setHours(0, 0, 0, 0)
        if (!isNaN(recordDate.getTime())) {
          if (!earliestDate || recordDate < earliestDate) {
            earliestDate = recordDate
            console.debug(`[getSongStartDate]   记录 ${idx + 1}: ${recordDate.toISOString().split('T')[0]} (${timeStr})`)
          }
        }
      }
    })
    
    if (earliestDate) {
      console.debug(`[getSongStartDate] ✅ 优先级1成功: 使用最早的计时记录日期 ${earliestDate.toISOString().split('T')[0]}`)
      return earliestDate
    } else {
      console.debug('[getSongStartDate] ⚠️ 优先级1失败: 计时记录中没有有效日期')
    }
  } else {
    console.debug('[getSongStartDate] ⏭️ 优先级1跳过: 没有计时记录')
  }
  
  // 优先级2：使用创建日期
  if (song.createdAt) {
    console.debug(`[getSongStartDate] 🔍 优先级2: 检查创建日期 ${song.createdAt}`)
    const createdDate = new Date(song.createdAt)
    createdDate.setHours(0, 0, 0, 0)
    if (!isNaN(createdDate.getTime())) {
      console.debug(`[getSongStartDate] ✅ 优先级2成功: 使用创建日期 ${createdDate.toISOString().split('T')[0]}`)
      return createdDate
    } else {
      console.warn(`[getSongStartDate] ⚠️ 优先级2失败: 创建日期解析失败 "${song.createdAt}"`)
    }
  } else {
    console.debug('[getSongStartDate] ⏭️ 优先级2跳过: 没有创建日期')
  }
  
  // 优先级3：使用默认计算（项目开始日期 + 索引偏移）
  if (projectStartDate && typeof songIndex === 'number') {
    console.debug(`[getSongStartDate] 🔍 优先级3: 使用默认计算 (项目开始: ${projectStartDate}, 索引: ${songIndex})`)
    const projectStart = new Date(projectStartDate)
    projectStart.setHours(0, 0, 0, 0)
    
    if (!isNaN(projectStart.getTime())) {
      const daysOffset = Math.floor(songIndex * (TOTAL_DAYS / TARGET_SONGS))
      const defaultDate = new Date(projectStart)
      defaultDate.setDate(projectStart.getDate() + daysOffset)
      defaultDate.setHours(0, 0, 0, 0)
      console.debug(`[getSongStartDate] ✅ 优先级3成功: 使用默认计算 ${defaultDate.toISOString().split('T')[0]} (偏移 ${daysOffset} 天)`)
      return defaultDate
    } else {
      console.warn(`[getSongStartDate] ⚠️ 优先级3失败: 项目开始日期解析失败 "${projectStartDate}"`)
    }
  } else {
    console.debug(`[getSongStartDate] ⏭️ 优先级3跳过: projectStartDate=${projectStartDate}, songIndex=${songIndex}`)
  }
  
  // 如果所有推断都失败，返回 null
  console.warn('[getSongStartDate] ❌ 所有推断都失败，返回 null')
  return null
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
  const projectStart = new Date(startDate)
  projectStart.setHours(0, 0, 0, 0)
  const endDate = new Date(projectStart)
  endDate.setDate(projectStart.getDate() + TOTAL_DAYS)
  
  // 为每首歌创建任务队列，并记录每首歌的开始日期
  const songQueues = activeSongs.map((song, index) => {
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
    
    // 使用智能推断函数计算歌曲的开始日期
    let songStartDate = getSongStartDate(song, startDate, index)
    
    // 如果推断失败，使用默认计算作为兜底
    if (!songStartDate || isNaN(songStartDate.getTime())) {
      const daysOffset = Math.floor(index * (TOTAL_DAYS / TARGET_SONGS))
      songStartDate = new Date(projectStart)
      songStartDate.setDate(projectStart.getDate() + daysOffset)
      songStartDate.setHours(0, 0, 0, 0)
    }
    
    return { 
      songId: song.id, 
      queue,
      startDate: songStartDate
    }
  })
  
  // 分配任务到每一天
  // 从项目开始日期开始，而不是从今天开始
  let currentDate = new Date(projectStart)
  currentDate.setHours(0, 0, 0, 0)
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
    
    // 轮询分配任务：只分配给 startDate 已到的歌曲（支持并行制作）
    // 多轮分配，直到当天时间用完或所有符合条件的歌曲都分配完
    let hasMoreWork = true
    while (availableHours > 0 && hasMoreWork) {
      hasMoreWork = false
      
      for (const songQueue of songQueues) {
        // 检查歌曲的开始日期是否已到（使用本地时间比较）
        if (songQueue.startDate) {
          const songStart = new Date(songQueue.startDate)
          songStart.setHours(0, 0, 0, 0)
          const current = new Date(currentDate)
          current.setHours(0, 0, 0, 0)
          if (current < songStart) {
            continue // 歌曲还未开始，跳过
          }
        }
        
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
          
          hasMoreWork = true // 还有工作要做
        }
      }
    }
    
    if (dayPlan.tasks.length > 0) {
      dailyPlan.push(dayPlan)
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate.setHours(0, 0, 0, 0)
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

  // 如果所有步骤都已完成，返回"已完成"
  if (completedIndices.length === customTasks.length) {
    return '已完成'
  }

  // 找到第一个未完成的步骤
  let firstIncompleteIndex = -1
  for (let i = 0; i < customTasks.length; i++) {
    if (!song.tasks[i]) {
      firstIncompleteIndex = i
      break
    }
  }

  // 如果找到了未完成的步骤，返回该步骤对应的阶段
  if (firstIncompleteIndex >= 0) {
    const taskName = customTasks[firstIncompleteIndex] || ''
    const matchedStage = matchStageByKeywords(taskName, firstIncompleteIndex, customTasks.length)
    // 如果匹配上就展示，匹配不上就展示原文
    return matchedStage || taskName || '曲风研究'
  }

  // 如果所有都没完成（理论上不应该到这里，但作为兜底），返回第一项
  if (customTasks.length === 0) {
    return '曲风研究'
  }
  const firstTaskName = customTasks[0] || ''
  const matchedStage = matchStageByKeywords(firstTaskName, 0, customTasks.length)
  return matchedStage || firstTaskName || '曲风研究'
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

