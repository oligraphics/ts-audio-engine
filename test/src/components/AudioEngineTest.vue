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
</template>

<style scoped>
button {
  font-size: 2rem;
}
</style>
