<template>
  <div id="app" class="container">
    <Header @showLogin="showLoginModal = true" />
    
    <TabNavigation v-model="activeTab" />
    
    <!-- 日程规划 Tab -->
    <main v-show="activeTab === 'schedule'" class="tab-content active">
      <section class="songs-section">
        <div class="section-header">
          <h2>歌曲列表</h2>
          <button class="btn btn-primary" @click="openSongModal()">+ 添加新歌</button>
        </div>
        <div class="songs-list">
          <SongCard 
            v-for="song in songs" 
            :key="song.id" 
            :song="song"
            @edit="editSong"
            @delete="deleteSong"
            @viewRecords="viewTimerRecords"
          />
          <div v-if="songs.length === 0" class="empty-state">
            暂无歌曲，点击"添加新歌"开始创建
          </div>
        </div>
      </section>

      <section class="timeline-section">
        <div class="section-header">
          <h2>时间线规划</h2>
          <div class="view-toggle-small">
            <button 
              :class="['btn-toggle-small', { active: timelineView === 'timeline' }]"
              @click="timelineView = 'timeline'"
            >
              📅 时间线
            </button>
            <button 
              :class="['btn-toggle-small', { active: timelineView === 'project' }]"
              @click="timelineView = 'project'"
            >
              📊 项目进度
            </button>
            <button 
              :class="['btn-toggle-small', { active: timelineView === 'daily' }]"
              @click="timelineView = 'daily'"
            >
              📆 每日任务
            </button>
          </div>
        </div>
        <TimelineView v-show="timelineView === 'timeline'" :key="`timeline-${activeProject?.id || 'none'}`" />
        <ProjectView v-show="timelineView === 'project'" :key="`project-${activeProject?.id || 'none'}`" />
        <DailyPlanView v-show="timelineView === 'daily'" :key="`daily-${activeProject?.id || 'none'}`" />
      </section>

      <section class="gantt-section">
        <div class="section-header">
          <h2>📊 甘特图</h2>
        </div>
        <GanttChart :key="`gantt-${activeProject?.id || 'none'}`" />
      </section>

      <section class="knowledge-section">
        <KnowledgeCard />
      </section>
    </main>
    
    <!-- 音乐理论 Tab -->
    <main v-show="activeTab === 'theory'" class="tab-content" :class="{ active: activeTab === 'theory' }">
      <CircleOfFifths />
      <ChordReference />
      <ModalScales />
    </main>
    
    <!-- 模态框 -->
    <SongModal 
      v-if="showSongModal" 
      :song="editingSong"
      @close="closeSongModal"
      @save="saveSong"
    />
    
    <LoginModal 
      v-if="showLoginModal" 
      @close="showLoginModal = false" 
      @showRegister="showLoginModal = false; showRegisterModal = true" 
    />
    <RegisterModal 
      v-if="showRegisterModal" 
      @close="showRegisterModal = false"
      @showLogin="showRegisterModal = false; showLoginModal = true"
    />
    
    <!-- 计时记录查看模态框 -->
    <TimerRecordsModal 
      :show="showTimerRecordsModal"
      :song="viewingSong"
      @close="closeTimerRecordsModal"
    />
    
    <!-- 计时器 -->
    <Timer />
    
    <!-- 全局加载提示 -->
    <Loading :isLoading="isLoading" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from './stores/auth'
import { useTracksStore } from './stores/tracks'
import { useWorkspacesStore } from './stores/workspaces'
import { useProjectsStore } from './stores/projects'
import { useWorkflowsStore } from './stores/workflows'
import { useCloudSyncStore } from './stores/cloudSync'
import { useSync } from './composables/useSync'
import { needsMigration, migrateData } from './utils/migration'
import { fixDataInconsistency } from './utils/dataFix'

