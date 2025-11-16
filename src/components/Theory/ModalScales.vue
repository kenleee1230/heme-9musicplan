<template>
  <section class="modal-scales-section">
    <div class="section-header">
      <h2>🎶 中古调式构成音速查</h2>
      <div class="modal-scale-selector">
        <label style="margin-right: 10px;">根音：</label>
        <select v-model="selectedRootNote" class="key-selector">
          <option v-for="note in rootNotes" :key="note" :value="note">{{ note }}</option>
        </select>
      </div>
    </div>
    
    <div class="modal-scales-list">
      <div 
        v-for="(scale, mode) in MODAL_SCALES" 
        :key="mode"
        class="modal-scale-card"
      >
        <div class="scale-header">
          <div class="scale-name">{{ scale.name }}</div>
          <button class="btn btn-small" @click="playScale(mode)">
            播放音阶
          </button>
        </div>
        <div class="scale-description">{{ scale.description }}</div>
        <div class="scale-notes">
          <div class="scale-notes-label">构成音：</div>
          <div class="scale-notes-list">
            <span 
              v-for="(note, index) in getScaleNotes(mode)" 
              :key="index"
              :class="['scale-note', { 'playing': playingInfo[mode] && playingInfo[mode].currentIndex === index }]"
            >
              {{ note }}
            </span>
          </div>
        </div>
        <div class="scale-intervals">
          音程关系: {{ getIntervalsString(mode) }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { MODAL_SCALES } from '@/utils/constants'
import { useChords } from '@/composables/useChords'

const { playModalScale } = useChords()

const selectedRootNote = ref('C')
const playingInfo = ref({})

const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function getScaleNotes(mode) {
  const scale = MODAL_SCALES[mode]
  if (!scale) return []
  
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  // 标准化根音（将降号转换为升号）
  let normalizedNote = selectedRootNote.value
  const flatToSharp = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  }
  if (flatToSharp[selectedRootNote.value]) {
    normalizedNote = flatToSharp[selectedRootNote.value]
  }
  
  const rootIndex = notes.indexOf(normalizedNote)
  if (rootIndex === -1) return []
  
  return scale.intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12
    return notes[noteIndex]
  })
}

function getIntervalsString(mode) {
  const notes = getScaleNotes(mode)
  if (notes.length === 0) return ''
  
  const intervals = []
  for (let i = 1; i < notes.length; i++) {
    const prevNote = notes[i - 1]
    const currentNote = notes[i]
    const interval = getInterval(prevNote, currentNote)
    intervals.push(`${interval}st`)
  }
  
  return `0st, ${intervals.join(', ')}`
}

function getInterval(note1, note2) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  const flatToSharp = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  }
  
  let normalizedNote1 = flatToSharp[note1] || note1
  let normalizedNote2 = flatToSharp[note2] || note2
  
  const note1Index = notes.indexOf(normalizedNote1)
  const note2Index = notes.indexOf(normalizedNote2)
  
  if (note1Index === -1 || note2Index === -1) return 0
  return (note2Index - note1Index + 12) % 12
}

function playScale(mode) {
  const scale = MODAL_SCALES[mode]
  if (!scale) return
  
  // 计算要播放的音符
  const notes = getScaleNotes(mode)
  
  // 显示播放信息
  playingInfo.value[mode] = {
    rootNote: selectedRootNote.value,
    intervals: scale.intervals,
    notes: notes,
    currentIndex: -1
  }
  
  // 播放调式音阶（依次播放每个音）
  playModalScale(selectedRootNote.value, scale.intervals, 120, (currentIndex) => {
    // 更新当前播放的音符索引
    if (playingInfo.value[mode]) {
      playingInfo.value[mode].currentIndex = currentIndex
    }
  })
  
  // 播放结束后清除高亮
  setTimeout(() => {
    if (playingInfo.value[mode]) {
      playingInfo.value[mode].currentIndex = -1
    }
  }, notes.length * 250 + 500)
}
</script>

<style scoped>
.modal-scales-section {
  background: white;
  padding: 30px;
  border-radius: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
  margin-bottom: 30px;
}

.modal-scales-section :deep(.section-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.modal-scales-section :deep(.section-header h2) {
  font-family: 'Smiley Sans', 'Noto Sans SC', sans-serif;
  font-size: 1.8em;
  color: #333;
  font-weight: normal;
  letter-spacing: 0.02em;
  margin: 0;
}

.modal-scale-selector {
  display: flex;
  align-items: center;
  margin-top: 15px;
}

.modal-scales-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.modal-scale-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.scale-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.scale-name {
  font-size: 1.2em;
  font-weight: 600;
  color: #1a1a1a;
}

.scale-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
  font-size: 0.9em;
}

.scale-notes {
  margin-bottom: 10px;
}

.scale-notes-label {
  font-size: 0.9em;
  color: #999;
  margin-bottom: 8px;
}

.scale-notes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.scale-note {
  background: white;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.95em;
  transition: all 0.2s ease;
}

.scale-note.playing {
  background: #1a1a1a;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border-color: #1a1a1a;
}

.scale-intervals {
  font-size: 0.85em;
  color: #999;
  font-family: monospace;
}

@media (max-width: 768px) {
  .modal-scales-list {
    grid-template-columns: 1fr;
  }
  
  .scale-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>

