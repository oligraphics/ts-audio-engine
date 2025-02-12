import { AudioEventTypeEnum } from '../../enums/audio-event-type.enum';
import { RuntimeAudioInstanceDto } from '../instances/runtime-audio.instance.dto';
import { AudioEventDto } from './audio.event.dto';

export type AudioReleasedEventDto = {
  type: AudioEventTypeEnum.RELEASED;
  audio: RuntimeAudioInstanceDto;
} & AudioEventDto;
