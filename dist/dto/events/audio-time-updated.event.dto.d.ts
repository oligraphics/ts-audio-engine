import { RuntimeAudioInstanceDto } from '../instances/runtime-audio.instance.dto';
import { AudioEventDto } from './audio.event.dto';
import { AudioEventTypeEnum } from '../../enums/audio-event-type.enum';
export type AudioTimeUpdatedEventDto = {
    type: AudioEventTypeEnum.TIME_UPDATE;
    audio: RuntimeAudioInstanceDto;
    timeMs: number;
} & AudioEventDto;
//# sourceMappingURL=audio-time-updated.event.dto.d.ts.map