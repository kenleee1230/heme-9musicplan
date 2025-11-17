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
        <TimelineView v-show="timelineView === 'timeline'" />
        <ProjectView v-show="timelineView === 'project'" />
        <DailyPlanView v-show="timelineView === 'daily'" />
      </section>

      <section class="gantt-section">
        <div class="section-header">
          <h2>📊 甘特图</h2>
        </div>
        <GanttChart />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from './stores/auth'
import { useSongsStore } from './stores/songs'
import { useSettingsStore } from './stores/settings'
import { useSync } from './composables/useSync'

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

// Stores
import { useTimerSyncStore } from '@/stores/timerSync'

const authStore = useAuthStore()
const songsStore = useSongsStore()
const settingsStore = useSettingsStore()
const timerSyncStore = useTimerSyncStore()

// 状态
const { songs } = storeToRefs(songsStore)
const activeTab = ref('schedule')
const timelineView = ref('timeline')
const showSongModal = ref(false)
const showLoginModal = ref(false)
const showRegisterModal = ref(false)
const editingSong = ref(null)
const showTimerRecordsModal = ref(false)
const viewingSong = ref(null)

// 初始化同步
useSync()

// 方法
function openSongModal() {
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
  if (editingSong.value) {
    songsStore.updateSong(editingSong.value.id, songData)
  } else {
    songsStore.addSong(songData)
  }
  closeSongModal()
}

function deleteSong(song) {
  if (confirm(`确定要删除歌曲"${song.name}"吗？`)) {
    songsStore.deleteSong(song.id)
  }
}

function viewTimerRecords(song) {
  // 获取最新的歌曲数据，确保包含最新的计时记录
  const latestSong = songsStore.getSongById(song.id) || song
  viewingSong.value = latestSong
  showTimerRecordsModal.value = true
}

function closeTimerRecordsModal() {
  showTimerRecordsModal.value = false
  viewingSong.value = null
}

// 生命周期
onMounted(async () => {
  // 初始化认证
  await authStore.initAuth()
  
  // 加载数据
  settingsStore.loadSettings()
  songsStore.loadSongs()
  
  // 初始化计时同步队列
  timerSyncStore.init()
  
  // 如果已登录且有网络，处理同步队列
  if (authStore.isAuthenticated && navigator.onLine) {
    timerSyncStore.processSyncQueue()
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

