<template>
  <div v-if="timer.isRunning" class="timer-floating">
    <div class="timer-header">
      <span>{{ timer.songName }}</span>
      <button class="timer-close" @click="stop">&times;</button>
    </div>
    <div class="timer-display">
      <div class="timer-time">{{ timerDisplay }}</div>
      <div class="timer-controls">
        <button v-if="!timer.isPaused" class="btn btn-small" @click="pause">暂停</button>
        <button v-else class="btn btn-small" @click="resume">继续</button>
        <button class="btn btn-small btn-delete" @click="stop">停止</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTimer } from '@/composables/useTimer'
import { useSongsStore } from '@/stores/songs'

const { timer, timerDisplay, pauseTimer, resumeTimer, stopTimer } = useTimer()
const songsStore = useSongsStore()

function pause() {
  pauseTimer()
}

function resume() {
  resumeTimer()
}

function stop() {
  if (confirm('确定要停止计时吗？')) {
    const result = stopTimer()
    if (result.songId && result.hours > 0) {
      // 更新歌曲的已用时长
      const song = songsStore.getSongById(result.songId)
      if (song) {
        songsStore.updateSong(result.songId, {
          timeSpent: (song.timeSpent || 0) + result.hours
        })
      }
    }
  }
}
</script>