// 组件导入
import Header from './components/Common/Header.vue'
import TabNavigation from './components/Common/TabNavigation.vue'
import KnowledgeCard from './components/Common/KnowledgeCard.vue'
import Timer from './components/Common/Timer.vue'
import SongCard from './components/Schedule/SongCard.vue'
import SongModal from './components/Schedule/SongModal.vue'
import TimerRecordsModal from './components/Schedule/TimerRecordsModal.vue'
import LoginModal from './components/Auth/LoginModal.vue'
import RegisterModal from './components/Auth/RegisterModal.vue'
import CircleOfFifths from './components/Theory/CircleOfFifths.vue'
import TimelineView from './components/Schedule/TimelineView.vue'
import ProjectView from './components/Schedule/ProjectView.vue'
import DailyPlanView from './components/Schedule/DailyPlanView.vue'
import GanttChart from './components/Schedule/GanttChart.vue'
import ChordReference from './components/Theory/ChordReference.vue'
import ModalScales from './components/Theory/ModalScales.vue'
import Loading from './components/Common/Loading.vue'

// Stores
import { useTimerSyncStore } from '@/stores/timerSync'

const authStore = useAuthStore()
const tracksStore = useTracksStore()
const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
const workflowsStore = useWorkflowsStore()
const timerSyncStore = useTimerSyncStore()
const cloudSyncStore = useCloudSyncStore()

// 状态
const { projectTracks: tracks } = storeToRefs(tracksStore)
const { activeProject } = storeToRefs(projectsStore)
const { activeWorkspace } = storeToRefs(workspacesStore)
const { isSyncing: isCloudSyncing } = storeToRefs(cloudSyncStore)

const activeTab = ref('schedule')
const timelineView = ref('timeline')
const showSongModal = ref(false)
const showLoginModal = ref(false)
const showRegisterModal = ref(false)
const editingSong = ref(null)
const showTimerRecordsModal = ref(false)
const viewingSong = ref(null)
const isAppLoading = ref(false)

// 计算属性 - 向后兼容
const songs = computed(() => tracks.value || [])

// 计算属性 - 是否显示加载
const isLoading = computed(() => isAppLoading.value || isCloudSyncing.value)

// 初始化同步
useSync()

// 方法
function openSongModal() {
  if (!activeProject.value) {
    alert('请先选择或创建一个项目')
    return
  }
  editingSong.value = null
  showSongModal.value = true
}

function editSong(song) {
  editingSong.value = song
  showSongModal.value = true
}

function closeSongModal() {
  showSongModal.value = false
  editingSong.value = null
}

function saveSong(songData) {
  // 转换 formData 格式（旧格式）到 track 格式（新格式）
  const trackData = {
    // 基本字段
    name: songData.name,
    estimatedHours: songData.estimatedHours,
    timeSpent: songData.timeSpent,
    startDate: songData.startDate,
    // 新数据结构：customSteps 和 stepsCompleted
    customSteps: songData.customSteps || songData.customTasks || [],
    stepsCompleted: songData.stepsCompleted || songData.tasks || [],
    taskHours: songData.taskHours || [],
    currentStage: songData.currentStage,
    // 新数据结构：metadata
    metadata: {
      genre: songData.metadata?.genre || songData.genre || '',
      notes: songData.metadata?.notes || songData.notes || '',
      isNewGenre: songData.metadata?.isNewGenre !== undefined 
        ? songData.metadata.isNewGenre 
        : (songData.isNewGenre || false),
      // 保留其他 metadata 字段（如果有）
      bpm: songData.metadata?.bpm || null,
      key: songData.metadata?.key || null
    }
  }
  
  if (editingSong.value) {
    tracksStore.updateTrack(editingSong.value.id, trackData)
  } else {
    tracksStore.createTrack(trackData)
  }
  closeSongModal()
}

function deleteSong(song) {
  if (confirm(`确定要删除作品"${song.name}"吗？`)) {
    tracksStore.deleteTrack(song.id)
  }
}

function viewTimerRecords(song) {
  const latestSong = tracksStore.getTrackById(song.id) || song
  viewingSong.value = latestSong
  showTimerRecordsModal.value = true
}

function closeTimerRecordsModal() {
  showTimerRecordsModal.value = false
  viewingSong.value = null
}

