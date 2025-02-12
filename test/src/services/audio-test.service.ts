import AudioEngine from '../../../src/models/audio-engine.model.ts'
import { TestAudioTypeEnum } from '@/enums/test-audio-type.enum.ts'
import { AudioEventTypeEnum } from '../../../src/enums/audio-event-type.enum.ts'
import type { AudioEndedEventDto } from '../../../src/dto/events/audio-ended.event.dto.ts'

import RubberChicken from '@/assets/475732__dogwomble__rubber-chicken-3.wav'
import SuccessMusic from '@/assets/751134__audiocoffee__success-every-day-short-ver.wav'

export const AudioTestService = new (class AudioTestService {
  readonly engine = new AudioEngine([
    {
      id: TestAudioTypeEnum.RUBBER_CHICKEN,
      url: RubberChicken,
      maxInstances: 2,
    },
    {
      id: TestAudioTypeEnum.SUCCESS_MUSIC,
      url: SuccessMusic,
      maxInstances: 1,
    },
  ])

  constructor() {
    this.engine.debug = true
  }

  async runMusic() {
    this.engine.play(TestAudioTypeEnum.SUCCESS_MUSIC)

    await new Promise<void>((resolve) => {
      const doneListener = (event: AudioEndedEventDto) => {
        if (event.audio.typeId !== TestAudioTypeEnum.SUCCESS_MUSIC) {
          return
        }
        this.engine.bus.off(AudioEventTypeEnum.ENDED, doneListener)
        resolve()
      }
      this.engine.bus.on(AudioEventTypeEnum.ENDED, doneListener)
    })
  }

  playRubberChicken() {
    this.engine.play(TestAudioTypeEnum.RUBBER_CHICKEN)
  }
})()
