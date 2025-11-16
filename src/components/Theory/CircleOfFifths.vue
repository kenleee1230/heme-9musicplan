<template>
  <section class="circle-of-fifths-section">
    <div class="section-header">
      <h2>🎼 五度圈</h2>
      <p style="font-size: 14px; color: #666; margin-top: 8px;">
        外圈为大调，内圈为对应关系小调（共享相同调号）
      </p>
    </div>
    <div class="circle-of-fifths-container">
      <svg class="circle-of-fifths-svg" viewBox="0 0 800 800">
        <!-- 外圈 - 大调 -->
        <g v-for="(key, index) in CIRCLE_OF_FIFTHS" :key="`major-${index}`">
          <path
            :d="createSectorPath(400, 400, 250, 350, getAngle(index), getAngle(index + 1))"
            :fill="hoveredKey === key.major ? '#1a1a1a' : '#ffffff'"
            stroke="#1a1a1a"
            stroke-width="2"
            @mouseenter="hoveredKey = key.major"
            @mouseleave="hoveredKey = null"
            @click="playKeyChord(key.major, true)"
            style="cursor: pointer"
          />
          <text
            :x="getTextX(300, index)"
            :y="getTextY(300, index)"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="24"
            font-weight="600"
            :fill="hoveredKey === key.major ? '#ffffff' : '#1a1a1a'"
            pointer-events="none"
          >
            {{ key.major }}
          </text>
        </g>
        
        <!-- 内圈 - 小调 -->
        <g v-for="(key, index) in CIRCLE_OF_FIFTHS" :key="`minor-${index}`">
          <path
            :d="createSectorPath(400, 400, 150, 250, getAngle(index), getAngle(index + 1))"
            :fill="hoveredKey === key.minor ? '#1a1a1a' : '#f5f5f5'"
            stroke="#1a1a1a"
            stroke-width="2"
            @mouseenter="hoveredKey = key.minor"
            @mouseleave="hoveredKey = null"
            @click="playKeyChord(key.minor.replace('m', ''), false)"
            style="cursor: pointer"
          />
          <text
            :x="getTextX(200, index)"
            :y="getTextY(200, index)"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="20"
            :fill="hoveredKey === key.minor ? '#ffffff' : '#666'"
            pointer-events="none"
          >
            {{ key.minor }}
          </text>
        </g>
        
        <!-- 中心文字 -->
        <text x="400" y="400" text-anchor="middle" font-size="18" fill="#666">
          点击播放
        </text>
      </svg>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { CIRCLE_OF_FIFTHS } from '@/utils/constants'
import { useChords } from '@/composables/useChords'

const { playChord } = useChords()
const hoveredKey = ref(null)

function getAngle(index) {
  return (index * 30 - 90) * (Math.PI / 180)
}

function getTextX(radius, index) {
  const angle = getAngle(index) + (15 * Math.PI / 180)
  return 400 + radius * Math.cos(angle)
}

function getTextY(radius, index) {
  const angle = getAngle(index) + (15 * Math.PI / 180)
  return 400 + radius * Math.sin(angle)
}

function createSectorPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  const x1 = cx + outerR * Math.cos(startAngle)
  const y1 = cy + outerR * Math.sin(startAngle)
  const x2 = cx + outerR * Math.cos(endAngle)
  const y2 = cy + outerR * Math.sin(endAngle)
  const x3 = cx + innerR * Math.cos(endAngle)
  const y3 = cy + innerR * Math.sin(endAngle)
  const x4 = cx + innerR * Math.cos(startAngle)
  const y4 = cy + innerR * Math.sin(startAngle)
  
  return `
    M ${x1} ${y1}
    A ${outerR} ${outerR} 0 0 1 ${x2} ${y2}
    L ${x3} ${y3}
    A ${innerR} ${innerR} 0 0 0 ${x4} ${y4}
    Z
  `
}

function playKeyChord(note, isMajor) {
  const chordType = isMajor ? 'major' : 'minor'
  playChord(note, chordType)
}
</script>

<style scoped>
.circle-of-fifths-section {
  background: white;
  padding: 30px;
  border-radius: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
  margin-bottom: 30px;
}

.circle-of-fifths-section :deep(.section-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.circle-of-fifths-section :deep(.section-header h2) {
  font-family: 'Smiley Sans', 'Noto Sans SC', sans-serif;
  font-size: 1.8em;
  color: #333;
  font-weight: normal;
  letter-spacing: 0.02em;
}

.circle-of-fifths-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  min-height: 600px;
  width: 100%;
}

.circle-of-fifths-svg {
  width: 100%;
  max-width: 800px;
  height: auto;
}

@media (max-width: 768px) {
  .circle-of-fifths-container {
    padding: 20px;
    min-height: 400px;
  }
}
</style>

