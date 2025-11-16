<template>
  <section class="chord-progressions-section">
    <div class="section-header">
      <h2>🎹 常见和弦级数套路</h2>
      <div>
        <label style="margin-right: 10px;">调性：</label>
        <select v-model="selectedKey" class="key-selector">
          <option v-for="key in keys" :key="key" :value="key">{{ key }}</option>
        </select>
      </div>
    </div>
    
    <div class="chord-progressions-list">
      <div v-for="progression in progressionsForKey" :key="progression.name" class="progression-card">
        <div class="progression-name">{{ progression.name }}</div>
        <div class="progression-degrees">{{ progression.degrees }}</div>
        <div class="progression-chords">
          <span v-for="(chord, index) in progression.chords.split(' - ')" :key="index" class="chord-badge">
            {{ chord }}
          </span>
        </div>
        <div class="progression-description">{{ progression.description }}</div>
        <button class="btn btn-small" @click="playProgression(progression.degrees)" style="margin-top: 10px;">
          播放
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CHORD_DEGREES } from '@/utils/constants'
import { useChords } from '@/composables/useChords'

const { playChordProgression, getChordProgressionsForKey } = useChords()

const keys = Object.keys(CHORD_DEGREES)
const selectedKey = ref('C')

const progressionsForKey = computed(() => {
  return getChordProgressionsForKey(selectedKey.value)
})

function playProgression(degrees) {
  playChordProgression(selectedKey.value, degrees)
}
</script>

<style scoped>
.chord-progressions-section {
  background: white;
  padding: 30px;
  border-radius: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
  margin-bottom: 30px;
}

.chord-progressions-section :deep(.section-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chord-progressions-section :deep(.section-header h2) {
  font-family: 'Smiley Sans', 'Noto Sans SC', sans-serif;
  font-size: 1.8em;
  color: #333;
  font-weight: normal;
  letter-spacing: 0.02em;
}

.chord-progressions-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.progression-card {
  background: white;
  border-radius: 0;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-left: 2px solid #1a1a1a;
}

.progression-name {
  font-family: 'Smiley Sans', 'Noto Sans SC', sans-serif;
  font-size: 1.2em;
  font-weight: normal;
  color: #1a1a1a;
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}

.progression-degrees {
  font-size: 1.1em;
  color: #666;
  margin-bottom: 15px;
  font-family: 'Courier New', monospace;
}

.progression-chords {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.chord-badge {
  background: #1a1a1a;
  color: white;
  padding: 8px 16px;
  border-radius: 0;
  font-weight: 400;
  font-size: 1em;
  border: 1px solid #1a1a1a;
}

.progression-description {
  font-size: 0.9em;
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .chord-progressions-list {
    grid-template-columns: 1fr;
  }
}
</style>

