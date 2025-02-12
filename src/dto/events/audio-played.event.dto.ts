import { RuntimeAudioInstanceDto } from '../instances/runtime-audio.instance.dto';
import { AudioEventDto } from './audio.event.dto';
import { AudioEventTypeEnum } from '../../enums/audio-event-type.enum';

export type AudioPlayedEventDto = {
  type: AudioEventTypeEnum.PLAYED;
  audio: RuntimeAudioInstanceDto;
} & AudioEventDto;
