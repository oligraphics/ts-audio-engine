import { RuntimeAudioInstanceDto } from '../instances/runtime-audio.instance.dto';
import { AudioEventDto } from './audio.event.dto';
import { AudioEventTypeEnum } from '../../enums/audio-event-type.enum';
export type AudioEndedEventDto = {
    type: AudioEventTypeEnum.ENDED;
    audio: RuntimeAudioInstanceDto;
} & AudioEventDto;
//# sourceMappingURL=audio-ended.event.dto.d.ts.map