// 生命周期
onMounted(async () => {
  console.log('[App] ========== 应用启动 ==========')
  
  // 显示加载提示
  isAppLoading.value = true
  
  try {
    // 步骤1: 初始化认证（检查用户是否已登录）
    await authStore.initAuth()
    console.log('[App] 认证状态:', authStore.isAuthenticated ? '已登录' : '未登录')
  
  // 步骤2: 根据登录状态决定数据来源
  if (authStore.isAuthenticated) {
    // ========== 已登录：云端是真相之源 ==========
    console.log('[App] 用户已登录，从云端加载数据...')
    
    const cloudSyncStore = useCloudSyncStore()
    const result = await cloudSyncStore.loadFromCloud()
    
    if (result.success) {
      console.log('[App] 云端数据加载成功')
      
      // 云端数据已保存到 localStorage，重新加载到 store
      workspacesStore.loadWorkspaces()
      projectsStore.loadProjects()
      tracksStore.loadTracks()
      workflowsStore.loadWorkflows()
      
      console.log('[App] 数据加载完成:')
      console.log('  - 工作区:', workspacesStore.workspaces.length)
      console.log('  - 项目:', projectsStore.projects.length)
      console.log('  - 作品:', tracksStore.tracks.length)
    } else {
      console.error('[App] 云端数据加载失败:', result.error)
      console.log('[App] 回退到本地数据')
      
      // 云端加载失败，使用本地数据
      workspacesStore.loadWorkspaces()
      projectsStore.loadProjects()
      tracksStore.loadTracks()
      workflowsStore.loadWorkflows()
    }
  } else {
    // ========== 未登录：本地是真相之源 ==========
    console.log('[App] 用户未登录，从本地存储加载数据...')
    
    // 检查并执行数据迁移（旧版本数据 → 新版本数据）
    if (needsMigration()) {
      console.log('[App] 检测到旧版本数据，执行迁移...')
      migrateData()
    }
    
    // 修复数据不一致问题
    const dataFixed = fixDataInconsistency()
    if (dataFixed) {
      console.log('[App] 数据不一致已修复')
    }
    
    // 从本地存储加载数据
    workspacesStore.loadWorkspaces()
    projectsStore.loadProjects()
    tracksStore.loadTracks()
    workflowsStore.loadWorkflows()
    
    console.log('[App] 本地数据加载完成:')
    console.log('  - 工作区:', workspacesStore.workspaces.length)
    console.log('  - 项目:', projectsStore.projects.length)
    console.log('  - 作品:', tracksStore.tracks.length)
  }
  
  // 步骤3: 确保至少有一个工作区
  if (workspacesStore.workspaces.length === 0) {
    console.log('[App] 没有工作区，创建默认工作区...')
    
    const workspace = workspacesStore.createWorkspace({
      name: '我的工作区',
      description: '默认工作区'
    })
    workspacesStore.setActiveWorkspace(workspace.id)
    
    // 如果已登录，同步到云端
    if (authStore.isAuthenticated) {
      console.log('[App] 同步默认工作区到云端...')
      const cloudSyncStore = useCloudSyncStore()
      await cloudSyncStore.syncToCloud()
    }
  }
  
  // 步骤4: 打印最终状态
  console.log('[App] 最终状态:')
  console.log('  - 活跃工作区:', workspacesStore.activeWorkspace?.name)
  console.log('  - 活跃项目:', projectsStore.activeProject?.name)
  console.log('[App] ========== 应用启动完成 ==========')
  
  // 步骤5: 初始化计时同步队列
  timerSyncStore.init()
  
  // 如果已登录且有网络，处理同步队列
  if (authStore.isAuthenticated && navigator.onLine) {
    timerSyncStore.processSyncQueue()
  }
  } finally {
    // 隐藏加载提示
    isAppLoading.value = false
    console.log('[App] 加载提示已隐藏')
  }
})
</script>

<style scoped>
.empty-state {
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 1.1em;
}
</style>

