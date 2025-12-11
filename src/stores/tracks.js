import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { PATTR_TRACKS_KEY, TASKS } from '@/utils/constants'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { calculateProgress, calculateTaskHours, getStageFromLastCompletedTask } from '@/utils/calculations'
import { useProjectsStore } from './projects'
import { useWorkflowsStore } from './workflows'

export const useTracksStore = defineStore('tracks', () => {
  // 状态
  const tracks = ref([])

  // 计算属性
  const projectTracks = computed(() => {
    const projectsStore = useProjectsStore()
    const projectId = projectsStore.activeProjectId
    if (!projectId) return []
    
    return tracks.value.filter(t => t.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  })

  const completedTracks = computed(() => {
    return projectTracks.value.filter(t => t.currentStage === '已完成')
  })

  const inProgressTracks = computed(() => {
    return projectTracks.value.filter(t => t.currentStage !== '已完成')
  })

  const completedCount = computed(() => completedTracks.value.length)
  
  const inProgressCount = computed(() => inProgressTracks.value.length)

  const totalProgress = computed(() => {
    if (projectTracks.value.length === 0) return 0
    const sum = projectTracks.value.reduce((acc, track) => acc + calculateProgress(track), 0)
    return Math.round(sum / projectTracks.value.length)
  })

  // 从 localStorage 加载作品
  function loadTracks() {
    const savedTracks = loadFromStorage(PATTR_TRACKS_KEY, [])
    tracks.value = savedTracks.map(track => normalizeTrack(track))
  }

  // 规范化作品数据
  function normalizeTrack(track) {
    // 确保 customSteps 存在
    let customSteps = track.customSteps || track.customTasks || []
    if (!Array.isArray(customSteps) || customSteps.length === 0) {
      customSteps = [...TASKS]
    }
    
    // 确保 stepsCompleted 数组长度与 customSteps 一致
    let stepsCompleted = track.stepsCompleted || track.tasks || []
    if (stepsCompleted.length !== customSteps.length) {
      const newSteps = new Array(customSteps.length).fill(false)
      stepsCompleted.forEach((completed, index) => {
        if (index < newSteps.length) {
          newSteps[index] = completed
        }
      })
      stepsCompleted = newSteps
    }
    
    // 确保 taskHours 数组长度与 customSteps 一致
    let taskHours = track.taskHours || []
    if (taskHours.length !== customSteps.length) {
      if (taskHours.length === 0) {
        taskHours = calculateTaskHours(track.estimatedHours || 40, track.isNewGenre || false)
      }
      if (taskHours.length !== customSteps.length) {
        const newTaskHours = new Array(customSteps.length).fill(0)
        taskHours.forEach((hours, index) => {
          if (index < newTaskHours.length) {
            newTaskHours[index] = hours
          }
        })
        taskHours = newTaskHours
      }
    }
    
    // 计算当前阶段
    const tempTrack = {
      customTasks: customSteps,
      tasks: stepsCompleted
    }
    const calculatedStage = getStageFromLastCompletedTask(tempTrack)
    
    return {
      id: track.id || uuidv4(),
      projectId: track.projectId || null,
      name: track.name || '未命名作品',
      type: track.type || 'song',
      workflowId: track.workflowId || null,
      customSteps,
      stepsCompleted,
      taskHours,
      startDate: track.startDate || '',
      deadline: track.deadline || null,
      estimatedHours: track.estimatedHours || 40,
      timeSpent: track.timeSpent || 0,
      timerRecords: track.timerRecords || [],
      currentStage: calculatedStage,
      metadata: {
        genre: track.genre || track.metadata?.genre || '',
        bpm: track.metadata?.bpm || null,
        key: track.metadata?.key || null,
        notes: track.notes || track.metadata?.notes || '',
        isNewGenre: track.isNewGenre || false
      },
      createdAt: track.createdAt || new Date().toISOString(),
      updatedAt: track.updatedAt || new Date().toISOString()
    }
  }

  // 保存作品到 localStorage
  function saveTracks() {
    saveToStorage(PATTR_TRACKS_KEY, tracks.value)
  }

  // 创建作品
  function createTrack(data) {
    const projectsStore = useProjectsStore()
    const workflowsStore = useWorkflowsStore()
    const projectId = data.projectId || projectsStore.activeProjectId

    if (!projectId) {
      console.error('No project selected')
      return null
    }

    // 获取当前项目
    const project = projectsStore.getProjectById(projectId)
    
    // 如果指定了工作流，从工作流加载步骤
    let customSteps = data.customSteps || []
    let workflowId = data.workflowId
    let taskHours = data.taskHours
    
    if (customSteps.length === 0) {
      // 1. 如果没有指定工作流，尝试从项目模板获取默认工作流
      if (!workflowId && project?.templateId) {
        workflowId = project.templateId
        const workflow = workflowsStore.getDefaultWorkflowForProjectType(project.templateId)
        if (workflow) {
          workflowId = workflow.id
          customSteps = workflow.steps.map(s => s.name)
          // 使用工作流的预估时长
          taskHours = workflow.steps.map(s => s.estimatedHours || 0)
        }
      }
      
      // 2. 如果指定了工作流ID，从工作流加载步骤
      if (workflowId && customSteps.length === 0) {
        const workflow = workflowsStore.getWorkflowById(workflowId)
        if (workflow) {
          customSteps = workflow.steps.map(s => s.name)
          taskHours = workflow.steps.map(s => s.estimatedHours || 0)
        }
      }
      
      // 3. 如果还是没有步骤，使用默认的 TASKS
      if (customSteps.length === 0) {
        customSteps = [...TASKS]
      }
    }

    // 计算总预估时长
    const estimatedHours = taskHours 
      ? taskHours.reduce((sum, h) => sum + h, 0)
      : (data.estimatedHours || 40)

    const track = {
      id: uuidv4(),
      projectId,
      name: data.name || '未命名作品',
      type: data.type || 'song',
      workflowId: workflowId || null,
      customSteps,
      stepsCompleted: new Array(customSteps.length).fill(false),
      taskHours: taskHours || calculateTaskHours(estimatedHours, data.metadata?.isNewGenre || false),
      startDate: data.startDate || '',
      deadline: data.deadline || null,
      estimatedHours: estimatedHours,
      timeSpent: 0,
      timerRecords: [],
      currentStage: customSteps[0] || '曲风研究',
      metadata: {
        genre: data.metadata?.genre || '',
        bpm: data.metadata?.bpm || null,
        key: data.metadata?.key || null,
        notes: data.metadata?.notes || '',
        isNewGenre: data.metadata?.isNewGenre || false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    tracks.value.push(track)
    saveTracks()
    return track
  }

  // 更新作品
  function updateTrack(id, data) {
    const index = tracks.value.findIndex(t => t.id === id)
    if (index === -1) return false

    const track = tracks.value[index]
    
    // 更新数据
    Object.assign(track, {
      ...data,
      updatedAt: new Date().toISOString()
    })

    // 重新计算当前阶段
    if (data.stepsCompleted || data.customSteps) {
      const tempTrack = {
        customTasks: track.customSteps,
        tasks: track.stepsCompleted
      }
      track.currentStage = getStageFromLastCompletedTask(tempTrack)
    }

    saveTracks()
    return true
  }

  // 删除作品
  function deleteTrack(id) {
    const index = tracks.value.findIndex(t => t.id === id)
    if (index === -1) return false

    tracks.value.splice(index, 1)
    saveTracks()
    return true
  }

  // 获取作品
  function getTrackById(id) {
    return tracks.value.find(t => t.id === id) || null
  }

  // 获取项目的作品
  function getTracksByProject(projectId) {
    return tracks.value.filter(t => t.projectId === projectId)
  }

  // 删除项目的所有作品
  function deleteTracksByProject(projectId) {
    tracks.value = tracks.value.filter(t => t.projectId !== projectId)
    saveTracks()
  }

  // 添加计时记录
  function addTimerRecord(trackId, record) {
    const track = getTrackById(trackId)
    if (!track) return false

    track.timerRecords.push({
      id: record.id || uuidv4(),
      duration: record.duration,
      startTime: record.startTime,
      endTime: record.endTime,
      createdAt: record.createdAt || new Date().toISOString(),
      details: record.details || ''
    })

    // 更新总时长
    track.timeSpent = track.timerRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / 3600
    track.updatedAt = new Date().toISOString()
    
    saveTracks()
    return true
  }

  // 删除计时记录
  function deleteTimerRecord(trackId, recordId) {
    const track = getTrackById(trackId)
    if (!track) return false

    const index = track.timerRecords.findIndex(r => r.id === recordId)
    if (index === -1) return false

    track.timerRecords.splice(index, 1)
    
    // 重新计算总时长
    track.timeSpent = track.timerRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / 3600
    track.updatedAt = new Date().toISOString()
    
    saveTracks()
    return true
  }

  // 导出数据
  function exportData() {
    const data = {
      tracks: tracks.value,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    }
    return JSON.stringify(data, null, 2)
  }

  // 导入数据
  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString)
      
      if (data.tracks && Array.isArray(data.tracks)) {
        // 合并导入的作品
        data.tracks.forEach(importedTrack => {
          const normalized = normalizeTrack(importedTrack)
          const existing = tracks.value.find(t => t.id === normalized.id)
          
          if (existing) {
            // 如果已存在，根据更新时间决定是否覆盖
            if (new Date(normalized.updatedAt) > new Date(existing.updatedAt)) {
              Object.assign(existing, normalized)
            }
          } else {
            tracks.value.push(normalized)
          }
        })
        
        saveTracks()
        return { success: true, count: data.tracks.length }
      }
      
      return { success: false, error: '无效的数据格式' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return {
    // 状态
    tracks,
    // 计算属性
    projectTracks,
    completedTracks,
    inProgressTracks,
    completedCount,
    inProgressCount,
    totalProgress,
    // 方法
    loadTracks,
    createTrack,
    updateTrack,
    deleteTrack,
    getTrackById,
    getTracksByProject,
    deleteTracksByProject,
    addTimerRecord,
    deleteTimerRecord,
    exportData,
    importData,
    saveTracks
  }
})

// 保持向后兼容的别名
export const useSongsStore = useTracksStore
