<template>
  <div class="tab-navigation">
    <button 
      class="tab-btn" 
      :class="{ active: modelValue === 'schedule' }"
      @click="$emit('update:modelValue', 'schedule')"
    >
      📅 日程规划
    </button>
    <button 
      class="tab-btn" 
      :class="{ active: modelValue === 'theory' }"
      @click="$emit('update:modelValue', 'theory')"
    >
      🎵 音乐理论
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String
})

defineEmits(['update:modelValue'])
</script>

