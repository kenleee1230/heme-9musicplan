<template>
  <section class="chord-reference-section">
    <div class="section-header">
      <h2>📚 和弦知识速查</h2>
    </div>
    
    <div class="chord-reference-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['chord-ref-tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>
    
    <!-- 基础和弦类型 -->
    <div v-show="activeTab === 'types'" class="chord-ref-content active">
      <div class="chord-types-list">
        <div 
          v-for="(chord, type) in CHORD_TYPES" 
          :key="type"
          class="chord-type-card"
        >
          <div class="chord-type-name">{{ chord.name }}</div>
          <div class="chord-type-description">{{ chord.description }}</div>
          <div class="chord-type-intervals">
            音程: {{ formatIntervals(chord.intervals) }}
          </div>
          <button class="btn btn-small" @click="playChordType(type)">
            播放示例
          </button>
        </div>
      </div>
    </div>
    
    <!-- 各调和弦级数表 -->
    <div v-show="activeTab === 'degrees'" class="chord-ref-content">
      <div class="key-selector-container">
        <label for="degreeKey">选择调性：</label>
        <select id="degreeKey" v-model="selectedKey" class="key-selector">
          <option v-for="key in keys" :key="key" :value="key">{{ key }}</option>
        </select>
      </div>
      <div v-if="Object.keys(chordDegreesForKey).length === 0" class="empty-state">
        暂无数据
      </div>
      <div v-else class="chord-degrees-table">
        <table>
          <thead>
            <tr>
              <th>级数</th>
              <th>和弦</th>
              <th>类型</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(chord, degree) in chordDegreesForKey" :key="degree">
              <td>{{ degree }}</td>
              <td>{{ chord }}</td>
              <td>{{ getChordType(chord) }}</td>
              <td>
                <button class="btn btn-small" @click="playChordFromName(chord)">
                  播放
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 和弦进行示例 -->
    <div v-show="activeTab === 'examples'" class="chord-ref-content">
      <div v-if="!COMMON_PROGRESSIONS || COMMON_PROGRESSIONS.length === 0" class="empty-state">
        暂无数据
      </div>
      <div v-else class="chord-examples-list">
        <div 
          v-for="progression in COMMON_PROGRESSIONS" 
          :key="progression.name"
          class="progression-card"
        >
          <div class="progression-name">{{ progression.name }}</div>
          <div class="progression-degrees">{{ progression.degrees }}</div>
          <div class="progression-description">{{ progression.description }}</div>
          <button class="btn btn-small" @click="playProgression(progression.degrees)">
            播放
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CHORD_TYPES, CHORD_DEGREES, COMMON_PROGRESSIONS } from '@/utils/constants'
import { useChords } from '@/composables/useChords'

const { playChord, playChordProgression } = useChords()

const activeTab = ref('types')
const selectedKey = ref('C')

const tabs = [
  { id: 'types', name: '基础和弦类型' },
  { id: 'degrees', name: '各调和弦级数表' },
  { id: 'examples', name: '和弦进行示例' }
]

const keys = Object.keys(CHORD_DEGREES)

const chordDegreesForKey = computed(() => {
  return CHORD_DEGREES[selectedKey.value] || {}
})

function formatIntervals(intervals) {
  return intervals.map(i => `${i}st`).join(', ')
}

function getChordType(chordName) {
  if (chordName.includes('dim')) return '减三和弦'
  if (chordName.includes('m')) return '小三和弦'
  return '大三和弦'
}

function playChordType(type) {
  // 播放C调的和弦作为示例
  playChord('C', type)
}

function playChordFromName(chordName) {
  // 提取根音和类型
  const root = chordName.replace(/m|dim|°|aug/g, '').trim()
  let type = 'major'
  
  if (chordName.includes('dim') || chordName.includes('°')) {
    type = 'diminished'
  } else if (chordName.includes('m')) {
    type = 'minor'
  }
  
  playChord(root, type)
}

function playProgression(degrees) {
  playChordProgression(selectedKey.value, degrees)
}
</script>

<style scoped>
.chord-reference-section {
  background: white;
  padding: 30px;
  border-radius: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
  margin-bottom: 30px;
}

.chord-reference-section :deep(.section-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chord-reference-section :deep(.section-header h2) {
  font-family: 'Smiley Sans', 'Noto Sans SC', sans-serif;
  font-size: 1.8em;
  color: #333;
  font-weight: normal;
  letter-spacing: 0.02em;
}

.chord-reference-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.chord-ref-tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1em;
  color: #666;
  transition: all 0.3s ease;
}

.chord-ref-tab:hover {
  color: #1a1a1a;
  background: #f5f5f5;
}

.chord-ref-tab.active {
  color: #1a1a1a;
  border-bottom-color: #1a1a1a;
  font-weight: 600;
}

.chord-ref-content {
  padding: 20px 0;
  display: block;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 20px;
  font-size: 0.95em;
}

.chord-types-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.chord-type-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.chord-type-name {
  font-size: 1.2em;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.chord-type-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.chord-type-intervals {
  font-size: 0.9em;
  color: #999;
  margin-bottom: 15px;
}

.key-selector-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.key-selector-container label {
  font-weight: 600;
  color: #333;
}

.chord-degrees-table {
  overflow-x: auto;
}

.chord-degrees-table table {
  width: 100%;
  border-collapse: collapse;
}

.chord-degrees-table th,
.chord-degrees-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.chord-degrees-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #1a1a1a;
}

.chord-examples-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.progression-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.progression-name {
  font-size: 1.2em;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.progression-degrees {
  font-size: 1.1em;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 10px;
}

.progression-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .chord-types-list,
  .chord-examples-list {
    grid-template-columns: 1fr;
  }
  
  .chord-reference-tabs {
    flex-direction: column;
    gap: 0;
  }
  
  .chord-ref-tab {
    border-bottom: 1px solid #e0e0e0;
    border-left: 3px solid transparent;
  }
  
  .chord-ref-tab.active {
    border-left-color: #1a1a1a;
    border-bottom-color: #e0e0e0;
  }
  
  .chord-degrees-table {
    font-size: 0.9em;
  }
}
</style>

