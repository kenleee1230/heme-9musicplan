<template>
  <div class="workspace-selector">
    <button class="workspace-button" @click="showDropdown = !showDropdown">
      <span class="workspace-icon">📁</span>
      <span class="workspace-name">{{ activeWorkspace?.name || '选择工作区' }}</span>
      <span class="dropdown-arrow">{{ showDropdown ? '▲' : '▼' }}</span>
    </button>
    
    <div v-if="showDropdown" class="workspace-dropdown">
      <div class="workspace-list">
        <div 
          v-for="workspace in sortedWorkspaces" 
          :key="workspace.id"
          :class="['workspace-item', { active: workspace.id === activeWorkspaceId }]"
          @click="selectWorkspace(workspace.id)"
        >
          <span class="workspace-color" :style="{ backgroundColor: workspace.color }"></span>
          <span class="workspace-name">{{ workspace.name }}</span>
          <div class="workspace-actions-inline">
            <span v-if="workspace.id === activeWorkspaceId" class="check-icon">✓</span>
            <button 
              v-if="sortedWorkspaces.length > 1"
              class="btn-delete-workspace" 
              @click.stop="deleteWorkspace(workspace)"
              title="删除工作区"
            >
              ×
            </button>
          </div>
        </div>
      </div>
      
      <div class="workspace-actions">
        <button class="btn btn-small btn-primary" @click="createNewWorkspace">
          + 新建工作区
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkspacesStore } from '@/stores/workspaces'
import { useProjectsStore } from '@/stores/projects'
import { useTracksStore } from '@/stores/tracks'

const workspacesStore = useWorkspacesStore()
const projectsStore = useProjectsStore()
const tracksStore = useTracksStore()
const { activeWorkspace, activeWorkspaceId, sortedWorkspaces } = storeToRefs(workspacesStore)

const showDropdown = ref(false)

function selectWorkspace(id) {
  workspacesStore.setActiveWorkspace(id)
  showDropdown.value = false
}

function createNewWorkspace() {
  const name = prompt('工作区名称:')
  if (name) {
    const workspace = workspacesStore.createWorkspace({ name })
    workspacesStore.setActiveWorkspace(workspace.id)
  }
  showDropdown.value = false
}

function deleteWorkspace(workspace) {
  if (sortedWorkspaces.value.length <= 1) {
    alert('至少需要保留一个工作区')
    return
  }
  
  // 统计工作区下的项目和作品数量
  const projects = projectsStore.getProjectsByWorkspace(workspace.id)
  let totalTracks = 0
  projects.forEach(project => {
    totalTracks += tracksStore.getTracksByProject(project.id).length
  })
  
  const message = projects.length > 0
    ? `确定要删除工作区"${workspace.name}"吗？\n\n工作区下有 ${projects.length} 个项目，共 ${totalTracks} 个作品，都会被删除！`
    : `确定要删除工作区"${workspace.name}"吗？`
  
  if (confirm(message)) {
    // 删除工作区下的所有项目（会级联删除作品）
    projectsStore.deleteProjectsByWorkspaceId(workspace.id)
    // 再删除工作区
    workspacesStore.deleteWorkspace(workspace.id)
  }
}

// 点击外部关闭下拉菜单
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.workspace-selector')) {
      showDropdown.value = false
    }
  })
}
</script>

<style scoped>
.workspace-selector {
  position: relative;
  display: inline-block;
}

.workspace-button {
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

.workspace-button:hover {
  background: #f8f9fa;
  border-color: #ccc;
}

.workspace-icon {
  font-size: 1.1em;
}

.workspace-name {
  font-weight: 500;
  color: #333;
}

.dropdown-arrow {
  font-size: 0.7em;
  color: #666;
}

.workspace-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 250px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.workspace-list {
  max-height: 300px;
  overflow-y: auto;
}

.workspace-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.workspace-item:hover {
  background: #f8f9fa;
}

.workspace-item.active {
  background: #e8f5e9;
}

.workspace-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.workspace-item .workspace-name {
  flex: 1;
  font-size: 0.95em;
}

.workspace-actions-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-icon {
  color: #4caf50;
  font-weight: bold;
}

.btn-delete-workspace {
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

.workspace-item:hover .btn-delete-workspace {
  opacity: 1;
}

.btn-delete-workspace:hover {
  color: #f44336;
  transform: scale(1.2);
}

.workspace-actions {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.workspace-actions .btn {
  width: 100%;
}

@media (max-width: 768px) {
  .workspace-dropdown {
    min-width: 200px;
  }
}
</style>

