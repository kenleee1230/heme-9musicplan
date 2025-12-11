<template>
  <div class="project-selector">
    <button class="project-button" @click="showDropdown = !showDropdown">
      <span class="project-icon">📂</span>
      <span class="project-name">{{ activeProject?.name || '选择项目' }}</span>
      <span class="dropdown-arrow">{{ showDropdown ? '▲' : '▼' }}</span>
    </button>
    
    <div v-if="showDropdown" class="project-dropdown">
      <div class="project-list">
        <div 
          v-for="project in workspaceProjects" 
          :key="project.id"
          :class="['project-item', { active: project.id === activeProjectId }]"
          @click="selectProject(project.id)"
        >
          <span class="project-icon-small">{{ getProjectIcon(project.type) }}</span>
          <div class="project-info">
            <div class="project-name">{{ project.name }}</div>
            <div class="project-meta">{{ getProjectMeta(project) }}</div>
          </div>
          <div class="project-actions-inline">
            <span v-if="project.id === activeProjectId" class="check-icon">✓</span>
            <button 
              class="btn-delete-project" 
              @click.stop="deleteProject(project)"
              title="删除项目"
            >
              ×
            </button>
          </div>
        </div>
        
        <div v-if="workspaceProjects.length === 0" class="empty-state">
          暂无项目
        </div>
      </div>
      
      <div class="project-actions">
        <button class="btn btn-small btn-primary" @click="emit('createProject')">
          + 新建项目
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/projects'
import { useTracksStore } from '@/stores/tracks'

const emit = defineEmits(['createProject'])

const projectsStore = useProjectsStore()
const tracksStore = useTracksStore()
const { activeProject, activeProjectId, workspaceProjects } = storeToRefs(projectsStore)

const showDropdown = ref(false)

function selectProject(id) {
  projectsStore.setActiveProject(id)
  showDropdown.value = false
}

function deleteProject(project) {
  const trackCount = tracksStore.getTracksByProject(project.id).length
  const message = trackCount > 0 
    ? `确定要删除项目"${project.name}"吗？\n\n项目下有 ${trackCount} 个作品，也会一起被删除！`
    : `确定要删除项目"${project.name}"吗？`
  
  if (confirm(message)) {
    // 先删除项目下的所有作品
    tracksStore.deleteTracksByProject(project.id)
    // 再删除项目
    projectsStore.deleteProject(project.id)
  }
}

function getProjectIcon(type) {
  const icons = {
    album: '💽',
    ep: '💿',
    single: '🎵',
    mixing: '🎚️',
    custom: '📁'
  }
  return icons[type] || '📁'
}

function getProjectMeta(project) {
  const parts = []
  if (project.targetCount) {
    parts.push(`${project.targetCount} 首`)
  }
  if (project.deadline) {
    const deadline = new Date(project.deadline)
    const days = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
    if (days > 0) {
      parts.push(`剩余 ${days} 天`)
    } else if (days === 0) {
      parts.push('今天截止')
    } else {
      parts.push('已逾期')
    }
  }
  return parts.join(' · ')
}

// 点击外部关闭下拉菜单
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.project-selector')) {
      showDropdown.value = false
    }
  })
}
</script>

<style scoped>
.project-selector {
  position: relative;
  display: inline-block;
}

.project-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95em;
}

.project-button:hover {
  background: #f8f9fa;
  border-color: #ccc;
}

.project-icon {
  font-size: 1.1em;
}

.project-name {
  font-weight: 500;
  color: #333;
}

.dropdown-arrow {
  font-size: 0.7em;
  color: #666;
}

.project-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 300px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.project-list {
  max-height: 350px;
  overflow-y: auto;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.project-item:hover {
  background: #f8f9fa;
}

.project-item.active {
  background: #e8f5e9;
}

.project-icon-small {
  font-size: 1.3em;
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-item .project-name {
  font-size: 0.95em;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.project-meta {
  font-size: 0.8em;
  color: #666;
}

.project-actions-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-icon {
  color: #4caf50;
  font-weight: bold;
}

.btn-delete-project {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5em;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  opacity: 0;
  transition: all 0.2s ease;
}

.project-item:hover .btn-delete-project {
  opacity: 1;
}

.btn-delete-project:hover {
  color: #f44336;
  transform: scale(1.2);
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: #999;
  font-size: 0.9em;
}

.project-actions {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.project-actions .btn {
  width: 100%;
}

@media (max-width: 768px) {
  .project-dropdown {
    min-width: 250px;
  }
}
</style>

