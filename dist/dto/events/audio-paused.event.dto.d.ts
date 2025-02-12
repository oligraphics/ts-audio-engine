import { RuntimeAudioInstanceDto } from '../instances/runtime-audio.instance.dto';
import { AudioEventDto } from './audio.event.dto';
import { AudioEventTypeEnum } from '../../enums/audio-event-type.enum';
export type AudioPausedEventDto = {
    type: AudioEventTypeEnum.PAUSED;
    audio: RuntimeAudioInstanceDto;
} & AudioEventDto;
//# sourceMappingURL=audio-paused.event.dto.d.ts.map