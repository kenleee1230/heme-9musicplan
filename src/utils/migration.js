import { v4 as uuidv4 } from 'uuid'
import { loadFromStorage, saveToStorage } from './storage'
import { 
  STORAGE_KEY, 
  START_DATE_KEY, 
  TIME_CONFIG_KEY,
  PATTR_WORKSPACES_KEY,
  PATTR_PROJECTS_KEY,
  PATTR_TRACKS_KEY
} from './constants'

const MIGRATION_VERSION_KEY = 'pattr_migration_version'
const CURRENT_MIGRATION_VERSION = 1

/**
 * 检查是否需要迁移
 */
export function needsMigration() {
  const currentVersion = loadFromStorage(MIGRATION_VERSION_KEY, 0)
  return currentVersion < CURRENT_MIGRATION_VERSION
}

/**
 * 执行数据迁移
 */
export function migrateData() {
  const currentVersion = loadFromStorage(MIGRATION_VERSION_KEY, 0)
  
  console.log('[Migration] Starting data migration from version', currentVersion)
  
  if (currentVersion < 1) {
    migrateToV1()
  }
  
  // 更新迁移版本
  saveToStorage(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION)
  console.log('[Migration] Migration completed to version', CURRENT_MIGRATION_VERSION)
}

/**
 * 迁移到 V1: 从单一项目模式到工作区/项目模式
 */
