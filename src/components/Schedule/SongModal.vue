<template>
  <div class="modal" style="display: flex">
    <div class="modal-content">
      <span class="close" @click="$emit('close')">&times;</span>
      <h2>{{ song ? '编辑歌曲' : '添加新歌' }}</h2>
      
      <form @submit.prevent="handleSave">
        <div class="form-group">
          <label>歌曲名称</label>
          <input v-model="formData.name" type="text" required />
        </div>
        
        <div class="form-group">
          <label>子曲风</label>
          <input v-model="formData.genre" type="text" placeholder="例如：Future Bass, Deep House" />
          <small>建议：90%精力用于制作你当下正喜欢的曲风</small>
        </div>
        
        <div class="form-group">
          <label>预计有效时长（小时）</label>
          <input v-model.number="formData.estimatedHours" type="number" min="20" max="60" step="1" />
        </div>
        
        <div class="form-group">
          <label>
            <input v-model="formData.isNewGenre" type="checkbox" />
            是否为新曲风
          </label>
          <small>新曲风需要至少一周前期准备</small>
        </div>
        
        <div class="form-group">
          <label>当前阶段</label>
          <select v-model="formData.currentStage">
            <option value="曲风研究">曲风研究</option>
            <option value="Demo制作">Demo制作</option>
            <option value="编曲">编曲</option>
            <option value="混音母带">混音母带</option>
            <option value="队长审核">队长审核</option>
            <option value="校长审核">校长审核</option>
            <option value="已完成">已完成</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>任务进度</label>
          <div class="task-checklist">
            <label v-for="(task, index) in TASKS" :key="index">
              <input v-model="formData.tasks[index]" type="checkbox" />
              {{ task }}
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="formData.notes" rows="3"></textarea>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">保存</button>
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { TASKS } from '@/utils/constants'

const props = defineProps({
  song: Object
})

const emit = defineEmits(['close', 'save'])

const formData = ref({
  name: '',
  genre: '',
  estimatedHours: 40,
  isNewGenre: false,
  currentStage: '曲风研究',
  tasks: new Array(TASKS.length).fill(false),
  timeSpent: 0,
  notes: ''
})

// 如果是编辑模式，填充表单
watch(() => props.song, (song) => {
  if (song) {
    formData.value = {
      name: song.name,
      genre: song.genre || '',
      estimatedHours: song.estimatedHours || 40,
      isNewGenre: song.isNewGenre || false,
      currentStage: song.currentStage || '曲风研究',
      tasks: [...(song.tasks || new Array(TASKS.length).fill(false))],
      timeSpent: song.timeSpent || 0,
      notes: song.notes || ''
    }
  }
}, { immediate: true })

function handleSave() {
  emit('save', formData.value)
}
</script>

