<script setup lang="ts">
import { AudioTestService } from '@/services/audio-test.service.ts'

const playRubberChicken = () => {
  AudioTestService.playRubberChicken()
}
</script>

<template>
  <section>
    <h1>Music</h1>
    <button @click="AudioTestService.playElevatorMusic()">Elevator Music</button>
    <button @click="AudioTestService.playSuccessMusic()">Success Music</button>
    <button @click="AudioTestService.playEmpty()">Silence</button>
  </section>
  <button @click="playRubberChicken">Rubber Chicken</button>
  <label
    ><span>Music Volume</span>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      @input="AudioTestService.setMusicVolume(parseFloat($event.target['value']))"
  /></label>
  <label
    ><span>Effect Volume</span>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      @input="AudioTestService.setEffectVolume(parseFloat($event.target['value']))"
  /></label>
</template>

<style scoped>
button {
  font-size: 2rem;
}
</style>