function migrateToV1() {
  console.log('[Migration V1] Starting migration to workspace/project structure')
  
  // 加载旧数据
  const oldSongs = loadFromStorage(STORAGE_KEY, [])
  const oldStartDate = loadFromStorage(START_DATE_KEY)
  const oldTimeConfig = loadFromStorage(TIME_CONFIG_KEY, {})
  
  // 如果没有旧数据，跳过迁移
  if (oldSongs.length === 0 && !oldStartDate) {
    console.log('[Migration V1] No old data found, skipping migration')
    return
  }
  
  console.log('[Migration V1] Found', oldSongs.length, 'songs to migrate')
  
  // 检查是否已有新数据结构
  const existingWorkspaces = loadFromStorage(PATTR_WORKSPACES_KEY, [])
  const existingProjects = loadFromStorage(PATTR_PROJECTS_KEY, [])
  const existingTracks = loadFromStorage(PATTR_TRACKS_KEY, [])
  
  // 如果已有作品数据，说明已经迁移过了，跳过
  if (existingTracks.length > 0) {
    console.log('[Migration V1] Tracks already exist, skipping migration')
    return
  }
  
  // 如果已有工作区和项目，使用现有的；否则创建新的
  let workspaceId, projectId
  
  if (existingWorkspaces.length > 0 && existingProjects.length > 0) {
    console.log('[Migration V1] Using existing workspace and project')
    workspaceId = existingWorkspaces[0].id
    projectId = existingProjects[0].id
  } else {
    console.log('[Migration V1] Creating new workspace and project')
    workspaceId = null
    projectId = null
  }
  
  // 如果没有工作区和项目，创建新的
  let workspace, project
  
  if (!workspaceId || !projectId) {
    // 创建默认工作区
    workspaceId = uuidv4()
    workspace = {
      id: workspaceId,
      name: '我的工作区',
      description: '从旧版本迁移的工作区',
      color: '#1a1a1a',
      settings: {
        timezone: 'Asia/Shanghai',
        defaultDailyHours: oldTimeConfig.dailyMakingHours || 2
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // 创建默认项目
    projectId = uuidv4()
    project = {
      id: projectId,
      workspaceId,
      name: '180天音乐计划',
      type: 'album',
      templateId: 'beginner-180',
      description: '从旧版本迁移的项目',
      startDate: oldStartDate || new Date().toISOString(),
      deadline: calculateDeadline(oldStartDate, 180),
      targetCount: 9,
      settings: {
        dailyHours: oldTimeConfig.dailyMakingHours || 2,
        autoSchedule: true
      },
      milestones: [
        { id: uuidv4(), name: '完成第1首歌', targetDate: null, completed: false, description: '迈出第一步' },
        { id: uuidv4(), name: '完成第3首歌', targetDate: null, completed: false, description: '25%进度达成' },
        { id: uuidv4(), name: '完成第5首歌', targetDate: null, completed: false, description: '过半完成' },
        { id: uuidv4(), name: '完成第7首歌', targetDate: null, completed: false, description: '75%进度达成' },
        { id: uuidv4(), name: '完成全部9首歌', targetDate: null, completed: false, description: '计划圆满完成' }
      ],
      goals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // 保存工作区和项目
    saveToStorage(PATTR_WORKSPACES_KEY, [workspace])
    saveToStorage(PATTR_PROJECTS_KEY, [project])
    
    // 设置活跃工作区和项目
    saveToStorage('pattr_active_workspace', workspaceId)
    saveToStorage('pattr_active_project', projectId)
  } else {
    // 使用现有的项目
    project = existingProjects[0]
  }
  
  // 迁移歌曲到作品
  console.log('[Migration V1] Migrating', oldSongs.length, 'songs to project:', projectId)
  const tracks = oldSongs.map(song => migrateSongToTrack(song, projectId))
  
  // 保存作品数据
  saveToStorage(PATTR_TRACKS_KEY, tracks)
  
  console.log('[Migration V1] Successfully migrated:')
  console.log('  - Workspace:', workspaceId)
  console.log('  - Project:', projectId)
  console.log('  -', tracks.length, 'tracks')
  
  // 更新里程碑完成状态
  if (project) {
    updateMilestones(project, tracks)
    saveToStorage(PATTR_PROJECTS_KEY, [project])
  }
}

/**
 * 将旧的 Song 对象迁移到新的 Track 对象
 */
function migrateSongToTrack(song, projectId) {
  // 确保 customSteps 和 stepsCompleted 的数据正确
  const customSteps = song.customTasks && Array.isArray(song.customTasks) && song.customTasks.length > 0
    ? song.customTasks
    : (song.customSteps || [])
  
  const stepsCompleted = song.tasks && Array.isArray(song.tasks)
    ? song.tasks
    : []
  
  return {
    id: song.id || uuidv4(),
    projectId,
    name: song.name || '未命名作品',
    type: 'song',
    workflowId: null,
    customSteps,
    stepsCompleted,
    taskHours: song.taskHours || [],
    startDate: song.startDate || '',
    deadline: null,
    estimatedHours: song.estimatedHours || 40,
    timeSpent: song.timeSpent || 0,
    timerRecords: song.timerRecords || [],
    currentStage: song.currentStage || '曲风研究',
    metadata: {
      genre: song.genre || '',
      bpm: null,
      key: null,
      notes: song.notes || '',
      isNewGenre: song.isNewGenre || false
    },
    createdAt: song.createdAt || new Date().toISOString(),
    updatedAt: song.updatedAt || new Date().toISOString()
  }
}

/**
 * 计算截止日期
 */
function calculateDeadline(startDate, days) {
  if (!startDate) return null
  
  const start = new Date(startDate)
  const deadline = new Date(start)
  deadline.setDate(deadline.getDate() + days)
  return deadline.toISOString()
}

/**
 * 更新里程碑完成状态
 */
function updateMilestones(project, tracks) {
  const completedCount = tracks.filter(t => t.currentStage === '已完成').length
  
  project.milestones.forEach(milestone => {
    if (milestone.name.includes('第1首') && completedCount >= 1) {
      milestone.completed = true
      milestone.completedAt = new Date().toISOString()
    } else if (milestone.name.includes('第3首') && completedCount >= 3) {
      milestone.completed = true
      milestone.completedAt = new Date().toISOString()
    } else if (milestone.name.includes('第5首') && completedCount >= 5) {
      milestone.completed = true
      milestone.completedAt = new Date().toISOString()
    } else if (milestone.name.includes('第7首') && completedCount >= 7) {
      milestone.completed = true
      milestone.completedAt = new Date().toISOString()
    } else if (milestone.name.includes('全部9首') && completedCount >= 9) {
      milestone.completed = true
      milestone.completedAt = new Date().toISOString()
    }
  })
}

/**
 * 备份旧数据
 */
export function backupOldData() {
  const backup = {
    songs: loadFromStorage(STORAGE_KEY, []),
    startDate: loadFromStorage(START_DATE_KEY),
    timeConfig: loadFromStorage(TIME_CONFIG_KEY, {}),
    backedUpAt: new Date().toISOString()
  }
  
  saveToStorage('pattr_backup_old_data', backup)
  console.log('[Migration] Old data backed up')
  return backup
}

