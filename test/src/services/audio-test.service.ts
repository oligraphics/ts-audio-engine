import { AudioEngine } from '../../../src'
import { TestAudioTypeEnum } from '@/enums/test-audio-type.enum.ts'
import { SingleTrackMixer } from '../../../src'

import RubberChicken from '@/assets/475732__dogwomble__rubber-chicken-3.wav'
import SuccessMusic from '@/assets/751134__audiocoffee__success-every-day-short-ver.wav'
import ElevatorMusic from '@/assets/467243__jay_you__music-elevator-ext-part-13.wav'
import { TestMusicTypeEnum } from '@/enums/test-music-type.enum.ts'

export const AudioTestService = new (class AudioTestService {
  readonly engine = new AudioEngine([
    {
      id: TestAudioTypeEnum.RUBBER_CHICKEN,
      url: RubberChicken,
      maxInstances: 2,
      randomize: {
        pitch: 0.1,
      },
    },
  ])

  readonly music = new SingleTrackMixer([
    {
      id: TestMusicTypeEnum.SUCCESS_MUSIC,
      url: SuccessMusic,
      maxInstances: 1,
      loop: true,
    },
    {
      id: TestMusicTypeEnum.ELEVATOR_MUSIC,
      url: ElevatorMusic,
      maxInstances: 1,
      loop: true,
    },
  ])

  constructor() {
    this.engine.debug = true
    this.music.debug = true
    this.music.start()
  }

  async playElevatorMusic() {
    this.music.play(TestMusicTypeEnum.ELEVATOR_MUSIC)
  }

  async playSuccessMusic() {
    this.music.play(TestMusicTypeEnum.SUCCESS_MUSIC)
  }

  async playEmpty() {
    this.music.playEmpty()
  }

  playRubberChicken() {
    this.engine.play(TestAudioTypeEnum.RUBBER_CHICKEN)
  }

  setMusicVolume(volume: number) {
    this.music.volume = volume
  }

  setEffectVolume(volume: number) {
    this.engine.volume = volume
  }
})()
