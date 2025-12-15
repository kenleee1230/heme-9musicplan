<template>
  <header>
    <div class="header-top">
      <div class="header-brand">
        <div class="brand-logo-wrapper">
          <img src="/pattr.png" alt="Pattr Logo" class="brand-logo" />
          <!--<h1>Pattr</h1>-->
        </div>
        <p class="header-tagline">计划是为了拥抱变化。<br>总之，不挥棒的话，什么都不会发生的。</p>
      </div>
      
      <div class="header-navigation">
        <WorkspaceSelector />
        <ProjectSelector @createProject="showProjectModal = true" />
      </div>
      
      <div class="header-actions">
        <UserMenu @showLogin="$emit('showLogin')" />
        <div class="data-management">
          <button class="btn-link" @click="exportData" title="导出备份">💾</button>
          <button class="btn-link" @click="importData" title="导入备份">📥</button>
        </div>
      </div>
    </div>
    
    <div v-if="activeProject" class="header-stats">
      <StatsCard label="剩余天数" :value="remainingDays" />
      <StatsCard label="已完成" :value="completedCount" :sublabel="targetLabel" />
      <StatsCard label="进行中" :value="inProgressCount" />
      <StatsCard label="总进度" :value="`${totalProgress}%`" />
    </div>
    
    <div v-if="activeProject" class="header-project-actions">
      <button class="btn btn-secondary btn-small" @click="openProjectSettings">⚙️ 项目设置</button>
    </div>
    
    <!-- 项目设置模态框 -->
    <div v-if="showProjectSettingsModal" class="modal" style="display: flex">
      <div class="modal-content">
        <span class="close" @click="showProjectSettingsModal = false">&times;</span>
        <h2>项目设置</h2>
        <form @submit.prevent="saveProjectSettings">
          <div class="form-group">
            <label>项目开始日期：</label>
            <input v-model="projectSettingsForm.startDate" type="date" required />
          </div>
          <div class="form-group">
            <label>截止日期（可选）：</label>
            <input v-model="projectSettingsForm.deadline" type="date" />
          </div>
          <div class="form-group">
            <label>每日工作时长（小时）</label>
            <input v-model.number="projectSettingsForm.dailyHours" type="number" min="0.5" max="12" step="0.5" />
            <small>用于制作的时间</small>
          </div>
          <div class="form-group">
            <label>目标作品数（可选）</label>
            <input v-model.number="projectSettingsForm.targetCount" type="number" min="1" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" class="btn btn-secondary" @click="showProjectSettingsModal = false">取消</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 项目创建模态框 -->
    <ProjectModal 
      v-if="showProjectModal"
      @close="showProjectModal = false"
      @save="handleCreateProject"
    />
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTracksStore } from '@/stores/tracks'
import { useProjectsStore } from '@/stores/projects'
import { useWorkspacesStore } from '@/stores/workspaces'
import { useDataExport } from '@/composables/useDataExport'
import StatsCard from './StatsCard.vue'
import UserMenu from '../Auth/UserMenu.vue'
import WorkspaceSelector from '../Workspace/WorkspaceSelector.vue'
import ProjectSelector from '../Project/ProjectSelector.vue'
import ProjectModal from '../Project/ProjectModal.vue'

const emit = defineEmits(['showLogin'])

const tracksStore = useTracksStore()
const projectsStore = useProjectsStore()
const workspacesStore = useWorkspacesStore()
const { downloadExport, uploadImport } = useDataExport()

const { completedCount, inProgressCount, totalProgress } = storeToRefs(tracksStore)
const { activeProject } = storeToRefs(projectsStore)

const showProjectSettingsModal = ref(false)
const showProjectModal = ref(false)
const projectSettingsForm = ref({
  startDate: '',
  deadline: '',
  dailyHours: 2,
  targetCount: null
})

const remainingDays = computed(() => {
  if (!activeProject.value?.deadline) return null
  const deadline = new Date(activeProject.value.deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
  return diff
})

const targetLabel = computed(() => {
  if (activeProject.value?.targetCount) {
    return `/ ${activeProject.value.targetCount} 首`
  }
  return ''
})

function openProjectSettings() {
  if (!activeProject.value) return
  
  projectSettingsForm.value = {
    startDate: activeProject.value.startDate ? new Date(activeProject.value.startDate).toISOString().split('T')[0] : '',
    deadline: activeProject.value.deadline ? new Date(activeProject.value.deadline).toISOString().split('T')[0] : '',
    dailyHours: activeProject.value.settings?.dailyHours || 2,
    targetCount: activeProject.value.targetCount || null
  }
  showProjectSettingsModal.value = true
}

function saveProjectSettings() {
  if (!activeProject.value) return
  
  projectsStore.updateProject(activeProject.value.id, {
    startDate: projectSettingsForm.value.startDate,
    deadline: projectSettingsForm.value.deadline || null,
    targetCount: projectSettingsForm.value.targetCount || null,
    settings: {
      ...activeProject.value.settings,
      dailyHours: projectSettingsForm.value.dailyHours
    }
  })
  
  showProjectSettingsModal.value = false
}

function handleCreateProject(data) {
  projectsStore.createProject(data)
  showProjectModal.value = false
}

function exportData() {
  downloadExport()
}

function importData() {
  uploadImport((result) => {
    if (result.success) {
      const messages = []
      if (result.workspaces > 0) messages.push(`${result.workspaces} 个工作区`)
      if (result.projects > 0) messages.push(`${result.projects} 个项目`)
      if (result.tracks > 0) messages.push(`${result.tracks} 个作品`)
      
      if (messages.length > 0) {
        alert(`✅ 成功导入：\n${messages.join('\n')}`)
        // 刷新页面以显示新数据
        window.location.reload()
      } else {
        alert('⚠️ 没有新数据需要导入（所有数据都是最新的）')
      }
    } else {
      alert(`❌ 导入失败：${result.error}`)
    }
  })
}
</script>

<style scoped>
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.brand-logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
  margin-left: -10px;
  margin-right: -10px;
}

.brand-logo {
  height: 70px;
  width: auto;
  object-fit: contain;
  display: block;
}

.header-brand h1 {
  font-size: 2em;
  margin: 0;
  color: #1a1a1a;
}

.header-brand {
  position: relative;
}

.header-brand .header-tagline {
  font-size: 0.85em;
  color: #666;
  margin: 4px 0 0 -2px;
}

.header-stats {
  margin-left: -2px;
}

.header-navigation {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-project-actions {
  margin-top: 12px;
  margin-left: -12px;
  display: flex;
  gap: 10px;
}

.data-management {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-left: 10px;
  border-left: 1px solid #e0e0e0;
}

.btn-link {
  background: none;
  border: none;
  padding: 4px 8px;
  font-size: 0.85em;
  color: #999;
  cursor: pointer;
  transition: color 0.2s ease;
  opacity: 0.6;
}

.btn-link:hover {
  color: #666;
  opacity: 0.8;
}

.btn-link:active {
  opacity: 1;
}

@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .brand-logo {
    height: 56px;
  }
  
  .header-brand h1 {
    font-size: 1.5em;
  }
  
  .header-navigation {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .data-management {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
  }
}
</style>

