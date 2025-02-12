<script setup lang="ts">
import { AudioTestService } from '@/services/audio-test.service.ts'
import { reactive } from 'vue'

const state = reactive({
  musicPlaying: false,
})

const runMusic = async () => {
  state.musicPlaying = true
  try {
    await AudioTestService.runMusic()
  } finally {
    state.musicPlaying = false
  }
}

const playRubberChicken = () => {
  AudioTestService.playRubberChicken()
}
</script>

<template>
  <button v-if="!state.musicPlaying" @click="runMusic">Start Music</button>
  <button @click="playRubberChicken">Rubber Chicken</button>
</template>

<style scoped>
button {
  font-size: 2rem;
}
</style>
