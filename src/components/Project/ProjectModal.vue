<template>
  <div class="modal" style="display: flex">
    <div class="modal-content project-modal-content">
      <div class="modal-header">
        <h2>{{ project ? '编辑项目' : '创建新项目' }}</h2>
        <span class="close" @click="$emit('close')">&times;</span>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSave">
          <!-- 选择模板 (仅新建时) -->
          <div v-if="!project" class="form-group">
            <label>选择模板</label>
            <div class="template-grid">
              <div 
                v-for="template in templates" 
                :key="template.id"
                :class="['template-card', { selected: selectedTemplateId === template.id }]"
                @click="selectTemplate(template.id)"
              >
                <div class="template-icon">{{ template.icon }}</div>
                <div class="template-name">{{ template.name }}</div>
                <div class="template-description">{{ template.description }}</div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>项目名称</label>
            <input v-model="formData.name" type="text" required />
          </div>
          
          <div class="form-group">
            <label>项目描述</label>
            <textarea v-model="formData.description" rows="3"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>开始日期</label>
              <input v-model="formData.startDate" type="date" required />
            </div>
            
            <div class="form-group">
              <label>截止日期（可选）</label>
              <input v-model="formData.deadline" type="date" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>目标作品数（可选）</label>
              <input v-model.number="formData.targetCount" type="number" min="1" />
            </div>
            
            <div class="form-group">
              <label>每日工作时长（小时）</label>
              <input v-model.number="formData.dailyHours" type="number" min="0.5" max="12" step="0.5" />
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="formData.autoSchedule" type="checkbox" />
              <span>自动日程规划</span>
            </label>
            <small>根据目标和时间自动生成每日任务计划</small>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" @click="handleSave">保存</button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplatesStore } from '@/stores/templates'

const props = defineProps({
  project: Object
})

const emit = defineEmits(['close', 'save'])

const templatesStore = useTemplatesStore()
const { templates } = storeToRefs(templatesStore)

const selectedTemplateId = ref(null)

const formData = ref({
  name: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  deadline: '',
  targetCount: null,
  dailyHours: 2,
  autoSchedule: true
})

// 如果是编辑模式，填充表单
watch(() => props.project, (project) => {
  if (project) {
    formData.value = {
      name: project.name,
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
      targetCount: project.targetCount || null,
      dailyHours: project.settings?.dailyHours || 2,
      autoSchedule: project.settings?.autoSchedule !== false
    }
  }
}, { immediate: true })

function selectTemplate(templateId) {
  selectedTemplateId.value = templateId
  const template = templates.value.find(t => t.id === templateId)
  if (template) {
    formData.value.name = template.defaultName
    formData.value.targetCount = template.defaultTargetCount
    formData.value.dailyHours = template.defaultDailyHours
    formData.value.autoSchedule = template.autoSchedule
    
    // 计算截止日期
    if (template.defaultDuration) {
      const deadline = new Date(formData.value.startDate)
      deadline.setDate(deadline.getDate() + template.defaultDuration)
      formData.value.deadline = deadline.toISOString().split('T')[0]
    }
  }
}

function handleSave() {
  const data = {
    ...formData.value,
    templateId: selectedTemplateId.value,
    settings: {
      dailyHours: formData.value.dailyHours,
      autoSchedule: formData.value.autoSchedule
    }
  }
  
  emit('save', data)
}
</script>

<style scoped>
.project-modal-content {
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-body {
  padding: 20px 30px;
  overflow-y: auto;
  flex: 1;
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-footer {
  padding: 15px 30px;
  border-top: 1px solid #e0e0e0;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.template-card {
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.template-card:hover {
  border-color: #ccc;
  background: #f8f9fa;
}

.template-card.selected {
  border-color: #1a1a1a;
  background: #f0f0f0;
}

.template-icon {
  font-size: 2em;
  margin-bottom: 8px;
}

.template-name {
  font-weight: 600;
  font-size: 0.9em;
  margin-bottom: 4px;
  color: #333;
}

.template-description {
  font-size: 0.75em;
  color: #666;
  line-height: 1.4;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

@media (max-width: 768px) {
  .project-modal-content {
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 15px 20px;
  }
  
  .modal-header {
    padding: 15px 20px;
  }
  
  .modal-footer {
    padding: 12px 20px;
  }
  
  .template-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

