<template>
  <div class="knowledge-section">
    <h2>💡 编曲/混音小知识</h2>
    <div class="knowledge-card">
      <div class="knowledge-content">
        <div class="knowledge-title">{{ currentKnowledge.title }}</div>
        <div class="knowledge-text">{{ currentKnowledge.content }}</div>
      </div>
      <button class="btn btn-small" @click="nextKnowledge" style="margin-top: 15px;">
        下一个知识点
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { KNOWLEDGE_BASE } from '@/utils/constants'

const currentIndex = ref(0)
const currentKnowledge = ref(KNOWLEDGE_BASE[0])

function nextKnowledge() {
  currentIndex.value = (currentIndex.value + 1) % KNOWLEDGE_BASE.length
  currentKnowledge.value = KNOWLEDGE_BASE[currentIndex.value]
}

function randomKnowledge() {
  currentIndex.value = Math.floor(Math.random() * KNOWLEDGE_BASE.length)
  currentKnowledge.value = KNOWLEDGE_BASE[currentIndex.value]
}

onMounted(() => {
  randomKnowledge()
})
</script>

