import { RuntimeAudioInstanceDto } from '../instances/runtime-audio.instance.dto';
import { AudioEventDto } from './audio.event.dto';
import { AudioEventTypeEnum } from '../../enums/audio-event-type.enum';

export type AudioVolumeChangedEventDto = {
  type: AudioEventTypeEnum.VOLUME_CHANGED;
  audio: RuntimeAudioInstanceDto;
  volume: number;
} & AudioEventDto;
