import { EventBus } from 'ts-event-bus';
import { RuntimeAudioInstanceDto } from '../dto/instances/runtime-audio.instance.dto';
import { AudioConfigurationDto } from '../dto/configurations/audio.configuration.dto';
import { PlayOptionsDto } from '../dto/options/play.options.dto';
export declare class AudioEngine {
    /**
     * Bus to listen to events within the engine.
     * @see AudioEventTypeEnum
     * @see AudioEventDto
     */
    readonly bus: EventBus;
    private readonly types;
    private readonly cache;
    private readonly playing;
    private _audioConsentReceived;
    private _globalVolume;
    private _globalVolumeFactor;
    /**
     * Audio consent is received after the first click event on the document
     */
    get audioConsentReceived(): boolean;
    /**
     * Value between 0 and 1
     */
    get volume(): number;
    /**
     * Value between 0 and 1
     */
    set volume(value: number);
    /**
     * Toggle console logging
     */
    debug: boolean;
    constructor(audioTypes: AudioConfigurationDto[]);
    dispose(): void;
    getType(typeId: string): AudioConfigurationDto | undefined;
    private readonly onDocumentClicked;
    /**
     * Create a new sound instance
     */
    prepareInstance(typeId: string): RuntimeAudioInstanceDto | undefined;
    _getInstance(typeId: string): RuntimeAudioInstanceDto | undefined;
    /**
     * Play a sound instance
     */
    play(typeId: string, options?: PlayOptionsDto): RuntimeAudioInstanceDto | undefined;
    /**
     * Set the volume of a sound instance
     */
    setVolume(instance: RuntimeAudioInstanceDto, volume: number): void;
    /**
     * Pause a sound instance
     */
    pause(instance: RuntimeAudioInstanceDto): void;
    /**
     * Release a sound instance
     */
    release(instance: RuntimeAudioInstanceDto): void;
}
//# sourceMappingURL=audio-engine.model.d.ts.map